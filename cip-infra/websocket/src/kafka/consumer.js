const { Kafka, logLevel } = require("kafkajs");
const { emitToUser, emitToAll, emitToRoom } = require("../socket");
const logger = require("../logger");
const { getMetrics } = require("../metrics");

const TOPICS_TO_CONSUME = [
  "score-events",
  "interview-events",
  "notification-events",
  "job-events",
];

let kafka;
let consumer;

async function startKafkaConsumer(io) {
  kafka = new Kafka({
    clientId: "cip-websocket-server",
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    logLevel: logLevel.WARN,
    retry: {
      initialRetryTime: 300,
      retries: 10,
      multiplier: 2,
      maxRetryTime: 30000,
    },
  });

  consumer = kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID || "websocket-consumer-group",
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxWaitTimeInMs: 1000,
    maxBytesPerPartition: 1048576, // 1MB
  });

  await consumer.connect();
  logger.info("✅ Kafka consumer connected");

  // Subscribe to all relevant topics
  for (const topic of TOPICS_TO_CONSUME) {
    await consumer.subscribe({ topic, fromBeginning: false });
    logger.info(`📡 Subscribed to topic: ${topic}`);
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const metrics = getMetrics();
      const startTime = Date.now();

      try {
        const raw = message.value?.toString();
        if (!raw) return;

        const event = JSON.parse(raw);
        metrics.kafkaMessagesProcessed.inc({ topic });

        logger.debug(`📨 Kafka → topic=${topic} type=${event.event_type} userId=${event.user_id}`);

        await routeEventToWebSocket(io, topic, event);

        metrics.kafkaProcessingLatency.observe((Date.now() - startTime) / 1000);
      } catch (err) {
        logger.error(`❌ Error processing Kafka message: topic=${topic} err=${err.message}`);
        metrics.kafkaErrors.inc({ topic });
      }
    },
  });

  logger.info("🔄 Kafka consumer running");
}

async function routeEventToWebSocket(io, topic, event) {
  // Support both user_id (backend) and student_id (ML service) field names
  const { event_type, payload } = event;
  const user_id = event.user_id || event.student_id;

  switch (topic) {
    // ── Score events → user-specific update ─────────────────
    case "score-events":
      if (user_id) {
        // Backend-style: SCORE_UPDATED
        if (event_type === "SCORE_UPDATED") {
          emitToUser(io, user_id, "score:update", {
            type: "score_update",
            user_id,
            readiness: payload?.readiness_score,
            domain_scores: payload?.domain_scores,
            trend: payload?.trend,
            timestamp: event.timestamp,
          });
        }
        // ML-style: resume_scored, interview_scored, readiness_computed, academic_predicted
        else if (["resume_scored", "resume_analyzed", "interview_scored",
                  "interview_evaluated", "readiness_computed", "academic_predicted"].includes(event_type)) {
          emitToUser(io, user_id, "score:update", {
            type: event_type,
            user_id,
            // Pass through all ML result fields
            resume_score:     event.resume_score,
            interview_score:  event.overall_score || event.interview_score,
            readiness_score:  event.readiness_score,
            predicted_cgpa:   event.predicted_cgpa,
            risk_level:       event.risk_level,
            level:            event.level,
            skills:           event.skills,
            feedback:         event.feedback,
            timestamp:        event.timestamp,
          });
        }
      }
      break;

    // ── Interview events ─────────────────────────────────────
    case "interview-events":
      if (user_id) {
        if (event_type === "INTERVIEW_FEEDBACK_READY") {
          emitToUser(io, user_id, "interview:feedback", {
            type: "interview_feedback",
            user_id,
            interview_id: payload?.interview_id,
            feedback: payload?.feedback,
            score: payload?.score,
            timestamp: event.timestamp,
          });
        } else if (event_type === "INTERVIEW_STARTED") {
          emitToUser(io, user_id, "interview:started", {
            interview_id: payload?.interview_id,
            timestamp: event.timestamp,
          });
        } else if (event_type === "INTERVIEW_COMPLETED") {
          emitToUser(io, user_id, "interview:completed", {
            interview_id: payload?.interview_id,
            duration: payload?.duration,
            timestamp: event.timestamp,
          });
        }
      }
      break;

    // ── Job events → broadcast or room ──────────────────────
    case "job-events":
      if (event_type === "NEW_JOB") {
        emitToAll(io, "job:new", {
          type: "new_job",
          job_id: payload?.job_id,
          company: payload?.company,
          role: payload?.role,
          location: payload?.location,
          timestamp: event.timestamp,
        });
      } else if (event_type === "JOB_UPDATED") {
        emitToRoom(io, `job:${payload?.job_id}`, "job:update", {
          type: "job_update",
          job_id: payload?.job_id,
          changes: payload?.changes,
          timestamp: event.timestamp,
        });
      }
      break;

    // ── Notification events ──────────────────────────────────
    case "notification-events":
      if (user_id) {
        emitToUser(io, user_id, "notification", {
          type: event_type,
          title: payload?.title,
          message: payload?.message,
          severity: payload?.severity || "info",
          action_url: payload?.action_url,
          timestamp: event.timestamp,
        });
      }
      break;

    default:
      logger.debug(`No WebSocket routing for topic: ${topic}`);
  }
}

async function stopKafkaConsumer() {
  if (consumer) {
    await consumer.disconnect();
    logger.info("Kafka consumer disconnected");
  }
}

module.exports = { startKafkaConsumer, stopKafkaConsumer };
