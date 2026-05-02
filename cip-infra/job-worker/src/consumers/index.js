const { Kafka, logLevel } = require("kafkajs");
const { publishEvent } = require("../producers/kafkaProducer");
const logger = require("../logger");

let consumer;

async function startKafkaConsumers() {
  const kafka = new Kafka({
    clientId: "cip-job-worker-consumer",
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    logLevel: logLevel.WARN,
    retry: { retries: 10, initialRetryTime: 300 },
  });

  consumer = kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID || "job-worker-consumer-group",
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  await consumer.connect();

  // Listen for student events that require job matching
  await consumer.subscribe({ topic: "student-events", fromBeginning: false });
  await consumer.subscribe({ topic: "resume-events", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value?.toString());
        await handleEvent(topic, event);
      } catch (err) {
        logger.error(`Consumer error: topic=${topic} ${err.message}`);
      }
    },
  });

  logger.info("✅ Job worker consumers started");
}

async function handleEvent(topic, event) {
  const { event_type, user_id, payload } = event;

  switch (event_type) {
    case "PROFILE_UPDATED":
    case "SKILLS_UPDATED":
      // Trigger job matching when student profile changes
      await publishEvent(
        "job-events",
        "JOB_MATCH_REQUESTED",
        {
          user_id,
          skills: payload?.skills || [],
          experience_level: payload?.experience_level,
          preferences: payload?.job_preferences,
        },
        user_id
      );
      break;

    case "RESUME_PARSED":
      // After resume parse, trigger score update
      await publishEvent(
        "score-events",
        "SCORE_RECALC_REQUESTED",
        {
          user_id,
          trigger: "resume_parsed",
          resume_id: payload?.resume_id,
        },
        user_id
      );
      break;

    default:
      // No action needed
      break;
  }
}

module.exports = { startKafkaConsumers };
