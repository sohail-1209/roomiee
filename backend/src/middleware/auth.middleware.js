// Auth middleware — JWT verification + role-based access control
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── Verify JWT and attach user to req ────────
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) throw new AppError('Not authenticated', 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true, name: true, email: true, role: true,
      isVerified: true, isBanned: true, profileImage: true,
    },
  });

  if (!user) throw new AppError('User no longer exists', 401);
  if (user.isBanned) throw new AppError('Account banned', 403);

  req.user = user;
  next();
});

// ─── Optional auth — attaches user if token present, doesn't block ────
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (user && !user.isBanned) req.user = user;
  } catch {
    // Invalid token — just continue as guest
  }
  next();
});

// ─── Role-based access ────────────────────────
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Permission denied', 403));
  }
  next();
};

module.exports = { protect, optionalAuth, restrictTo };
