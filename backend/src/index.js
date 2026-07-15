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
    origin: true, // Allow all origins for development
    credentials: true,
  },
});
initSocket(io);

// ─── Global middleware ────────────────────────
app.use(cors({
  origin: true, // Allow all origins for development
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

// Debug endpoint to verify connection
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'pong', 
    origin: req.headers.origin,
    host: req.headers.host,
    timestamp: new Date().toISOString()
  });
});

// ─── Error handler (must be last) ─────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Get network IP
const getNetworkIP = () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

httpServer.listen(PORT, '0.0.0.0', () => {
  const networkIP = getNetworkIP();
  console.log('');
  console.log('  🚀 Roomiee API running at:');
  console.log(`  → Local:   http://localhost:${PORT}`);
  console.log(`  → Network: http://${networkIP}:${PORT}`);
  console.log('');
});
