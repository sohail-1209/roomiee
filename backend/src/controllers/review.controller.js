// Review controller
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendNotification } = require('../services/notification.service');
const cache = require('../utils/cache');

// ─── POST /reviews ────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { receiverId, listingId, rating, comment } = req.body;
  if (!receiverId) throw new AppError('Receiver ID is required', 400);
  if (rating < 1 || rating > 5) throw new AppError('Rating must be 1-5', 400);
  if (receiverId === req.user.id) throw new AppError('Cannot review yourself', 400);

  // Prevent duplicate reviews (same reviewer + same receiver + same listing)
  const existing = await prisma.review.findFirst({
    where: {
      reviewerId: req.user.id,
      receiverId,
      listingId: listingId || null,
    },
  });
  if (existing) throw new AppError('You have already reviewed this user for this listing', 409);

  const review = await prisma.review.create({
    data: { reviewerId: req.user.id, receiverId, listingId, rating, comment },
    include: {
      listing: { select: { id: true, title: true } },
    },
  });

  // Update receiver's average rating
  const stats = await prisma.review.aggregate({
    where: { receiverId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const receiver = await prisma.user.update({
    where: { id: receiverId },
    data: { avgRating: stats._avg.rating || 0, totalRatings: stats._count.rating },
    select: { id: true, fcmToken: true },
  });

  // Notify the review receiver
  const stars = '⭐'.repeat(rating);
  await sendNotification({
    userId: receiverId,
    fcmToken: receiver.fcmToken,
    title: '⭐ New Review',
    body: `${req.user.name} left you a ${rating}-star review${review.listing ? ` for "${review.listing.title}"` : ''}`,
    type: 'NEW_REVIEW',
    data: { reviewId: review.id, listingId, reviewerId: req.user.id },
  });

  cache.clear();
  res.status(201).json({ success: true, data: review });
});

// ─── GET /reviews/:userId ──────────────────────────────
const getUserReviews = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const cacheKey = `reviews:${userId}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const reviews = await prisma.review.findMany({
    where: { receiverId: userId },
    include: {
      reviewer: { select: { id: true, name: true, profileImage: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const responseData = { success: true, data: reviews };
  cache.set(cacheKey, responseData, 60);
  res.json(responseData);
});

module.exports = { createReview, getUserReviews };
