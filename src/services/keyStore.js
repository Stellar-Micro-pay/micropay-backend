/**
 * In-memory API key store.
 *
 * In production, replace with a PostgreSQL table (schema below).
 *
 * CREATE TABLE api_keys (
 *   key            TEXT PRIMARY KEY,
 *   wallet_address TEXT NOT NULL,
 *   funding_source TEXT NOT NULL CHECK (funding_source IN ('treasury','user')),
 *   created_at     TIMESTAMPTZ DEFAULT NOW(),
 *   is_active      BOOLEAN DEFAULT TRUE
 * );
 */

const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  32
);

// Map<apiKey, { walletAddress, fundingSource, createdAt }>
const store = new Map();

function generateKey(walletAddress, fundingSource = "user") {
  const key = `mpk_${nanoid()}`;
  store.set(key, {
    walletAddress,
    fundingSource,
    createdAt: new Date().toISOString(),
  });
  return key;
}

function getKey(key) {
  return store.get(key) || null;
}

function listKeys(walletAddress) {
  const result = [];
  for (const [key, meta] of store.entries()) {
    if (meta.walletAddress === walletAddress) {
      result.push({ key: redact(key), ...meta });
    }
  }
  return result;
}

/** Show only the first 8 + last 4 chars in listings */
function redact(key) {
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

module.exports = { generateKey, getKey, listKeys };
