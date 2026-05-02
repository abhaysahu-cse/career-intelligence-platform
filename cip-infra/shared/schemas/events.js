/**
 * CIP Event Schema Definitions
 * All Kafka events must conform to these schemas.
 * Import and use validators in your services.
 */

// ── Base event structure ──────────────────────────────────────
const BASE_EVENT = {
  event_type: "string",   // SCREAMING_SNAKE_CASE
  user_id: "string|null", // null for system events
  timestamp: "ISO8601",
  source: "string",       // service name
  version: "string",      // schema version e.g. "1.0"
  payload: "object",
};

// ── student-events ────────────────────────────────────────────
const STUDENT_EVENTS = {
  STUDENT_REGISTERED: {
    user_id: "string",
    payload: {
      email: "string",
      name: "string",
      institution: "string?",
    },
  },
  PROFILE_UPDATED: {
    user_id: "string",
    payload: {
      skills: "string[]",
      experience_level: "string",
      job_preferences: "object?",
    },
  },
  SKILLS_UPDATED: {
    user_id: "string",
    payload: { skills: "string[]" },
  },
  DATA_CLEANUP_REQUESTED: {
    user_id: null,
    payload: { triggered_by: "string" },
  },
};

// ── resume-events ─────────────────────────────────────────────
const RESUME_EVENTS = {
  RESUME_UPLOADED: {
    user_id: "string",
    payload: {
      resume_id: "string",
      file_key: "string",
      file_name: "string",
      file_size: "number",
    },
  },
  RESUME_PARSE_REQUESTED: {
    user_id: "string",
    payload: { resume_id: "string", file_key: "string" },
  },
  RESUME_PARSED: {
    user_id: "string",
    payload: {
      resume_id: "string",
      skills: "string[]",
      experience: "object[]",
      education: "object[]",
      summary: "string?",
    },
  },
  RESUME_PARSE_FAILED: {
    user_id: "string",
    payload: { resume_id: "string", error: "string" },
  },
};

// ── interview-events ──────────────────────────────────────────
const INTERVIEW_EVENTS = {
  INTERVIEW_STARTED: {
    user_id: "string",
    payload: {
      interview_id: "string",
      type: "string",        // "technical" | "behavioral" | "mixed"
      topic: "string?",
    },
  },
  INTERVIEW_COMPLETED: {
    user_id: "string",
    payload: {
      interview_id: "string",
      answers: "object[]",
      duration: "number",    // seconds
    },
  },
  INTERVIEW_FEEDBACK_READY: {
    user_id: "string",
    payload: {
      interview_id: "string",
      score: "number",        // 0-100
      feedback: "object",
      strengths: "string[]",
      improvements: "string[]",
    },
  },
};

// ── score-events ──────────────────────────────────────────────
const SCORE_EVENTS = {
  SCORE_RECALC_REQUESTED: {
    user_id: "string",
    payload: {
      trigger: "string",     // "resume_parsed" | "interview_completed" | "scheduler"
    },
  },
  BATCH_SCORE_RECALC_REQUESTED: {
    user_id: null,
    payload: { triggered_by: "string" },
  },
  SCORE_UPDATED: {
    user_id: "string",
    payload: {
      readiness_score: "number",  // 0-100
      domain_scores: {
        technical: "number",
        communication: "number",
        problem_solving: "number",
        cultural_fit: "number",
      },
      trend: "string",            // "up" | "down" | "stable"
      previous_score: "number?",
    },
  },
};

// ── job-events ────────────────────────────────────────────────
const JOB_EVENTS = {
  NEW_JOB: {
    user_id: null,
    payload: {
      job_id: "string",
      source: "string",          // "greenhouse" | "lever" | "ashby"
      external_id: "string",
      company: "string",
      role: "string",
      description: "string",
      location: "string",
      employment_type: "string",
      url: "string",
      departments: "string[]",
      posted_at: "ISO8601",
    },
  },
  JOB_UPDATED: {
    user_id: null,
    payload: {
      job_id: "string",
      changes: "object",
    },
  },
  JOB_MATCH_REQUESTED: {
    user_id: "string",
    payload: {
      skills: "string[]",
      experience_level: "string",
      preferences: "object?",
    },
  },
  JOB_MATCHED: {
    user_id: "string",
    payload: {
      matches: "object[]",       // [{job_id, score, reasons}]
    },
  },
};

// ── notification-events ───────────────────────────────────────
const NOTIFICATION_EVENTS = {
  NOTIFICATION_CREATED: {
    user_id: "string",
    payload: {
      title: "string",
      message: "string",
      severity: "string",        // "info" | "success" | "warning" | "error"
      action_url: "string?",
    },
  },
};

module.exports = {
  BASE_EVENT,
  STUDENT_EVENTS,
  RESUME_EVENTS,
  INTERVIEW_EVENTS,
  SCORE_EVENTS,
  JOB_EVENTS,
  NOTIFICATION_EVENTS,
};
