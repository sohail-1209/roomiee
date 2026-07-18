// Chat controller — messages, chat list
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendNotification } = require('../services/notification.service');

// ─── GET /chats — list all chats for current user ─────
const getChats = asyncHandler(async (req, res) => {
  const chats = await prisma.chat.findMany({
    where: {
      OR: [{ ownerId: req.user.id }, { tenantId: req.user.id }],
    },
    include: {
      owner: { select: { id: true, name: true, profileImage: true, phone: true, isOnline: true, lastSeen: true, avgRating: true, totalRatings: true } },
      tenant: { select: { id: true, name: true, profileImage: true, phone: true, isOnline: true, lastSeen: true, avgRating: true, totalRatings: true } },
      listing: { select: { id: true, title: true, city: true } },
      request: {
        select: {
          id: true,
          status: true,
          message: true,
          createdAt: true,
          tenant: { select: { id: true, name: true, profileImage: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // Last message preview
      },
      _count: {
        select: {
          messages: { where: { seen: false, senderId: { not: req.user.id } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: chats });
});

// ─── GET /chats/:id/messages — paginated messages ─────
const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const chat = await prisma.chat.findUnique({ where: { id: req.params.id } });
  if (!chat) throw new AppError('Chat not found', 404);
  if (chat.ownerId !== req.user.id && chat.tenantId !== req.user.id) {
    throw new AppError('Not authorized', 403);
  }

  const [messages, total] = await prisma.$transaction([
    prisma.message.findMany({
      where: { chatId: req.params.id },
      include: {
        sender: { select: { id: true, name: true, profileImage: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.message.count({ where: { chatId: req.params.id } }),
  ]);

  // Mark messages as seen
  await prisma.message.updateMany({
    where: { chatId: req.params.id, senderId: { not: req.user.id }, seen: false },
    data: { seen: true },
  });

  res.json({
    success: true,
    data: messages.reverse(), // Oldest first
    pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) },
  });
});

// ─── POST /chats/:id/messages — send message (REST fallback) ─
const sendMessage = asyncHandler(async (req, res) => {
  const { content, imageUrl } = req.body;

  const chat = await prisma.chat.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, fcmToken: true } },
      tenant: { select: { id: true, name: true, fcmToken: true } },
      listing: { select: { id: true, title: true, status: true } },
      request: { select: { status: true } },
    },
  });
  if (!chat) throw new AppError('Chat not found', 404);
  if (chat.ownerId !== req.user.id && chat.tenantId !== req.user.id) {
    throw new AppError('Not authorized', 403);
  }

  // Check if request was rejected
  if (chat.request?.status === 'REJECTED') {
    throw new AppError('This request was declined. Messaging has been disabled.', 400);
  }

  const message = await prisma.message.create({
    data: { chatId: req.params.id, senderId: req.user.id, content, imageUrl },
    include: { sender: { select: { id: true, name: true, profileImage: true } } },
  });

  // Notify the other user in the chat
  const recipient = chat.ownerId === req.user.id ? chat.tenant : chat.owner;
  const senderName = req.user.name;
  const listingTitle = chat.listing?.title || 'your listing';

  await sendNotification({
    userId: recipient.id,
    fcmToken: recipient.fcmToken,
    title: '💬 New Message',
    body: `${senderName} sent a message in "${listingTitle}"`,
    type: 'NEW_MESSAGE',
    data: { chatId: chat.id, messageId: message.id, listingId: chat.listingId },
  });

  res.status(201).json({ success: true, data: message });
});

module.exports = { getChats, getMessages, sendMessage };
