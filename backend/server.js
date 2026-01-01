require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// === NEW SECURITY DEPENDENCIES ===
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');

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
// 0. CORS (MUST be first)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        console.error('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// 1. Secure Headers
app.use(helmet());

// 2. Compress Responses
app.use(compression());

// 3. Rate Limiting (1000 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // [UPDATED] Increased for Live Search
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 4. Sanitize Input (MOVED BELOW BODY PARSERS)
// app.use(mongoSanitize());


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 5. Sanitize Input (Custom Implementation for Express 5)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (/^\$/.test(key)) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  // req.query is read-only in Express 5, so we rely on Mongoose's casting for query safety
  next();
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// ==================== DATABASE ====================
// STARTUP CHECK: Ensure critical variables are present
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`❌ FATAL ERROR: Missing Environment Variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}
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
app.use('/api/users', require('./routes/users'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/medicines', require('./routes/medicines')); // [NEW] Medicine Search

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