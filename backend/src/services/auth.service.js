// Auth Service — Google OAuth + Email Verification
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

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
 * Returns { user, isNew, needsProfile } 
 */
async function handleGoogleAuth({ googleId, email, name, profileImage }) {
  // Check if user exists by googleId
  let user = await prisma.user.findUnique({ where: { googleId } });

  if (user) {
    return { user, isNew: false, needsProfile: false };
  }

  // Check if user exists by email (normal registration)
  user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Link Google account to existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, profileImage: user.profileImage || profileImage },
    });
    return { user, isNew: false, needsProfile: false };
  }

  // New user — needs to complete profile (phone, role)
  user = await prisma.user.create({
    data: {
      googleId,
      email,
      name,
      profileImage,
      isVerified: true, // Google emails are pre-verified
      password: null, // No password for Google users
    },
  });

  return { user, isNew: true, needsProfile: true };
}

/**
 * Complete Google user profile (phone, role)
 */
async function completeGoogleProfile(userId, { phone, role }) {
  const updateData = { role };

  if (phone) {
    // Check if phone is already taken
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== userId) {
      throw new Error('Phone number already in use');
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
    throw new Error('Invalid verification token');
  }

  if (record.type !== 'EMAIL_VERIFICATION') {
    throw new Error('Invalid token type');
  }

  if (record.expiresAt < new Date()) {
    throw new Error('Token expired');
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
  completeGoogleProfile,
  generateVerificationToken,
  verifyEmailToken,
};
