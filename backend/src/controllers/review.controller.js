// Review controller
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /reviews ────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { receiverId, listingId, rating, comment } = req.body;
  if (rating < 1 || rating > 5) throw new AppError('Rating must be 1-5', 400);
  if (receiverId === req.user.id) throw new AppError('Cannot review yourself', 400);

  const review = await prisma.review.create({
    data: { reviewerId: req.user.id, receiverId, listingId, rating, comment },
  });

  // Update receiver's average rating
  const stats = await prisma.review.aggregate({
    where: { receiverId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.user.update({
    where: { id: receiverId },
    data: { avgRating: stats._avg.rating || 0, totalRatings: stats._count.rating },
  });

  res.status(201).json({ success: true, data: review });
});

// ─── GET /reviews/:userId ──────────────────────────────
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { receiverId: req.params.userId },
    include: {
      reviewer: { select: { id: true, name: true, profileImage: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: reviews });
});

module.exports = { createReview, getUserReviews };
