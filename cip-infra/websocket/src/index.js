require("dotenv").config();
const express = require("express");
const http = require("http");
const helmet = require("helmet");
const cors = require("cors");

const { createSocketServer } = require("./socket");
const { startKafkaConsumer } = require("./kafka/consumer");
const { setupMetrics } = require("./metrics");
const logger = require("./logger");

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  const app = express();

  // ── Security middleware ──────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(","),
      credentials: true,
    })
  );
  app.use(express.json());

  // ── Metrics endpoint ─────────────────────────────────────────
  const { metricsRouter } = setupMetrics();
  app.use("/metrics", metricsRouter);

  // ── Health check ─────────────────────────────────────────────
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "cip-websocket",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ── HTTP + Socket.IO server ──────────────────────────────────
  const httpServer = http.createServer(app);
  const io = createSocketServer(httpServer);

  // ── Start Kafka consumer ─────────────────────────────────────
  await startKafkaConsumer(io);

  httpServer.listen(PORT, () => {
    logger.info(`🚀 CIP WebSocket Server running on port ${PORT}`);
  });

  // ── Graceful shutdown ────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    httpServer.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
