const { Kafka, logLevel, CompressionTypes, Partitioners } = require("kafkajs");
const logger = require("../logger");

let producer;
let kafka;

async function initKafkaProducer() {
  kafka = new Kafka({
    clientId: "cip-job-worker",
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    logLevel: logLevel.WARN,
    retry: { retries: 10, initialRetryTime: 300 },
  });

  producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
    allowAutoTopicCreation: false,
    transactionTimeout: 30000,
    idempotent: true, // exactly-once semantics
    maxInFlightRequests: 1,
  });

  await producer.connect();
  logger.info("✅ Kafka producer connected");
}

/**
 * Publish a standardized CIP event to a Kafka topic.
 * @param {string} topic
 * @param {string} eventType
 * @param {object} payload
 * @param {string|null} key  — used for partition affinity (e.g., userId or jobId)
 */
async function publishEvent(topic, eventType, payload, key = null) {
  if (!producer) throw new Error("Kafka producer not initialized");

  const event = {
    event_type: eventType,
    user_id: payload.user_id || null,
    timestamp: new Date().toISOString(),
    source: "job-worker",
    version: "1.0",
    payload,
  };

  await producer.send({
    topic,
    compression: CompressionTypes.LZ4,
    messages: [
      {
        key: key ? String(key) : null,
        value: JSON.stringify(event),
        headers: {
          "event-type": eventType,
          "content-type": "application/json",
          source: "cip-job-worker",
        },
      },
    ],
  });

  logger.debug(`📤 Published → topic=${topic} type=${eventType} key=${key}`);
}

async function publishBatch(topic, events) {
  if (!producer) throw new Error("Kafka producer not initialized");

  const messages = events.map(({ eventType, payload, key }) => ({
    key: key ? String(key) : null,
    value: JSON.stringify({
      event_type: eventType,
      timestamp: new Date().toISOString(),
      source: "job-worker",
      version: "1.0",
      payload,
    }),
    headers: { "event-type": eventType, "content-type": "application/json" },
  }));

  await producer.send({ topic, compression: CompressionTypes.LZ4, messages });
  logger.info(`📦 Batch published → topic=${topic} count=${messages.length}`);
}

async function disconnectProducer() {
  if (producer) await producer.disconnect();
}

module.exports = { initKafkaProducer, publishEvent, publishBatch, disconnectProducer };
