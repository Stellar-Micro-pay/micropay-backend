require("dotenv").config();
const express  = require("express");
const helmet   = require("helmet");
const cors     = require("cors");
const rateLimit = require("express-rate-limit");
const logger   = require("./services/logger");
const routes   = require("./routes");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

// Global rate limit – 120 requests / minute per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/", routes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  logger.info(`MicroPay backend running on port ${PORT}`);
  logger.info(`Treasury contract: ${process.env.TREASURY_CONTRACT_ADDRESS || "(not set)"}`);
});

module.exports = app; // for tests
