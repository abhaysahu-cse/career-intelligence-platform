require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const uploadRouter = require("./routes/upload");
const fetchRouter = require("./routes/fetch");
const { authMiddleware } = require("./middleware/auth");
const logger = require("./logger");

const PORT = process.env.PORT || 3003;
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || "/data";

// Ensure local storage dir exists
if (process.env.STORAGE_TYPE !== "s3") {
  fs.mkdirSync(path.join(LOCAL_STORAGE_PATH, "resumes"), { recursive: true });
  fs.mkdirSync(path.join(LOCAL_STORAGE_PATH, "assets"), { recursive: true });
}

const app = express();

app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(","),
  credentials: true,
}));
app.use(express.json());

// Rate limiting — upload endpoint
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many uploads, please try again later" },
});

// ── Routes ────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "cip-storage",
    storage_type: process.env.STORAGE_TYPE || "local",
    timestamp: new Date().toISOString(),
  })
);

app.use("/api/storage/upload", uploadLimiter, authMiddleware, uploadRouter);
app.use("/api/storage", authMiddleware, fetchRouter);

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  logger.info(`🗄️  CIP Storage Service running on port ${PORT} (${process.env.STORAGE_TYPE || "local"} mode)`);
});
