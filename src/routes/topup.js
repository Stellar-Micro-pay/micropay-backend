/**
 * POST /top-up
 *
 * Header: x-api-key
 * Body:   { amountXLM: number }
 *
 * Allows users to self-fund their on-chain balance.
 * In production, this would integrate with a payment processor or wallet-connect
 * flow; here it calls the contract's deposit_from_user function directly.
 */

const router       = require("express").Router();
const { requireApiKey }  = require("../middleware/auth");
const { depositFromUser } = require("../services/stellarContract");
const logger             = require("../services/logger");

const STROOPS_PER_XLM = 10_000_000;

router.post("/", requireApiKey, async (req, res) => {
  const { walletAddress } = req.apiKeyMeta;
  const { amountXLM }     = req.body;

  if (!amountXLM || typeof amountXLM !== "number" || amountXLM <= 0) {
    return res.status(400).json({ error: "amountXLM must be a positive number" });
  }

  if (amountXLM > 1000) {
    return res.status(400).json({ error: "Maximum single top-up is 1000 XLM" });
  }

  const amountStroops = Math.round(amountXLM * STROOPS_PER_XLM);

  try {
    const txHash = await depositFromUser(walletAddress, amountStroops);
    logger.info("Top-up successful", { walletAddress, amountXLM, txHash });

    res.json({
      message: "Top-up successful",
      walletAddress,
      amountXLM,
      amountStroops,
      txHash,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Top-up failed", { walletAddress, message: err.message });
    res.status(502).json({ error: "Failed to deposit to contract" });
  }
});

module.exports = router;
