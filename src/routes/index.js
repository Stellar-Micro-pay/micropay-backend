const router = require("express").Router();
const keyRoutes     = require("./apiKeys");
const usageRoutes   = require("./usage");
const balanceRoutes = require("./balance");
const premiumRoutes = require("./premium");

// Health
router.get("/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));

router.use("/api-key",      keyRoutes);
router.use("/usage",        usageRoutes);
router.use("/balance",      balanceRoutes);
router.use("/premium-data", premiumRoutes);
router.use("/top-up",       require("./topup"));

module.exports = router;
