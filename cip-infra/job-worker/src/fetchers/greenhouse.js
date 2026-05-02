const axios = require("axios");
const crypto = require("crypto");
const logger = require("../logger");

const BASE_URL = "https://harvest.greenhouse.io/v1";

/**
 * Greenhouse Harvest API fetcher
 * Docs: https://developers.greenhouse.io/harvest.html
 */
class GreenhouseFetcher {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: BASE_URL,
      // Greenhouse uses HTTP Basic Auth with API key as username, empty password
      auth: { username: apiKey, password: "" },
      timeout: 15000,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Fetch all open jobs, paginated
   */
  async fetchJobs(updatedAfter = null) {
    const jobs = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const params = { status: "open", per_page: perPage, page };
      if (updatedAfter) params.updated_after = updatedAfter;

      try {
        const { data } = await this.client.get("/jobs", { params });
        if (!data || data.length === 0) break;

        for (const job of data) {
          jobs.push(this._normalizeJob(job));
        }

        if (data.length < perPage) break;
        page++;
      } catch (err) {
        logger.error(`Greenhouse fetch error page=${page}: ${err.message}`);
        break;
      }
    }

    logger.info(`Greenhouse: fetched ${jobs.length} jobs`);
    return jobs;
  }

  _normalizeJob(job) {
    return {
      source: "greenhouse",
      external_id: String(job.id),
      dedup_key: crypto
        .createHash("md5")
        .update(`greenhouse-${job.id}`)
        .digest("hex"),
      company: job.departments?.[0]?.name || "Unknown",
      role: job.name,
      description: job.notes || "",
      location: job.offices?.map((o) => o.name).join(", ") || "Remote",
      employment_type: job.employment_type || "full_time",
      url: `https://boards.greenhouse.io/embed/job_app?for=${job.requisition_id}`,
      departments: job.departments?.map((d) => d.name) || [],
      posted_at: job.created_at,
      updated_at: job.updated_at,
      status: job.status,
      raw: job,
    };
  }
}

module.exports = GreenhouseFetcher;
