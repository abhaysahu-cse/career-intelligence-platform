const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const mime = require("mime-types");
const logger = require("../logger");

// ── S3 provider ───────────────────────────────────────────────
class S3StorageProvider {
  constructor() {
    const {
      S3Client,
      PutObjectCommand,
      GetObjectCommand,
      DeleteObjectCommand,
    } = require("@aws-sdk/client-s3");
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

    this.client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucket = process.env.S3_BUCKET_NAME || "cip-resumes";
    this.PutObjectCommand = PutObjectCommand;
    this.GetObjectCommand = GetObjectCommand;
    this.DeleteObjectCommand = DeleteObjectCommand;
    this.getSignedUrl = getSignedUrl;
  }

  async upload(fileBuffer, originalName, category = "resumes", userId) {
    const ext = path.extname(originalName);
    const key = `${category}/${userId}/${uuidv4()}${ext}`;
    const contentType = mime.lookup(originalName) || "application/octet-stream";

    await this.client.send(
      new this.PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          userId: String(userId),
          originalName,
          uploadedAt: new Date().toISOString(),
        },
        ServerSideEncryption: "AES256",
      })
    );

    return {
      key,
      bucket: this.bucket,
      size: fileBuffer.length,
      content_type: contentType,
      original_name: originalName,
    };
  }

  async getSignedDownloadUrl(key, expiresIn = 3600) {
    const command = new this.GetObjectCommand({ Bucket: this.bucket, Key: key });
    return await this.getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key) {
    await this.client.send(new this.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

// ── Local filesystem provider ─────────────────────────────────
class LocalStorageProvider {
  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH || "/data";
    this.baseUrl = process.env.LOCAL_STORAGE_BASE_URL || "http://localhost:3003";
  }

  async upload(fileBuffer, originalName, category = "resumes", userId) {
    const ext = path.extname(originalName);
    const fileId = uuidv4();
    const key = `${category}/${userId}/${fileId}${ext}`;
    const fullPath = path.join(this.basePath, key);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, fileBuffer);

    return {
      key,
      bucket: "local",
      size: fileBuffer.length,
      content_type: mime.lookup(originalName) || "application/octet-stream",
      original_name: originalName,
    };
  }

  async getSignedDownloadUrl(key, expiresIn = 3600) {
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { key, purpose: "file-download" },
      process.env.JWT_SECRET || "cip-secret",
      { expiresIn }
    );
    return `${this.baseUrl}/api/storage/download?token=${token}`;
  }

  async delete(key) {
    const fullPath = path.join(this.basePath, key);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }

  getLocalPath(key) {
    return path.join(this.basePath, key);
  }
}

// ── Factory ───────────────────────────────────────────────────
function createStorageProvider() {
  const type = process.env.STORAGE_TYPE || "local";
  logger.info(`Storage provider: ${type}`);
  return type === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
}

const storageProvider = createStorageProvider();
module.exports = { storageProvider };
