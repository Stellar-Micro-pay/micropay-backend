# micropay-backend

> Node.js API gateway and billing engine for the MicroPay platform.

This project is funded and governed by the Stellar Treasury system:
**https://github.com/Stellar-Treasury/Treasury-frontend**

---

## Overview

`micropay-backend` sits between callers and the Soroban smart contract.  
It issues API keys, validates inbound requests, deducts on-chain balances, and records usage.

```
Client ──(x-api-key)──► Backend ──(charge)──► Soroban Contract
                           │
                           └──(record)──► Usage Ledger
```

---

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api-key` | None | Generate an API key |
| `GET` | `/balance` | API key | Query on-chain balance |
| `GET` | `/usage` | API key | Usage history & totals |
| `POST` | `/top-up` | API key | Self-fund via contract |
| `GET` | `/premium-data` | API key | **Paid** endpoint — charges per call |
| `GET` | `/health` | None | Liveness probe |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Stellar-Micro-pay/micropay-backend
cd micropay-backend

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Set MOCK_CONTRACT=true for local dev (no Stellar node required)

# 4. Run
npm run dev
```

---

## Environment Variables

See [`.env.example`](.env.example) for full reference.

| Variable | Required | Description |
|---|---|---|
| `TREASURY_CONTRACT_ADDRESS` | Yes | DAO Treasury Soroban contract ID |
| `MICROPAY_CONTRACT_ADDRESS` | Prod | Deployed micropay contract ID |
| `ADMIN_SECRET_KEY` | Prod | Backend wallet for signing `charge()` |
| `MOCK_CONTRACT` | Dev | `true` to skip Stellar calls |
| `CHARGE_STROOPS` | No | Cost per API call (default `10000`) |

---

## curl Examples

```bash
# 1. Get API key
curl -X POST http://localhost:3001/api-key \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"GABC...","fundingSource":"user"}'

# 2. Check balance
curl http://localhost:3001/balance \
  -H "x-api-key: mpk_YOUR_KEY"

# 3. Top up 0.5 XLM
curl -X POST http://localhost:3001/top-up \
  -H "x-api-key: mpk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amountXLM": 0.5}'

# 4. Call premium endpoint
curl http://localhost:3001/premium-data \
  -H "x-api-key: mpk_YOUR_KEY"
```

---

## Running Tests

```bash
npm test
```

---

## Related Repositories

| Repo | Purpose |
|---|---|
| [micropay-contracts](https://github.com/Stellar-Micro-pay/micropay-contracts) | Soroban contract |
| [micropay-frontend](https://github.com/Stellar-Micro-pay/micropay-frontend) | Developer dashboard |
| [micropay-docs](https://github.com/Stellar-Micro-pay/micropay-docs) | Full documentation |
| [stellar-treasury](https://github.com/Stellar-Treasury/Treasury-frontend) | Governing DAO |
