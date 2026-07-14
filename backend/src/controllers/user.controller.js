// User controller — profile, update
const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// ─── GET /users/:id — public profile ─────────────────
const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, profileImage: true, bio: true,
      avgRating: true, totalRatings: true, role: true, isVerified: true,
      createdAt: true,
      _count: { select: { listings: true, reviewsReceived: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
});

// ─── PATCH /users/me — update profile ────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, bio } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, phone, bio },
    select: {
      id: true, name: true, email: true, phone: true,
      profileImage: true, bio: true, avgRating: true, role: true,
    },
  });
  res.json({ success: true, data: updated });
});

module.exports = { getUser, updateProfile };
