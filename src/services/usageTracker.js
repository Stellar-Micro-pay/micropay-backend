/**
 * In-memory usage ledger.
 *
 * Production schema:
 *
 * CREATE TABLE usage_events (
 *   id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   api_key_hash   TEXT NOT NULL,
 *   wallet_address TEXT NOT NULL,
 *   endpoint       TEXT NOT NULL,
 *   amount_charged BIGINT NOT NULL,   -- in stroops (1 XLM = 10,000,000 stroops)
 *   tx_hash        TEXT,
 *   ts             TIMESTAMPTZ DEFAULT NOW()
 * );
 */

// Map<walletAddress, UsageEvent[]>
const ledger = new Map();

function record({ walletAddress, apiKeyHint, endpoint, amountCharged, txHash }) {
  if (!ledger.has(walletAddress)) ledger.set(walletAddress, []);
  ledger.get(walletAddress).push({
    apiKeyHint,
    endpoint,
    amountCharged,
    txHash: txHash || null,
    ts: new Date().toISOString(),
  });
}

function getUsage(walletAddress) {
  const events = ledger.get(walletAddress) || [];
  const totalCharged = events.reduce((s, e) => s + e.amountCharged, 0);
  return { totalCharged, requestCount: events.length, events };
}

module.exports = { record, getUsage };
