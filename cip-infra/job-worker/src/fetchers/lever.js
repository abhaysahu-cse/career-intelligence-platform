const axios = require("axios");
const crypto = require("crypto");
const logger = require("../logger");

const BASE_URL = "https://api.lever.co/v1";

class LeverFetcher {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: BASE_URL,
      auth: { username: apiKey, password: "" },
      timeout: 15000,
    });
  }

  async fetchJobs(updatedAfter = null) {
    const jobs = [];
    let offset = null;
    const limit = 100;

    while (true) {
      const params = { limit, state: "published" };
      if (offset) params.offset = offset;
      if (updatedAfter) params.updated_at_start = new Date(updatedAfter).getTime();

      try {
        const { data } = await this.client.get("/postings", { params });

        if (!data?.data?.length) break;

        for (const posting of data.data) {
          jobs.push(this._normalizeJob(posting));
        }

        if (!data.hasNext) break;
        offset = data.next;
      } catch (err) {
        logger.error(`Lever fetch error: ${err.message}`);
        break;
      }
    }

    logger.info(`Lever: fetched ${jobs.length} jobs`);
    return jobs;
  }

  _normalizeJob(posting) {
    return {
      source: "lever",
      external_id: posting.id,
      dedup_key: crypto.createHash("md5").update(`lever-${posting.id}`).digest("hex"),
      company: posting.categories?.team || "Unknown",
      role: posting.text,
      description: posting.descriptionPlain || posting.description || "",
      location: posting.categories?.location || "Remote",
      employment_type: posting.categories?.commitment || "full_time",
      url: posting.hostedUrl || posting.applyUrl,
      departments: posting.categories?.department ? [posting.categories.department] : [],
      posted_at: new Date(posting.createdAt).toISOString(),
      updated_at: new Date(posting.updatedAt || posting.createdAt).toISOString(),
      status: "open",
      raw: posting,
    };
  }
}

module.exports = LeverFetcher;
