// Auth Service — Google OAuth + Email Verification
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google OAuth token and return user info
 */
async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    profileImage: payload.picture,
    emailVerified: payload.email_verified,
  };
}

/**
 * Find or create user from Google auth
 * Returns { user, isNew, needsProfile, googleInfo }
 */
async function handleGoogleAuth({ googleId, email, name, profileImage }) {
  // Check if user exists by googleId
  let user = await prisma.user.findUnique({ where: { googleId } });

  if (user) {
    return { user, isNew: false, needsProfile: false };
  }

  // Check if user exists by email (normal registration) — link accounts
  user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, profileImage: user.profileImage || profileImage, isVerified: true },
    });
    return { user, isNew: false, needsProfile: false };
  }

  // New user — do NOT create in DB yet, return Google info for temp token
  return {
    user: null,
    isNew: true,
    needsProfile: true,
    googleInfo: { googleId, email, name, profileImage },
  };
}

/**
 * Create a new Google user after profile is submitted
 */
async function createGoogleUser({ googleId, email, name, profileImage, phone, role }) {
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) throw new AppError('Phone number already in use', 409);
  }

  const user = await prisma.user.create({
    data: {
      googleId,
      email,
      name: name || email.split('@')[0],
      profileImage,
      phone: phone || null,
      role: role || 'TENANT',
      isVerified: true,
      password: null,
    },
  });

  return user;
}

/**
 * Complete Google user profile (phone, role)
 */
async function completeGoogleProfile(userId, { name, phone, role }) {
  const updateData = { role };

  if (name) updateData.name = name;

  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== userId) {
      throw new AppError('Phone number already in use', 409);
    }
    updateData.phone = phone;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return user;
}

/**
 * Generate email verification token
 */
async function generateVerificationToken(userId) {
  // Delete old tokens for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { userId, type: 'EMAIL_VERIFICATION' },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Verify email token
 */
async function verifyEmailToken(token) {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    throw new AppError('Invalid verification token', 400);
  }

  if (record.type !== 'EMAIL_VERIFICATION') {
    throw new AppError('Invalid token type', 400);
  }

  if (record.expiresAt < new Date()) {
    throw new AppError('Verification token expired', 400);
  }

  // Mark user as verified
  await prisma.user.update({
    where: { id: record.userId },
    data: { isVerified: true },
  });

  // Delete the used token
  await prisma.emailVerificationToken.delete({
    where: { id: record.id },
  });

  return record.user;
}

module.exports = {
  verifyGoogleToken,
  handleGoogleAuth,
  createGoogleUser,
  completeGoogleProfile,
  generateVerificationToken,
  verifyEmailToken,
};
