require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// === FIX: PREVENT MEMORY LEAK WARNING ===
server.setMaxListeners(20);

// ==================== CONFIGURATION ====================
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
];

// ==================== SOCKET.IO SETUP ====================
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8,
  transports: ['websocket', 'polling'],
});

// ==================== MIDDLEWARE ====================
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

// ==================== DATABASE ====================
if (!process.env.MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI missing in .env");
  process.exit(1);
}

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  });

// ==================== SOCKET.IO EVENTS ====================
io.on("connection", (socket) => {
  socket.join("clinic_main");

  socket.on("joinClinic", (clinicId = "clinic_main") => {
    socket.leaveAll();
    socket.join(clinicId);
  });

  socket.on("disconnect", (reason) => {
    // console.log(`Socket Disconnected: ${socket.id}`);
  });
});

global.io = io;

// ==================== ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/medical', require('./routes/medical'));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Omisha Clinic Hospital Queue System',
    timestamp: new Date().toISOString(),
  });
});

// Catch-All 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    path: req.originalUrl,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ==================== START SERVER & SHUTDOWN LOGIC ====================
const activeServer = server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ OMISHA CLINIC IS LIVE`);
  console.log(`📡 Backend: http://localhost:${PORT}`);
  console.log(``);
});

// Explicit Graceful Shutdown
const gracefulShutdown = () => {
  console.log('\n🔻 Shutting down server...');

  activeServer.close(() => {
    console.log('✅ HTTP Server closed');

    // Close DB Connection
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB Connection closed');
      process.exit(0); // Explicitly force exit
    });
  });

  // Force exit if it takes too long (e.g. 5 seconds)
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown...');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown); // Captures Ctrl+C

module.exports = { app, server, io };