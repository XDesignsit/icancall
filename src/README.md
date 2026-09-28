# src/ — the Next.js app

Runs on Vercel (App Router). Server code talks to Supabase, Stripe, Twilio and Telnyx. There is no test suite in the repo; CI runs lint, `tsc` and build.

| Folder or file | What lives there | Read before changing |
|---|---|---|
| `proxy.ts` | Request proxy: prelaunch redirect and Markdown edition for `Accept: text/markdown` | `lib/prelaunch.ts` |
| `app/page.tsx`, `app/_home/` | Homepage v2 (`HomePage`, `HomeV2`, `controller.ts`, `sim.ts`, section CSS) | standalone sync guide |
| `app/{parents,seniors,caregivers}/route.ts` | Serve the standalone landing pages | standalone sync guide |
| `app/signup/`, `app/login/`, `app/accept-invite/` | Signup wizard, login, caregiver invite acceptance | `lib/onboarding.ts`, `lib/session.ts` |
| `app/dashboard/` | Dashboard shell, `views/*View.tsx`, `_primitives.tsx`, `_data.ts` (demo data and i18n helpers) | AGENTS.md no-emoji and quota rules |
| `app/super-admin/` | Admin console (Twilio balance, accounts) | `lib/roles.ts` |
| `app/coming-soon/`, `contact/`, `privacy-policy/`, `terms-of-service/` | Prelaunch, contact and legal pages | AGENTS.md waiting-page rule |
| `app/api/auth/` | OTP, login, signup, Google OAuth, sessions | `lib/otpStore.ts`, `lib/oauth.ts`, `lib/userSessions.ts` |
| `app/api/billing/` | Checkout, add-on confirm, change-plan, cancel, portal, Stripe webhook | `lib/stripe.ts`, `lib/planSchedule.ts`, `lib/billingOwner.ts` |
| `app/api/twilio/` | Voice, agent join/transfer, cascade, call/SMS status, transcription, numbers | `lib/twilioWebhook.ts` (signature check), `lib/conferenceBridge.ts` |
| `app/api/caregiver/` | Lines, profile, seats, recordings, receipts, SMS alerts, voice generation | `lib/account.ts` |
| `app/api/cron/` | Number release and annual-minute reset (scheduled in `vercel.json`) | `lib/subscriptionEnd.ts`, `lib/minutesCycle.ts` |
| `app/api/{admin,contact,waitlist,send-*}/` | Admin, contact form, waitlist, system and voicemail alerts | `lib/mail.ts`, `lib/rateLimit.ts` |
| `lib/` | Server and shared logic: plans (`planConfig.ts`), display prices (`pricing.ts`), DB (`db.ts`, `supabase.ts`), phone, mail, carriers | file header comments |
| `lib/translations/` | Per-language dictionaries (`home/` for the homepage); English is `en.ts` | AGENTS.md sync rule |
| `components/ui/`, `components/domain/` | Design-system primitives and domain components; `index.ts` re-exports both | design-system sync |
