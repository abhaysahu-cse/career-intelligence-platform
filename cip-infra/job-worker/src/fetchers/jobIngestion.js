const GreenhouseFetcher = require("../fetchers/greenhouse");
const LeverFetcher = require("../fetchers/lever");
const AshbyFetcher = require("../fetchers/ashby");
const { publishEvent, publishBatch } = require("../producers/kafkaProducer");
const logger = require("../logger");

// In-memory dedup store (replace with Redis for multi-instance)
const dedupCache = new Set();
const DEDUP_MAX_SIZE = 50000;

// Last fetch times per source
const lastFetchTimes = {};

async function runJobIngestion() {
  logger.info("🔄 Job ingestion cycle starting...");
  const startTime = Date.now();

  const results = await Promise.allSettled([
    fetchFromSource("greenhouse", GreenhouseFetcher, process.env.GREENHOUSE_API_KEY),
    fetchFromSource("lever", LeverFetcher, process.env.LEVER_API_KEY),
    fetchFromSource("ashby", AshbyFetcher, process.env.ASHBY_API_KEY),
  ]);

  let totalNew = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      totalNew += result.value;
    } else {
      logger.error(`Fetch failed: ${result.reason?.message}`);
    }
  }

  const elapsed = Date.now() - startTime;
  logger.info(`✅ Job ingestion complete — ${totalNew} new jobs published in ${elapsed}ms`);

  return totalNew;
}

async function fetchFromSource(sourceName, FetcherClass, apiKey) {
  if (!apiKey) {
    logger.debug(`Skipping ${sourceName} — no API key configured`);
    return 0;
  }

  try {
    const fetcher = new FetcherClass(apiKey);
    const updatedAfter = lastFetchTimes[sourceName] || null;
    const jobs = await fetcher.fetchJobs(updatedAfter);

    lastFetchTimes[sourceName] = new Date().toISOString();

    const newJobs = jobs.filter((job) => !isDuplicate(job.dedup_key));

    if (newJobs.length === 0) {
      logger.info(`${sourceName}: 0 new jobs (all deduplicated)`);
      return 0;
    }

    // Register in dedup cache
    for (const job of newJobs) {
      addToDedup(job.dedup_key);
    }

    // Publish batch to Kafka
    const events = newJobs.map((job) => ({
      eventType: "NEW_JOB",
      key: job.dedup_key,
      payload: {
        job_id: job.dedup_key,
        source: job.source,
        external_id: job.external_id,
        company: job.company,
        role: job.role,
        description: job.description,
        location: job.location,
        employment_type: job.employment_type,
        url: job.url,
        departments: job.departments,
        posted_at: job.posted_at,
        updated_at: job.updated_at,
      },
    }));

    await publishBatch("job-events", events);
    logger.info(`${sourceName}: published ${newJobs.length} new jobs`);

    return newJobs.length;
  } catch (err) {
    logger.error(`${sourceName} ingestion error: ${err.message}`);
    throw err;
  }
}

function isDuplicate(dedupKey) {
  return dedupCache.has(dedupKey);
}

function addToDedup(dedupKey) {
  // Evict oldest entries if cache is too large
  if (dedupCache.size >= DEDUP_MAX_SIZE) {
    const firstKey = dedupCache.values().next().value;
    dedupCache.delete(firstKey);
  }
  dedupCache.add(dedupKey);
}

module.exports = { runJobIngestion };
