// Entry point — Houziee Backend
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
const pushRoutes = require('./routes/push.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();
const httpServer = http.createServer(app);

// ─── CORS ─────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'https://houziee.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


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
app.use('/api/push', pushRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Debug endpoint
app.get('/api/ping', (req, res) => {
  res.json({
    message: 'pong',
    origin: req.headers.origin,
    host: req.headers.host,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ─── Error handler (must be last) ─────────────
app.use(errorHandler);

// ─── Socket.io ───────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
initSocket(io);

// ─── Start ────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  🚀 Houziee API running at:');
  console.log(`  → Port:    ${PORT}`);
  console.log(`  → Env:     ${process.env.NODE_ENV || 'development'}`);
  console.log(`  → CORS:    ${allowedOrigins.join(', ')}`);
  console.log('');
});
