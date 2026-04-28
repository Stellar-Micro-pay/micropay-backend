/**
 * POST /api-key
 *
 * Body: { walletAddress: string, fundingSource?: "treasury" | "user" }
 * Returns: { apiKey, walletAddress, fundingSource, createdAt }
 */

const router   = require("express").Router();
const keyStore = require("../services/keyStore");
const logger   = require("../services/logger");

router.post("/", (req, res) => {
  const { walletAddress, fundingSource } = req.body;

  if (!walletAddress || typeof walletAddress !== "string") {
    return res.status(400).json({ error: "walletAddress is required" });
  }

  const validSources = ["treasury", "user"];
  const source = validSources.includes(fundingSource) ? fundingSource : "user";

  const apiKey = keyStore.generateKey(walletAddress.trim(), source);

  logger.info("API key generated", { walletAddress, fundingSource: source });

  res.status(201).json({
    apiKey,
    walletAddress,
    fundingSource: source,
    createdAt: new Date().toISOString(),
  });
});

module.exports = router;
