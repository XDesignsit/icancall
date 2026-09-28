<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# iCanCall Project Rules

Next.js app (Vercel, Supabase, Stripe billing, Twilio/Telnyx voice) plus standalone HTML copies of the marketing pages. More rules for widgets, cookie consent, serverless DB and dropdowns are in [.agents/AGENTS.md](.agents/AGENTS.md).

## Commands
`npm run dev` · `npm run lint` · `npx tsc --noEmit` · `npm run build` (CI runs lint, tsc and build).

## Standalone HTML Pages & Syncing
- This project serves standalone HTML copies of its main marketing landing pages (Seniors, Parents, Caregivers, Main Landing) and signup wizard. They are mirrored in three sync directories (repo root, pCloud, Google Drive).
- When renaming routes, editing links, or altering page copywriting: update the Next.js source (`src/app/`, `src/lib/translations.ts`) **and** the standalone HTML in all three locations, and repack any compiled React flows.
- The Main Landing standalone is generated, not hand-edited: after any homepage change run `npm run build && node scripts/build-standalone-home.mjs`, then copy the file to the pCloud and Google Drive directories.
- Directory paths, link-patching and repack steps: [docs/guides/standalone-html-sync.md](docs/guides/standalone-html-sync.md).

## Security Headers & Browser APIs
- When configuring or modifying security headers in `vercel.json` (such as `Permissions-Policy` or `Content-Security-Policy`):
  1. **Audit API Usage**: Always search the codebase first for HTML5 browser APIs and hardware features (e.g., searching for `getUserMedia`, `navigator.geolocation`, `payment`, `usb`) to identify what capabilities the application genuinely requires.
  2. **Tailor Policies**: Never use empty allowlists `()` for active browser features. For instance, since the dashboard uses microphone recording, configure `microphone=(self)` to preserve local audio functionality while restricting unused capabilities like `camera=()`.

## CAPTCHA & Turnstile Implementation Guidelines
- **Stable CAPTCHA Callbacks in React**: Always store CAPTCHA callback props (`onVerify`, `onError`, `onExpire`) in mutable refs (`useRef`) and invoke them via the ref. Do NOT pass callbacks directly into the `useEffect` dependency array. This prevents the widget from constantly re-rendering and losing its token when parent states update on keystrokes.
- **Paid Flow CAPTCHA Redundancy**: Avoid forcing blocking CAPTCHA verifications on signup/onboarding forms that require a successful paid checkout (e.g., Stripe, PayPal). Paid checkouts are naturally bot-proof, so CAPTCHA adds redundant friction.
- **Fail-Open Fallback**: If a CAPTCHA is required, always implement a fail-open loading fallback (e.g., a 4.5-second mount timeout) and catch rendering/error callbacks to automatically trigger a bypass token (`blocked_bypass`). This ensures real users with adblockers, strict privacy firewalls, or testing on non-whitelisted staging/preview domains are never blocked.

## Local mocks (fail-open)
- Mock DB clients (Supabase shims) must return the builder synchronously from chained methods and defer execution to `then()`; endpoints that modify settings or lines must invalidate the associated cache key.
- `sendEmail` (`src/lib/mail.ts`) and `sendSms` (`src/lib/twilio.ts`) must fail open when SMTP/Twilio credentials are missing: log, return gracefully, never throw or 500 a webhook.
- Full rules: [docs/guides/local-mocks.md](docs/guides/local-mocks.md).

## Billing, Branding & Layout Guardrails

### 1. Plan-Included Quotas vs. Add-ons
- When implementing additions (e.g., adding phone numbers, extra voice minutes):
  1. Always verify if the user has unused plan-included quotas (e.g., the Pro plan includes up to 2 active lines at no extra cost, while the Essential plan includes 1).
  2. If the resource is within the plan's quota, bypass payment portals (e.g., Stripe) and save the resource immediately to the local state/DB for free.
  3. Ensure the billing subtext, checkout modal buttons (e.g., "Confirm & Save" instead of "Approve & Pay"), and billing notices dynamically adjust based on whether the action is chargeable or free.

### 2. Premium Typography-First Styling (No Emojis)
- To maintain the site's sleek, premium, and clean styling, **never use raw emojis** (such as `ℹ️`, `⚠️`, `✅`, `📞`) in notices, alert boxes, status badges, or popup dialogs.
- Rely on typography hierarchy, CSS background tints, clean borders, or designated SVG vector icons instead.

### 3. Minimalist Landing & Waiting Pages
- Marketing or waitlist-only landing pages (like `src/app/coming-soon/page.tsx`) must be stripped of dashboard-specific headers (e.g., Login links, Select a Plan buttons, nav title tabs) and verbose footer columns (Product, Who, Company, Trust).
- Keep footers on these waiting pages to a bare minimum (e.g., brand logo, description blurb, and inline Privacy Policy and Terms of Service links placed in the bottom row).

### 4. ElevenLabs Voice & Environment Configurations
- `ELEVENLABS_API_KEY` must be set in every deployment (`vercel env add ELEVENLABS_API_KEY`); voice dropdowns group by language with a Female and a Male voice each; use only premade voice IDs available on all account tiers. Details and IDs: [docs/guides/elevenlabs-voice.md](docs/guides/elevenlabs-voice.md).

## Project map
Before opening files, read the router for the task, then only the files it points to:
- [docs/map/PRODUCT.md](docs/map/PRODUCT.md): where the code for each area lives
- [docs/map/OPERATIONS.md](docs/map/OPERATIONS.md): setup, checks, CI, deploy, config, data
- [docs/map/DOCS.md](docs/map/DOCS.md): which document answers which question

The map guides what to read first. It never replaces the rules above.

**Keep the map true.** A change that adds, moves or removes a file a router names updates that router in the same change. Each code area keeps its own short README router, linked from PRODUCT.md, except folders that ship to users (`public/`), which are routed from docs/map/. Routers stay about 15–35 lines, link only to files that exist, and never hold secrets. Reference material goes in docs/, not here.
