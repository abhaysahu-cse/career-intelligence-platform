require("dotenv").config();
const express = require("express");
const { initKafkaProducer, disconnectProducer } = require("./producers/kafkaProducer");
const { startSchedulers } = require("./schedulers/jobScheduler");
const { startKafkaConsumers } = require("./consumers");
const logger = require("./logger");

const PORT = process.env.PORT || 3002;

async function bootstrap() {
  logger.info("🚀 CIP Job Worker starting...");

  // Health endpoint
  const app = express();
  app.get("/health", (req, res) =>
    res.json({ status: "ok", service: "cip-job-worker", timestamp: new Date().toISOString() })
  );
  app.listen(PORT, () => logger.info(`Health endpoint on :${PORT}`));

  // Init Kafka producer
  await initKafkaProducer();

  // Start background consumers
  await startKafkaConsumers();

  // Start cron schedulers
  await startSchedulers();

  logger.info("✅ CIP Job Worker fully initialized");

  const shutdown = async (signal) => {
    logger.info(`${signal} — shutting down`);
    await disconnectProducer();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
