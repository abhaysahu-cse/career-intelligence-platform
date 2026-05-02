const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./logger");
const { getMetrics } = require("./metrics");

// ── In-memory user → socket mapping ────────────────────────────
const userSocketMap = new Map(); // userId → Set<socketId>
const socketUserMap = new Map(); // socketId → userId

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(","),
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 30000,
    pingInterval: 10000,
    connectTimeout: 15000,
  });

  // ── JWT Authentication Middleware ───────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "") ||
        socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "cip-super-secret-key-that-is-at-least-256-bits-long-for-hs256");
      socket.userId = decoded.userId || decoded.sub || decoded.id;
      socket.userRole = decoded.role || "student";

      if (!socket.userId) {
        return next(new Error("Invalid token: no userId found"));
      }

      logger.debug(`Auth OK — userId=${socket.userId} socketId=${socket.id}`);
      next();
    } catch (err) {
      logger.warn(`Auth failed — ${err.message}`);
      next(new Error("Invalid or expired token"));
    }
  });

  // ── Connection handler ──────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.userId;
    const metrics = getMetrics();

    // Register mappings
    if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
    userSocketMap.get(userId).add(socket.id);
    socketUserMap.set(socket.id, userId);

    // Join user-specific room
    socket.join(`user:${userId}`);

    metrics.activeConnections.inc();
    logger.info(`✅ Connected — userId=${userId} socketId=${socket.id} total=${userSocketMap.size}`);

    // ── Client events ─────────────────────────────────────────
    socket.on("subscribe:job", (jobId) => {
      socket.join(`job:${jobId}`);
      logger.debug(`userId=${userId} subscribed to job:${jobId}`);
    });

    socket.on("unsubscribe:job", (jobId) => {
      socket.leave(`job:${jobId}`);
    });

    socket.on("subscribe:interview", (interviewId) => {
      socket.join(`interview:${interviewId}`);
    });

    socket.on("ping", (cb) => {
      if (typeof cb === "function") cb({ pong: Date.now() });
    });

    // ── Disconnect handler ────────────────────────────────────
    socket.on("disconnect", (reason) => {
      const sockets = userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSocketMap.delete(userId);
      }
      socketUserMap.delete(socket.id);
      metrics.activeConnections.dec();
      logger.info(`❌ Disconnected — userId=${userId} reason=${reason}`);
    });
  });

  return io;
}

// ── Emit helpers used by Kafka consumer ────────────────────────
function emitToUser(io, userId, event, payload) {
  io.to(`user:${userId}`).emit(event, payload);
  logger.debug(`📤 emit → user:${userId} event=${event}`);
}

function emitToAll(io, event, payload) {
  io.emit(event, payload);
}

function emitToRoom(io, room, event, payload) {
  io.to(room).emit(event, payload);
}

function getConnectedUserCount() {
  return userSocketMap.size;
}

module.exports = { createSocketServer, emitToUser, emitToAll, emitToRoom, getConnectedUserCount };
