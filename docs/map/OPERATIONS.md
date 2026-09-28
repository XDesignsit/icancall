# Map — operations

Names only. Never put secret values or hosts here, and never open `.env*` files to learn what a setting does.

| Task | Where | Notes |
|---|---|---|
| Local setup | `npm install`, `npm run dev` (port 3000); `.claude/launch.json` | Env comes from gitignored `.env.local`; without Supabase/SMTP/Twilio the local mocks apply ([local-mocks.md](../guides/local-mocks.md)) |
| Checks before a PR | `npm run lint`, `npx tsc --noEmit`, `npm run build` | Exactly what CI runs |
| CI | `.github/workflows/ci.yml` | Runs on push to `main` and `claude/**`, and on PRs to `main`; a newer run cancels the older one |
| Post-deploy smoke | `.github/workflows/post-deploy-smoke.yml` | Fires on `deployment_status`; probes production domains only, needs body match, not just 200 |
| Deploy | Vercel (`vercel.json`, `.vercel/`) | Headers and the two crons live in `vercel.json` |
| Crons | `/api/cron/release-ended-numbers` (09:00), `/api/cron/reset-annual-minutes` (08:00) | Guarded by `CRON_SECRET` |
| Staging DB | `scripts/setup-staging.sh <project-ref> [--vercel]` | Applies schema and migrations, writes `.env.local` |
| Ad-hoc SQL | `scripts/supabase-sql.sh` | Uses the Supabase CLI token; prints only JSON results |
| Stripe products and prices | `scripts/stripe-setup.mjs` | Safe to re-run; mirrors `src/lib/pricing.ts`; prices are immutable |
| Standalone homepage | `scripts/build-standalone-home.mjs` | After `npm run build`; then copy to the sync folders |
| Sentry | `next.config.ts`, `sentry.*.config.ts` | DSN via `NEXT_PUBLIC_SENTRY_DSN` |
| Data | `supabase/schema.sql`, `supabase/migrations/` | Migrations are dated `YYYYMMDDHHMMSS_name.sql` |

**Config names read by the app:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, `SIGNUPS_PAUSED`, `NEXT_PUBLIC_DEMO_LOGINS`, `PURCHASE_NUMBERS`; Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_{ESSENTIAL,PRO,CARETEAM}_{MONTHLY,YEARLY}`, `STRIPE_PRICE_ID_ADDON_{PHONE_NUMBER,VOICE_MINUTES}`; voice: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TELNYX_{API_KEY,CONNECTION_ID,MESSAGING_PROFILE_ID,PHONE_NUMBER,PUBLIC_KEY}`, `ELEVENLABS_API_KEY`; mail: `SMTP_{HOST,PORT,USER,PASS,FROM_EMAIL,FROM_NAME}`, `CONTACT_EMAIL`, `ACUMBAMAIL_{AUTH_TOKEN,LIST_ID,SUBSCRIBERS_LIST_ID}`; bot/consent: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_CONCORD_PROJECT_ID`; rate limit: `KV_REST_API_URL`, `KV_REST_API_TOKEN`.

Gaps a maintainer should fill in: rollback procedure, release/changelog location, health-check URL, and the list of GitHub secret names beyond those in `ci.yml`.
