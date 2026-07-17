// Socket.io service — real-time chat
// All socket logic in one place — no duplication
const prisma = require('../utils/prisma');
const { sendNotification } = require('./notification.service');

const activeConnections = new Map(); // userId -> Set of socket.ids

const initSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.userId}`);

    // Track active connection
    if (!activeConnections.has(socket.userId)) {
      activeConnections.set(socket.userId, new Set());
    }
    const userSockets = activeConnections.get(socket.userId);
    const isFirstConnection = userSockets.size === 0;
    userSockets.add(socket.id);

    if (isFirstConnection) {
      prisma.user.update({
        where: { id: socket.userId },
        data: { isOnline: true, lastSeen: new Date() }
      }).then(() => {
        socket.broadcast.emit('user_status_changed', { userId: socket.userId, isOnline: true });
      }).catch(err => console.error('Error updating presence on connect:', err));
    }

    // Join personal room (for notifications)
    socket.join(`user:${socket.userId}`);

    // ─── Join a chat room ──────────────────────
    socket.on('join_chat', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // ─── Send message ──────────────────────────
    socket.on('send_message', async ({ chatId, content, imageUrl }, callback) => {
      try {
        // Verify access
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: {
            owner: { select: { id: true, name: true, fcmToken: true } },
            tenant: { select: { id: true, name: true, fcmToken: true } },
            listing: { select: { id: true, title: true, status: true } },
          },
        });
        if (!chat || (chat.ownerId !== socket.userId && chat.tenantId !== socket.userId)) {
          return callback?.({ error: 'Unauthorized' });
        }

        // Check if listing is still active
        if (chat.listing && chat.listing.status !== 'ACTIVE') {
          return callback?.({ error: 'This listing is no longer active. Messaging has been disabled.' });
        }

        const message = await prisma.message.create({
          data: { chatId, senderId: socket.userId, content, imageUrl },
          include: {
            sender: { select: { id: true, name: true, profileImage: true } },
          },
        });

        // Broadcast to all in the chat room
        io.to(`chat:${chatId}`).emit('new_message', message);

        // Notify the other user
        const recipient = chat.ownerId === socket.userId ? chat.tenant : chat.owner;
        const senderName = message.sender?.name || 'Someone';
        const listingTitle = chat.listing?.title || 'your listing';

        await sendNotification({
          userId: recipient.id,
          fcmToken: recipient.fcmToken,
          title: '💬 New Message',
          body: `${senderName} sent a message in "${listingTitle}"`,
          type: 'NEW_MESSAGE',
          data: { chatId: chat.id, messageId: message.id, listingId: chat.listingId },
        });

        callback?.({ success: true, data: message });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ─── Typing indicator ─────────────────────
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping,
      });
    });

    // ─── Mark messages as seen ────────────────
    socket.on('mark_seen', async ({ chatId }) => {
      await prisma.message.updateMany({
        where: { chatId, senderId: { not: socket.userId }, seen: false },
        data: { seen: true },
      });
      socket.to(`chat:${chatId}`).emit('messages_seen', { chatId, seenBy: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.userId}`);
      const userSockets = activeConnections.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeConnections.delete(socket.userId);
          const now = new Date();
          prisma.user.update({
            where: { id: socket.userId },
            data: { isOnline: false, lastSeen: now }
          }).then(() => {
            socket.broadcast.emit('user_status_changed', { userId: socket.userId, isOnline: false, lastSeen: now });
          }).catch(err => console.error('Error updating presence on disconnect:', err));
        }
      }
    });
  });
};

// ─── Send real-time event to a specific user ──────────
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initSocket, emitToUser };
