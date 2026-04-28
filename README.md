# micropay-backend

API service for issuing API keys, authenticating usage, charging Soroban balances, and exposing usage telemetry.

This project is funded and governed by the Stellar Treasury system:
https://github.com/Chibex-max/stellar-treasury

## Key Features

- API key issuance (`POST /api-key`)
- Usage retrieval (`GET /usage`)
- On-chain balance lookup (`GET /balance`)
- Top-up requests (`POST /top-up`)
- Paid endpoint demo (`GET /premium-data`)

## Environment

Copy `.env.example` to `.env` and configure:

- `CONTRACT_ADDRESS`
- `TREASURY_CONTRACT_ADDRESS`
- backend wallet keys
- Soroban RPC and network passphrase
- per-request cost

## Local Run

```bash
npm install
npm run dev
```

## API Example

```bash
curl -H "x-api-key: KEY" http://localhost:8080/premium-data
```

## Integration Notes

- Treasury allocations are represented with `source=treasury`
- User self-funding uses `source=user`
- Backend signs `charge` transactions with the authorized wallet
