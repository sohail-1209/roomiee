// Admin routes — protected by ADMIN role
const router = require('express').Router();
const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { sendNotification } = require('../services/notification.service');

router.use(protect, restrictTo('ADMIN'));

// ─── Users ────────────────────────────────────────────
router.get('/users', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isVerified: true, isBanned: true, avgRating: true, createdAt: true,
      _count: { select: { listings: true, sentRequests: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: users });
}));

router.patch('/users/:id/ban', asyncHandler(async (req, res) => {
  const { isBanned } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBanned },
  });

  // Notify the user if banned
  if (isBanned) {
    await sendNotification({
      userId: user.id,
      fcmToken: user.fcmToken,
      title: '🚫 Account Suspended',
      body: 'Your account has been suspended by an administrator. Please contact support for more information.',
      type: 'ACCOUNT_BANNED',
      data: {},
    });
  }

  res.json({ success: true, data: user });
}));

// ─── Listings ──────────────────────────────────────────
router.get('/listings', asyncHandler(async (req, res) => {
  const listings = await prisma.listing.findMany({
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: listings });
}));

router.patch('/listings/:id/verify', asyncHandler(async (req, res) => {
  const listing = await prisma.listing.update({
    where: { id: req.params.id },
    data: { status: 'ACTIVE' },
    include: { owner: { select: { id: true, name: true, fcmToken: true } } },
  });

  // Notify the listing owner
  await sendNotification({
    userId: listing.ownerId,
    fcmToken: listing.owner.fcmToken,
    title: '✅ Listing Verified',
    body: `Your listing "${listing.title}" has been verified and is now active.`,
    type: 'LISTING_VERIFIED',
    data: { listingId: listing.id },
  });

  res.json({ success: true, data: listing });
}));

// ─── Analytics ─────────────────────────────────────────
router.get('/analytics', asyncHandler(async (req, res) => {
  const [users, listings, requests, reports] = await prisma.$transaction([
    prisma.user.count(),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.request.count(),
    prisma.report.count({ where: { status: 'OPEN' } }),
  ]);
  res.json({ success: true, data: { users, listings, requests, openReports: reports } });
}));

module.exports = router;
