# Refer Karo

Node.js website with a built-in HTTP server. Requires Node.js 18.18 or newer. The app does not need Express or other npm runtime packages.

## Before deploying to Railway

1. Push these files to your GitHub repository: `server.js`, `index.html`, `content.json`, `package.json`, and `README.md`.
2. In Railway, open the **referkro service** (not Project Settings) and add the variables below under **Variables**.
3. Create an Upstash Redis database and use its **REST URL** and **REST token**. Do not use a `redis://` or `rediss://` connection string.
4. Generate a public domain in the service's **Settings → Networking**.
5. Set `APP_URL` to the full public URL, including `https://`.
6. Deploy and check `/health` and the logs before testing login, payment, referral, and withdrawal flows.

## Required Railway variables

| Variable | Value |
| --- | --- |
| `ADMIN_EMAIL` | Your own admin email, lower-case recommended |
| `ADMIN_PASSWORD` | A unique, strong admin password (at least 12 characters recommended) |
| `UPSTASH_REDIS_REST_URL` | Upstash database REST URL beginning with `https://` |
| `UPSTASH_REDIS_REST_TOKEN` | Full Upstash REST token; keep secret |
| `REQUIRE_PERSISTENT_STORAGE` | `true` to prevent startup without persistent database configuration |
| `APP_URL` | Your deployed public URL, e.g. `https://your-app.up.railway.app` |

Optional variables:

- `UPSTASH_REDIS_KEY`: custom Redis key; default is `referkaro_data`. Use a different key for staging and production if they share a database.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`: required for Razorpay mode. Configure the webhook URL as `https://YOUR-DOMAIN/api/razorpay/webhook` and subscribe to `payment.captured` (and/or `order.paid`). Test in Razorpay test mode first.
- `RESEND_API_KEY`, `MAIL_FROM`: required for actual password-reset email delivery. Without these, reset codes are only written to server logs; do not use that fallback in production.
- `ANTHROPIC_API_KEY`, `AI_MODEL`, `AI_DAILY_MSGS`: optional AI feature configuration.
- `ENABLE_MANAGED_DEMO_ACCOUNTS=true`: explicitly enables creation of synthetic demo customer accounts. Leave unset for a real production launch.

## Important production notes

- Persistent storage is essential. The local `data.json` fallback is for local development only; many hosting platforms use ephemeral filesystems. Set `REQUIRE_PERSISTENT_STORAGE=true` in Railway and configure Upstash before serving real users.
- Upstash stores the app's user/payment state as one JSON value. Back up the database before deploying changes and test restoring a backup. Keep production and staging on separate Redis keys or databases.
- Never commit passwords, Redis tokens, Razorpay secrets, or API keys to GitHub. Set them only in Railway Variables.
- Use Razorpay test mode first. The code cannot verify live provider account settings, webhook delivery, or legal/payment-provider eligibility by itself.
- The default task links in `content.json` are blank. Configure valid links/tasks through the admin panel before making daily tasks available.
- Change the default Telegram/support links in Admin Settings before launch.
- This project includes money/reward/withdrawal features. Verify applicable laws, payment-provider rules, terms, privacy policy, refund policy, and payout operations before accepting real customers.

## Local development

```bash
npm start
```

Then open `http://localhost:3000`. For local development, the app can use a local `data.json` file. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting to create the admin account.

## Health check

`GET /health` returns `ok` when the server is running.


## Hostinger + Supabase storage migration
Set Hostinger environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-side secret only; never put it in `index.html`). The app stores its complete state in `public.app_state` at row id `referkaro_main`. Required schema:
```sql
CREATE TABLE IF NOT EXISTS public.app_state (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
```
On first start, if the Supabase row is empty and legacy Upstash variables remain configured, the server imports the existing Upstash state into Supabase. Keep Upstash variables for that first deployment and verify logs show `Storage: Supabase (imported legacy Upstash data)` or `Storage: Supabase`. Check users, payments, referrals, withdrawals, and dashboard figures before removing Upstash variables. If Supabase has no row and Upstash is not configured, the app starts with empty state; do not deploy in that condition when existing data matters.
