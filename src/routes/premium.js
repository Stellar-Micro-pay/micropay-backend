/**
 * GET /premium-data
 *
 * Header: x-api-key
 *
 * A sample protected endpoint.  Each successful call:
 *   1. Validates the API key
 *   2. Deducts CHARGE_STROOPS from the user's on-chain balance
 *   3. Records the event in the usage ledger
 *   4. Returns sample premium payload
 *
 * Cost: configurable via CHARGE_STROOPS env var (default: 10 000 = 0.001 XLM)
 */

const router         = require("express").Router();
const { requireApiKey }  = require("../middleware/auth");
const { chargeUser }     = require("../services/stellarContract");
const usageTracker       = require("../services/usageTracker");
const logger             = require("../services/logger");

const CHARGE_STROOPS = parseInt(process.env.CHARGE_STROOPS || "10000", 10);
const STROOPS_PER_XLM = 10_000_000;

// Fake premium dataset – replace with real data source in production
const PREMIUM_DATASET = [
  { id: 1, asset: "XLM/USDC", price: 0.1082, change24h: 2.3,  volume: 14_200_000 },
  { id: 2, asset: "XLM/BTC",  price: 0.0000017, change24h: -0.8, volume: 2_400_000 },
  { id: 3, asset: "XLM/ETH",  price: 0.000042, change24h: 1.1,  volume: 6_100_000 },
  { id: 4, asset: "XLM/EUR",  price: 0.0994, change24h: 0.4,  volume: 9_800_000 },
];

router.get("/", requireApiKey, async (req, res) => {
  const { walletAddress, fundingSource } = req.apiKeyMeta;
  const apiKeyHint = req.apiKey.slice(0, 8);

  try {
    const txHash = await chargeUser(walletAddress, CHARGE_STROOPS);

    usageTracker.record({
      walletAddress,
      apiKeyHint,
      endpoint: "/premium-data",
      amountCharged: CHARGE_STROOPS,
      txHash,
    });

    logger.info("Premium request served", {
      walletAddress,
      charged: CHARGE_STROOPS,
      txHash,
    });

    res.json({
      meta: {
        endpoint: "/premium-data",
        charged: CHARGE_STROOPS,
        chargedXLM: (CHARGE_STROOPS / STROOPS_PER_XLM).toFixed(7),
        txHash,
        fundingSource,
        ts: new Date().toISOString(),
      },
      data: PREMIUM_DATASET,
    });
  } catch (err) {
    if (err.message.includes("insufficient balance")) {
      logger.warn("Insufficient balance", { walletAddress });
      return res.status(402).json({
        error: "Insufficient balance",
        hint: "Top up via POST /top-up or request treasury funding",
      });
    }
    logger.error("Charge failed", { walletAddress, message: err.message });
    res.status(502).json({ error: "Failed to process payment" });
  }
});

module.exports = router;
