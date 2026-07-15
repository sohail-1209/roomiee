const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const webpush = require('web-push');

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── Get VAPID public key (public route) ──
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// ── Subscribe to push notifications ──
router.post('/subscribe', protect, asyncHandler(async (req, res) => {
  const { endpoint, p256dh, auth } = req.body;
  if (!endpoint || !p256dh || !auth) {
    return res.status(400).json({ success: false, message: 'Invalid subscription' });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: req.user.id, p256dh, auth },
    create: { userId: req.user.id, endpoint, p256dh, auth },
  });

  res.json({ success: true });
}));

// ── Unsubscribe from push notifications ──
router.post('/unsubscribe', protect, asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  } else {
    await prisma.pushSubscription.deleteMany({ where: { userId: req.user.id } });
  }
  res.json({ success: true });
}));

// ── Send notification to a user (internal helper) ──
async function sendPushToUser(userId, title, body, data = {}) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const payload = JSON.stringify({ title, body, data });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err) {
      // Remove expired/invalid subscriptions
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
}

// ── Send welcome notifications (after subscribe) ──
router.post('/welcome', protect, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  // Staggered welcome notifications
  setTimeout(() => {
    sendPushToUser(req.user.id, 'Welcome to Houziee! 🏠', 'Find your perfect home on campus.', { url: '/' });
  }, 2000);

  setTimeout(() => {
    sendPushToUser(req.user.id, 'Explore Listings', 'Browse thousands of student-friendly rentals.', { url: '/search' });
  }, 30000);

  setTimeout(() => {
    sendPushToUser(req.user.id, 'Complete Your Profile', 'Add a photo and bio to build trust with owners.', { url: '/dashboard/profile' });
  }, 120000);

  res.json({ success: true });
}));

module.exports = router;
module.exports.sendPushToUser = sendPushToUser;
