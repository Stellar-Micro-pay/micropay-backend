# GitHub Issues — micropay-backend

## Open Issues

1. **feat(api): migrate key store to PostgreSQL**
   Replace in-memory Map with pg-backed persistence.

2. **feat(api): add JWT-based admin authentication**
   Secure the `/api-key` generation endpoint against abuse.

3. **feat(api): implement webhook on low balance**
   Notify developers when balance drops below a configurable threshold.

4. **feat(api): support per-endpoint custom pricing**
   Allow different `CHARGE_STROOPS` per route, not just globally.

5. **feat(auth): add API key rotation endpoint**
   `POST /api-key/rotate` — invalidate old key and issue new one.

6. **feat(api): add `/treasury/notify` endpoint**
   Receive treasury deposit events as webhook and update local state.

7. **fix(api): handle Soroban RPC timeout gracefully**
   Retry with exponential backoff instead of 502 immediately.

8. **fix(api): sanitize walletAddress input**
   Validate Stellar address format (G…, 56 chars, base32) before storing.

9. **fix(auth): rate-limit `/api-key` endpoint separately**
   Prevent key farming — stricter limits on key generation.

10. **test(api): add supertest integration for /top-up edge cases**
    Test max top-up limit, negative amounts, non-numeric input.

11. **test(api): mock stellarContract in all route tests**
    Avoid Stellar SDK calls leaking into unit tests.

12. **chore(api): set up GitHub Actions CI pipeline**
    Run `npm test` and `npm run lint` on every PR.

13. **chore(api): add structured logging with request correlation IDs**
    Add `x-request-id` header and log it with every operation.

14. **docs(api): generate OpenAPI 3.0 spec from route definitions**
    Enable Swagger UI on `/docs`.

15. **feat(api): add `/metrics` endpoint (Prometheus format)**
    Expose request counts, charge totals, error rates for monitoring.
