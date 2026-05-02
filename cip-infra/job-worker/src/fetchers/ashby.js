const axios = require("axios");
const crypto = require("crypto");
const logger = require("../logger");

const BASE_URL = "https://api.ashbyhq.com";

class AshbyFetcher {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: BASE_URL,
      auth: { username: apiKey, password: "" },
      timeout: 15000,
      headers: { "Content-Type": "application/json" },
    });
  }

  async fetchJobs() {
    const jobs = [];
    let cursor = null;

    while (true) {
      try {
        const body = { limit: 100 };
        if (cursor) body.cursor = cursor;

        const { data } = await this.client.post("/posting.list", body);

        if (!data?.results?.length) break;

        for (const posting of data.results) {
          if (posting.isListed && posting.publishedDate) {
            jobs.push(this._normalizeJob(posting));
          }
        }

        if (!data.moreDataAvailable) break;
        cursor = data.nextCursor;
      } catch (err) {
        logger.error(`Ashby fetch error: ${err.message}`);
        break;
      }
    }

    logger.info(`Ashby: fetched ${jobs.length} jobs`);
    return jobs;
  }

  _normalizeJob(posting) {
    return {
      source: "ashby",
      external_id: posting.id,
      dedup_key: crypto.createHash("md5").update(`ashby-${posting.id}`).digest("hex"),
      company: posting.organizationName || "Unknown",
      role: posting.title,
      description: posting.descriptionSafe || "",
      location: posting.location || "Remote",
      employment_type: posting.employmentType || "FullTime",
      url: posting.jobBoardUrl || "",
      departments: posting.department ? [posting.department] : [],
      posted_at: posting.publishedDate,
      updated_at: posting.updatedAt || posting.publishedDate,
      status: "open",
      raw: posting,
    };
  }
}

module.exports = AshbyFetcher;
