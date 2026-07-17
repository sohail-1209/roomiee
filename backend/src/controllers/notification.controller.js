// Notification controller
const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /notifications ───────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: notifications });
});

// ─── PATCH /notifications/read-all ────────────────────
const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });
  res.json({ success: true });
});

// ─── PATCH /notifications/:id/read ────────────────────
const markRead = asyncHandler(async (req, res) => {
  await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  res.json({ success: true });
});

// ─── DELETE /notifications/:id ────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  await prisma.notification.delete({
    where: { id: req.params.id, userId: req.user.id },
  });
  res.json({ success: true });
});

module.exports = { getNotifications, markAllRead, markRead, deleteNotification };
