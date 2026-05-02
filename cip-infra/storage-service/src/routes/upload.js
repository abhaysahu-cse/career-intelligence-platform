const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { storageProvider } = require("../storage/provider");
const logger = require("../logger");

const router = express.Router();

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 10;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

// Multer: in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed: PDF, DOC, DOCX, TXT`));
    }
  },
});

/**
 * POST /api/storage/upload/resume
 * Upload a resume file
 * Returns: { file_id, key, url, metadata }
 */
router.post("/resume", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const userId = req.userId;
    const { originalname, buffer, mimetype, size } = req.file;

    logger.info(`📤 Upload — userId=${userId} file=${originalname} size=${size}`);

    const result = await storageProvider.upload(buffer, originalname, "resumes", userId);

    // Generate signed URL valid for 1 hour
    const expiresIn = parseInt(process.env.SIGNED_URL_EXPIRY) || 3600;
    const signedUrl = await storageProvider.getSignedDownloadUrl(result.key, expiresIn);

    const response = {
      file_id: uuidv4(),
      key: result.key,
      original_name: result.original_name,
      size: result.size,
      content_type: result.content_type,
      url: signedUrl,
      url_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      uploaded_at: new Date().toISOString(),
      uploaded_by: userId,
    };

    logger.info(`✅ Upload complete — key=${result.key}`);
    res.status(201).json(response);
  } catch (err) {
    logger.error(`Upload error: ${err.message}`);
    if (err.message.includes("File too large")) {
      return res.status(413).json({ error: `File too large. Max ${MAX_SIZE_MB}MB` });
    }
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * POST /api/storage/upload/asset
 * Upload a general asset
 */
router.post("/asset", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const userId = req.userId;
    const result = await storageProvider.upload(
      req.file.buffer,
      req.file.originalname,
      "assets",
      userId
    );

    const signedUrl = await storageProvider.getSignedDownloadUrl(result.key);

    res.status(201).json({
      key: result.key,
      url: signedUrl,
      size: result.size,
      content_type: result.content_type,
      uploaded_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`Asset upload error: ${err.message}`);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
