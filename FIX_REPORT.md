# Refer Karo — code review and fixes

Reviewed the supplied ZIP and made the following fixes/improvements:

- Confirmed `server.js` parses under Node.js and the inline JavaScript in `index.html` parses.
- Confirmed `package.json` and `content.json` are valid JSON.
- Removed unused Express/CORS/Upstash npm dependencies; the server uses Node.js built-ins and the Upstash REST API directly.
- Fixed the Redis flush edge case where an update could remain dirty if it arrived as a flush was ending.
- Added an optional custom Redis key (`UPSTASH_REDIS_KEY`) to help keep staging and production data separate.
- Added a warning when a cloud deployment is using local-file storage, plus `REQUIRE_PERSISTENT_STORAGE=true` to fail startup if Upstash is not configured.
- Disabled automatic creation of synthetic demo customer accounts unless `ENABLE_MANAGED_DEMO_ACCOUNTS=true` is explicitly set.
- Require an explicit admin password in production when creating the admin account.
- Ensure session cookies use `Secure` when the public app URL is HTTPS.
- Added reset-endpoint rate limiting.
- Improved JSON request body handling so invalid/oversized JSON receives a controlled HTTP error instead of forcibly destroying the request socket.
- Reduced the maximum admin daily-task payload size and increased backup-restore allowance to support larger legitimate backups.
- Avoid logging password-reset codes in production when email delivery is not configured.
- Added Railway deployment and environment-variable instructions to README and added `.gitignore` to help prevent accidental secret/data commits.

## Validation performed

- `node --check server.js`: passed.
- Inline JavaScript syntax checks from `index.html`: passed.
- `package.json` and `content.json` JSON parsing: passed.
- Local smoke test: `/health` returned `ok`; `/` returned HTTP 200 HTML; `/api/state` returned HTTP 200; user registration returned HTTP 200.

## Not possible to fully validate from this ZIP alone

- Real Upstash connectivity/persistence without your private database credentials.
- Live Razorpay payments, webhook signatures, account activation, refunds, and payout behavior.
- Email delivery without configured mail credentials.
- Business/legal compliance for a rewards/referral/payout model.
- Real traffic capacity under 1,000–2,000 monthly users; load testing and production monitoring are still recommended.

**Important:** Configure the Railway variables listed in `README.md` before using this with real users or real payments. Do not commit secrets to GitHub.
