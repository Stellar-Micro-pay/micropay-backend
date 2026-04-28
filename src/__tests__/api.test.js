/**
 * Integration tests for the MicroPay backend.
 * Runs with MOCK_CONTRACT=true so no live Stellar node is needed.
 */

process.env.MOCK_CONTRACT = "true";
process.env.LOG_LEVEL = "silent";

const request = require("supertest");
const app     = require("../src/index");

let apiKey;
const WALLET = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("POST /api-key", () => {
  it("returns 400 without walletAddress", async () => {
    const res = await request(app).post("/api-key").send({});
    expect(res.status).toBe(400);
  });

  it("creates a key and returns 201", async () => {
    const res = await request(app)
      .post("/api-key")
      .send({ walletAddress: WALLET, fundingSource: "user" });
    expect(res.status).toBe(201);
    expect(res.body.apiKey).toMatch(/^mpk_/);
    apiKey = res.body.apiKey;
  });
});

describe("GET /balance", () => {
  it("returns 401 without key", async () => {
    const res = await request(app).get("/balance");
    expect(res.status).toBe(401);
  });

  it("returns balance (0 initially)", async () => {
    const res = await request(app)
      .get("/balance")
      .set("x-api-key", apiKey);
    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(0);
  });
});

describe("POST /top-up", () => {
  it("rejects invalid amount", async () => {
    const res = await request(app)
      .post("/top-up")
      .set("x-api-key", apiKey)
      .send({ amountXLM: -5 });
    expect(res.status).toBe(400);
  });

  it("tops up successfully", async () => {
    const res = await request(app)
      .post("/top-up")
      .set("x-api-key", apiKey)
      .send({ amountXLM: 1 });
    expect(res.status).toBe(200);
    expect(res.body.amountStroops).toBe(10_000_000);
  });
});

describe("GET /premium-data", () => {
  it("returns 402 when balance is insufficient", async () => {
    // Create a fresh key with no funds
    const kr = await request(app)
      .post("/api-key")
      .send({ walletAddress: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC" });
    const emptyKey = kr.body.apiKey;

    const res = await request(app)
      .get("/premium-data")
      .set("x-api-key", emptyKey);
    expect(res.status).toBe(402);
  });

  it("returns premium data and deducts balance", async () => {
    const res = await request(app)
      .get("/premium-data")
      .set("x-api-key", apiKey);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta.charged).toBeGreaterThan(0);
  });
});

describe("GET /usage", () => {
  it("returns usage after requests", async () => {
    const res = await request(app)
      .get("/usage")
      .set("x-api-key", apiKey);
    expect(res.status).toBe(200);
    expect(res.body.requestCount).toBeGreaterThanOrEqual(1);
  });
});
