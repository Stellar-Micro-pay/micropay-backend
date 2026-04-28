/**
 * authMiddleware.js
 *
 * Validates the `x-api-key` header against the key store.
 * Attaches `req.apiKeyMeta` (walletAddress, fundingSource) for downstream use.
 */

const keyStore = require("../services/keyStore");
const logger   = require("../services/logger");

function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!key) {
    return res.status(401).json({ error: "Missing x-api-key header" });
  }

  const meta = keyStore.getKey(key);

  if (!meta) {
    logger.warn("Invalid API key attempt", { ip: req.ip });
    return res.status(403).json({ error: "Invalid API key" });
  }

  req.apiKey     = key;
  req.apiKeyMeta = meta; // { walletAddress, fundingSource, createdAt }
  next();
}

module.exports = { requireApiKey };
