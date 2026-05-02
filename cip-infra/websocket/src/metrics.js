const client = require("prom-client");
const express = require("express");

let metrics;

function setupMetrics() {
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });

  metrics = {
    activeConnections: new client.Gauge({
      name: "cip_ws_active_connections",
      help: "Number of active WebSocket connections",
      registers: [register],
    }),
    kafkaMessagesProcessed: new client.Counter({
      name: "cip_ws_kafka_messages_processed_total",
      help: "Total Kafka messages processed",
      labelNames: ["topic"],
      registers: [register],
    }),
    kafkaErrors: new client.Counter({
      name: "cip_ws_kafka_errors_total",
      help: "Total Kafka processing errors",
      labelNames: ["topic"],
      registers: [register],
    }),
    kafkaProcessingLatency: new client.Histogram({
      name: "cip_ws_kafka_processing_latency_seconds",
      help: "Kafka message processing latency",
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [register],
    }),
    wsEventsEmitted: new client.Counter({
      name: "cip_ws_events_emitted_total",
      help: "Total WebSocket events emitted",
      labelNames: ["event"],
      registers: [register],
    }),
  };

  const metricsRouter = express.Router();
  metricsRouter.get("/", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  return { metricsRouter, register };
}

function getMetrics() {
  return metrics;
}

module.exports = { setupMetrics, getMetrics };
