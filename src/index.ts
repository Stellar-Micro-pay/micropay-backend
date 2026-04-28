import express from "express";
import { z } from "zod";
import { config } from "./config";
import { requireApiKey, type AuthedRequest } from "./middleware";
import { stellarClient } from "./stellarClient";
import { type FundingSource, store } from "./store";

const app = express();
app.use(express.json());

const createKeySchema = z.object({
  userAddress: z.string().min(8),
  source: z.enum(["treasury", "user"])
});

const topUpSchema = z.object({
  userAddress: z.string().min(8),
  amount: z.number().positive(),
  source: z.enum(["treasury", "user"]).default("user")
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    contractAddress: stellarClient.contractAddress,
    treasuryContractAddress: stellarClient.treasuryContractAddress
  });
});

app.post("/api-key", (req, res) => {
  const parsed = createKeySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = store.getByUser(parsed.data.userAddress);
  if (existing) {
    res.json(existing);
    return;
  }
  const record = store.createApiKey(parsed.data.userAddress, parsed.data.source as FundingSource);
  res.status(201).json(record);
});

app.get("/usage", requireApiKey, (req: AuthedRequest, res) => {
  const apiKey = req.auth?.apiKey;
  if (!apiKey) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const record = store.getByApiKey(apiKey);
  res.json(record);
});

app.get("/balance", requireApiKey, async (req: AuthedRequest, res) => {
  const userAddress = req.auth?.userAddress;
  if (!userAddress) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const balance = await stellarClient.getBalance(userAddress);
  const record = store.getByUser(userAddress);
  res.json({
    userAddress,
    fundingSource: record?.source ?? "unknown",
    balance
  });
});

app.post("/top-up", async (req, res) => {
  const parsed = topUpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { userAddress, amount, source } = parsed.data;
  const tx =
    source === "treasury"
      ? await stellarClient.topUpFromTreasury(userAddress, amount)
      : await stellarClient.topUpFromUser(userAddress, amount);

  res.status(202).json({
    status: "submitted",
    source,
    txHash: tx.txHash
  });
});

app.get("/premium-data", requireApiKey, async (req: AuthedRequest, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const amount = config.REQUEST_COST_STROOPS;
  const tx = await stellarClient.charge(auth.userAddress, amount);
  const usage = store.recordCharge(auth.apiKey, amount);

  res.json({
    charged: amount,
    txHash: tx.txHash,
    usage,
    data: {
      feed: "premium",
      message: "DAO-funded usage meter applied successfully"
    }
  });
});

app.listen(config.PORT, () => {
  // Startup logs intentionally include critical integration addresses.
  console.log(
    `[micropay-backend] listening on :${config.PORT} contract=${config.CONTRACT_ADDRESS} treasury=${config.TREASURY_CONTRACT_ADDRESS}`
  );
});
