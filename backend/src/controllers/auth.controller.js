// Auth controller — register, login, refresh, logout, google, email verification
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
  verifyGoogleToken,
  handleGoogleAuth,
  completeGoogleProfile,
  generateVerificationToken,
  verifyEmailToken,
} = require('../services/auth.service');

// ─── Token helpers ────────────────────────────
const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.REFRESH_SECRET, { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' });

const sendTokens = async (user, res, statusCode = 200) => {
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  // Store refresh token in DB
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

  // HttpOnly cookie for web security
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { password: _, ...safeUser } = user;
  res.status(statusCode).json({
    success: true,
    data: { user: safeUser, accessToken, refreshToken },
  });
};

// ─── Register ─────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
  });
  if (existing) throw new AppError('Email or phone already registered', 409);

  // Only allow TENANT or OWNER on self-registration
  const allowedRole = ['TENANT', 'OWNER'].includes(role) ? role : 'TENANT';

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed, role: allowedRole },
  });

  await sendTokens(user, res, 201);
});

// ─── Login ────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid credentials', 401);

  if (user.isBanned) throw new AppError('Account banned', 403);

  await sendTokens(user, res);
});

// ─── Refresh Token ────────────────────────────
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new AppError('No refresh token', 401);

  const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.userId !== decoded.id || stored.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { token } });

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new AppError('User not found', 401);

  await sendTokens(user, res);
});

// ─── Logout ───────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
});

// ─── Get current user ─────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      profileImage: true, bio: true, avgRating: true, totalRatings: true,
      isVerified: true, createdAt: true,
    },
  });
  res.json({ success: true, data: user });
});

// ─── Update FCM token ─────────────────────────
const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  await prisma.user.update({ where: { id: req.user.id }, data: { fcmToken } });
  res.json({ success: true });
});

// ─── Google OAuth Login/Register ───────────────
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError('Google ID token required', 400);

  const googleUser = await verifyGoogleToken(idToken);
  const { user, isNew, needsProfile } = await handleGoogleAuth(googleUser);

  if (user.isBanned) throw new AppError('Account banned', 403);

  if (needsProfile) {
    // Return partial user data — frontend will redirect to complete profile
    const { password: _, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      data: {
        user: safeUser,
        isNew: true,
        needsProfile: true,
        accessToken: signAccessToken(user.id),
      },
    });
  }

  await sendTokens(user, res);
});

// ─── Complete Google user profile ──────────────
const completeProfile = asyncHandler(async (req, res) => {
  const { phone, role } = req.body;

  const allowedRole = ['TENANT', 'OWNER'].includes(role) ? role : 'TENANT';

  const user = await completeGoogleProfile(req.user.id, {
    phone: phone || undefined,
    role: allowedRole,
  });

  await sendTokens(user, res);
});

// ─── Send email verification ───────────────────
const sendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError('User not found', 404);

  if (user.isVerified) {
    return res.json({ success: true, message: 'Email already verified' });
  }

  const { token } = await generateVerificationToken(user.id);

  // In production, send email here. For now, return the verification URL
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  console.log(`📧 Email verification URL: ${verificationUrl}`);

  res.json({
    success: true,
    message: 'Verification email sent',
    // Remove this in production — only for development
    verificationUrl,
  });
});

// ─── Verify email with token ───────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new AppError('Verification token required', 400);

  const user = await verifyEmailToken(token);
  await sendTokens(user, res);
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateFcmToken,
  googleAuth,
  completeProfile,
  sendVerificationEmail,
  verifyEmail,
};
