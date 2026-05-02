const cron = require("node-cron");
const { runJobIngestion } = require("../fetchers/jobIngestion");
const { publishEvent } = require("../producers/kafkaProducer");
const logger = require("../logger");

let schedulers = [];

async function startSchedulers() {
  const intervalMinutes = parseInt(process.env.JOB_FETCH_INTERVAL_MINUTES) || 15;

  logger.info(`⏱️  Starting schedulers (job fetch every ${intervalMinutes} min)`);

  // ── Job fetching cron ────────────────────────────────────────
  const jobFetchExpression = `*/${intervalMinutes} * * * *`;
  const jobFetchScheduler = cron.schedule(jobFetchExpression, async () => {
    logger.info("⏰ Cron: job ingestion triggered");
    try {
      await runJobIngestion();
    } catch (err) {
      logger.error(`Cron job fetch error: ${err.message}`);
    }
  });
  schedulers.push(jobFetchScheduler);

  // ── Score recalculation trigger (every hour) ─────────────────
  const scoreRecalcScheduler = cron.schedule("0 * * * *", async () => {
    logger.info("⏰ Cron: score recalculation triggered");
    try {
      await publishEvent(
        "score-events",
        "BATCH_SCORE_RECALC_REQUESTED",
        { triggered_by: "scheduler", timestamp: new Date().toISOString() },
        "batch-recalc"
      );
    } catch (err) {
      logger.error(`Cron score recalc error: ${err.message}`);
    }
  });
  schedulers.push(scoreRecalcScheduler);

  // ── Data cleanup (daily at 2am) ──────────────────────────────
  const cleanupScheduler = cron.schedule("0 2 * * *", async () => {
    logger.info("⏰ Cron: data cleanup triggered");
    try {
      await publishEvent(
        "student-events",
        "DATA_CLEANUP_REQUESTED",
        { triggered_by: "scheduler", timestamp: new Date().toISOString() },
        "cleanup"
      );
    } catch (err) {
      logger.error(`Cron cleanup error: ${err.message}`);
    }
  });
  schedulers.push(cleanupScheduler);

  // ── Run job fetch immediately on startup ──────────────────────
  logger.info("🚀 Running initial job fetch on startup...");
  try {
    await runJobIngestion();
  } catch (err) {
    logger.warn(`Initial job fetch failed (will retry on next cron): ${err.message}`);
  }

  logger.info(`✅ ${schedulers.length} schedulers active`);
}

async function stopSchedulers() {
  for (const scheduler of schedulers) {
    scheduler.destroy();
  }
  schedulers = [];
  logger.info("Schedulers stopped");
}

module.exports = { startSchedulers, stopSchedulers };
