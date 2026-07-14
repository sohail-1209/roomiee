// Entry point — Roomiee Backend
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { initSocket } = require('./services/socket');

// Routes
const authRoutes = require('./routes/auth.routes');
const listingRoutes = require('./routes/listing.routes');
const searchRoutes = require('./routes/search.routes');
const requestRoutes = require('./routes/request.routes');
const chatRoutes = require('./routes/chat.routes');
const savedRoutes = require('./routes/saved.routes');
const reviewRoutes = require('./routes/review.routes');
const reportRoutes = require('./routes/report.routes');
const uploadRoutes = require('./routes/upload.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io ───────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.MOBILE_URL],
    credentials: true,
  },
});
initSocket(io);

// ─── Global middleware ────────────────────────
app.use(cors({
  origin: [process.env.CLIENT_URL, process.env.MOBILE_URL],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const path = require('path');
const fs = require('fs');
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ─── Routes ──────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── Error handler (must be last) ─────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Roomiee API running on port ${PORT}`);
});
