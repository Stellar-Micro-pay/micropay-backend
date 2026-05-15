/**
 * GET /usage
 *
 * Header: x-api-key
 * Returns: { totalCharged, requestCount, events[] }
 */

const router      = require("express").Router();
const { requireApiKey } = require("../middleware/auth");
const usageTracker = require("../services/usageTracker");

router.get("/", requireApiKey, (req, res) => {
  const { walletAddress } = req.apiKeyMeta;
  const usage = usageTracker.getUsage(walletAddress);
  res.json({ walletAddress, ...usage });
});

module.exports = router;
