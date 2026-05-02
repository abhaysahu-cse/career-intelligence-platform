const jwt = require("jsonwebtoken");
const logger = require("../logger");

function authMiddleware(req, res, next) {
  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.query.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "cip-secret");
    req.userId = decoded.userId || decoded.sub || decoded.id;
    req.userRole = decoded.role || "student";

    if (!req.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    next();
  } catch (err) {
    logger.warn(`Auth failed: ${err.message}`);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware };
