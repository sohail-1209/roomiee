// Socket.io service — real-time chat
// All socket logic in one place — no duplication
const prisma = require('../utils/prisma');

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
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat || (chat.ownerId !== socket.userId && chat.tenantId !== socket.userId)) {
          return callback?.({ error: 'Unauthorized' });
        }

        const message = await prisma.message.create({
          data: { chatId, senderId: socket.userId, content, imageUrl },
          include: {
            sender: { select: { id: true, name: true, profileImage: true } },
          },
        });

        // Broadcast to all in the chat room
        io.to(`chat:${chatId}`).emit('new_message', message);
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
    });
  });
};

// ─── Send real-time event to a specific user ──────────
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initSocket, emitToUser };
