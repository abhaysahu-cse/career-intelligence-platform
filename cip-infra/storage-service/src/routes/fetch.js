const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { storageProvider } = require("../storage/provider");
const logger = require("../logger");

const router = express.Router();

/**
 * GET /api/storage/signed-url?key=...
 * Generate a signed download URL for a stored file
 */
router.get("/signed-url", async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "key is required" });

    const expiresIn = parseInt(process.env.SIGNED_URL_EXPIRY) || 3600;
    const url = await storageProvider.getSignedDownloadUrl(key, expiresIn);

    res.json({
      url,
      key,
      expires_in: expiresIn,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (err) {
    logger.error(`Signed URL error: ${err.message}`);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

/**
 * GET /api/storage/download?token=...
 * Serve file using signed token (local storage mode)
 */
router.get("/download", (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "cip-secret");
    if (decoded.purpose !== "file-download") {
      return res.status(403).json({ error: "Invalid token purpose" });
    }

    const localPath = storageProvider.getLocalPath?.(decoded.key);
    if (!localPath || !fs.existsSync(localPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${path.basename(decoded.key)}"`);
    res.sendFile(localPath);
  } catch (err) {
    logger.error(`Download error: ${err.message}`);
    res.status(403).json({ error: "Invalid or expired token" });
  }
});

/**
 * DELETE /api/storage/file
 * Delete a stored file
 */
router.delete("/file", async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: "key is required" });

    await storageProvider.delete(key);
    logger.info(`🗑️  Deleted — key=${key} by userId=${req.userId}`);
    res.json({ success: true, key });
  } catch (err) {
    logger.error(`Delete error: ${err.message}`);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
