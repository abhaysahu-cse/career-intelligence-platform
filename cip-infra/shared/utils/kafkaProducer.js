/**
 * Shared CIP Kafka Producer Utility
 * Copy this into any service that needs to publish events.
 * Usage:
 *   const producer = new CIPKafkaProducer();
 *   await producer.connect();
 *   await producer.publish("score-events", "SCORE_UPDATED", { user_id: "123", ... }, "123");
 */

const { Kafka, logLevel, CompressionTypes, Partitioners } = require("kafkajs");

class CIPKafkaProducer {
  constructor(options = {}) {
    const kafka = new Kafka({
      clientId: options.clientId || "cip-service",
      brokers: (options.brokers || process.env.KAFKA_BROKERS || "localhost:9092").split(","),
      logLevel: logLevel.WARN,
      retry: { retries: 10, initialRetryTime: 300 },
    });

    this.producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: false,
      idempotent: true,
      maxInFlightRequests: 1,
    });

    this.serviceName = options.serviceName || "unknown-service";
  }

  async connect() {
    await this.producer.connect();
  }

  async disconnect() {
    await this.producer.disconnect();
  }

  /**
   * Publish a single CIP event
   */
  async publish(topic, eventType, payload, partitionKey = null) {
    const event = {
      event_type: eventType,
      user_id: payload.user_id || null,
      timestamp: new Date().toISOString(),
      source: this.serviceName,
      version: "1.0",
      payload,
    };

    await this.producer.send({
      topic,
      compression: CompressionTypes.LZ4,
      messages: [{
        key: partitionKey ? String(partitionKey) : null,
        value: JSON.stringify(event),
        headers: {
          "event-type": eventType,
          "content-type": "application/json",
          source: this.serviceName,
        },
      }],
    });
  }

  /**
   * Publish multiple events at once (same topic)
   */
  async publishBatch(topic, events) {
    const messages = events.map(({ eventType, payload, key }) => ({
      key: key ? String(key) : null,
      value: JSON.stringify({
        event_type: eventType,
        user_id: payload.user_id || null,
        timestamp: new Date().toISOString(),
        source: this.serviceName,
        version: "1.0",
        payload,
      }),
      headers: { "event-type": eventType, "content-type": "application/json" },
    }));

    await this.producer.send({ topic, compression: CompressionTypes.LZ4, messages });
  }
}

module.exports = { CIPKafkaProducer };
