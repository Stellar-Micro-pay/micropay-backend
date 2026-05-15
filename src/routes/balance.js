/**
 * GET /balance
 *
 * Header: x-api-key
 * Returns: { walletAddress, balance (stroops), balanceXLM, fundingSource }
 */

const router      = require("express").Router();
const { requireApiKey }  = require("../middleware/auth");
const { getBalance }     = require("../services/stellarContract");
const logger             = require("../services/logger");

const STROOPS_PER_XLM = 10_000_000;

router.get("/", requireApiKey, async (req, res) => {
  const { walletAddress, fundingSource } = req.apiKeyMeta;

  try {
    const balance = await getBalance(walletAddress);
    res.json({
      walletAddress,
      balance,
      balanceXLM: (balance / STROOPS_PER_XLM).toFixed(7),
      fundingSource,
    });
  } catch (err) {
    logger.error("Balance query failed", { walletAddress, message: err.message });
    res.status(502).json({ error: "Failed to query balance from contract" });
  }
});

module.exports = router;
