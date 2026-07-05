<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# iCanCall Project Rules

## Standalone HTML Pages & Syncing
- This project serves standalone HTML copies of its main marketing landing pages (Seniors, Parents, Caregivers, Main Landing) and signup wizard.
- Standalone HTML files are mirrored in three active sync directories:
  - Repository Root: `./`
  - pCloud Sync Directory: `/Users/admin/pCloud Drive/G Drive/KSC/Website FIles/Pages/`
  - Google Drive Sync Directory: `/Users/admin/Library/CloudStorage/GoogleDrive-aj@digitalrepandreviews.com/My Drive/pCloud Hellion/Clients/KSC/Website FIles/Pages/`
- When renaming routes, editing links, or altering page copywriting:
  1. Update the Next.js source code (e.g. `src/app/` and `src/lib/translations.ts`).
  2. For path/slug changes, rename the corresponding standalone HTML files in all three locations.
  3. Run a link-patching script to parse and update links/routes in both raw HTML and script-embedded template JSON strings (`<script type="__bundler/template">`) inside the standalone pages.
  4. If modifying compiled React stepper flows (like the Signup page), run the compression/repacking script to compress and inject the updated base64 JS assets back into the manifest blocks of the standalone HTML pages.

## Security Headers & Browser APIs
- When configuring or modifying security headers in `vercel.json` (such as `Permissions-Policy` or `Content-Security-Policy`):
  1. **Audit API Usage**: Always search the codebase first for HTML5 browser APIs and hardware features (e.g., searching for `getUserMedia`, `navigator.geolocation`, `payment`, `usb`) to identify what capabilities the application genuinely requires.
  2. **Tailor Policies**: Never use empty allowlists `()` for active browser features. For instance, since the dashboard uses microphone recording, configure `microphone=(self)` to preserve local audio functionality while restricting unused capabilities like `camera=()`.

## CAPTCHA & Turnstile Implementation Guidelines
- **Stable CAPTCHA Callbacks in React**: Always store CAPTCHA callback props (`onVerify`, `onError`, `onExpire`) in mutable refs (`useRef`) and invoke them via the ref. Do NOT pass callbacks directly into the `useEffect` dependency array. This prevents the widget from constantly re-rendering and losing its token when parent states update on keystrokes.
- **Paid Flow CAPTCHA Redundancy**: Avoid forcing blocking CAPTCHA verifications on signup/onboarding forms that require a successful paid checkout (e.g., Stripe, Creem, PayPal). Paid checkouts are naturally bot-proof, so CAPTCHA adds redundant friction.
- **Fail-Open Fallback**: If a CAPTCHA is required, always implement a fail-open loading fallback (e.g., a 4.5-second mount timeout) and catch rendering/error callbacks to automatically trigger a bypass token (`blocked_bypass`). This ensures real users with adblockers, strict privacy firewalls, or testing on non-whitelisted staging/preview domains are never blocked.

## Mocking Database Clients in Local Development
When creating local mock shims for database clients (such as Supabase) to support unconfigured or offline local development:
- **Deferred Chain Execution**: Emulate the synchronous/asynchronous mechanics of the target library's builder chain. Chained action and filter methods (e.g., `select`, `eq`, `not`, `insert`, `update`, `upsert`, `delete`) must return the query builder object synchronously. Defer actual execution (such as reading/writing local JSON files) to the builder's `then()` method (which acts as the awaitable Promise hook). This prevents subsequent chained methods from throwing `TypeError: ... is not a function`.
- **Immediate Cache Invalidation**: Ensure that any endpoint or controller modifying settings or lines explicitly invalidates the associated cache key to prevent webhooks or background processes from reading stale cache values.

## Mocking External Services in Local Development
When credentials for external messaging providers (SMTP or Twilio) are missing or unconfigured in the local environment:
- **Fail-Open SMTP Fallback**: The email dispatch system (`sendEmail` in `src/lib/mail.ts`) must gracefully mock transmission, log the simulated message details to the console, and return `{ success: true, messageId: ... }` rather than letting connection failures throw exceptions.
- **Graceful Twilio SMS Fallback**: The SMS dispatch system (`sendSms` in `src/lib/twilio.ts`) must check for client initialization, log a warning if absent, and return gracefully. Webhooks calling it must handle uninitialized states to prevent returning 500 errors to caller gateways during testing.

## Billing, Branding & Layout Guardrails

### 1. Plan-Included Quotas vs. Add-ons
- When implementing additions (e.g., adding phone numbers, extra voice minutes):
  1. Always verify if the user has unused plan-included quotas (e.g., the Pro plan includes up to 2 active lines at no extra cost, while the Essential plan includes 1).
  2. If the resource is within the plan's quota, bypass payment portals (e.g., Creem, Stripe) and save the resource immediately to the local state/DB for free.
  3. Ensure the billing subtext, checkout modal buttons (e.g., "Confirm & Save" instead of "Approve & Pay"), and billing notices dynamically adjust based on whether the action is chargeable or free.

### 2. Premium Typography-First Styling (No Emojis)
- To maintain the site's sleek, premium, and clean styling, **never use raw emojis** (such as `ℹ️`, `⚠️`, `✅`, `📞`) in notices, alert boxes, status badges, or popup dialogs.
- Rely on typography hierarchy, CSS background tints, clean borders, or designated SVG vector icons instead.

### 3. Minimalist Landing & Waiting Pages
- Marketing or waitlist-only landing pages (like `src/app/coming-soon/page.tsx`) must be stripped of dashboard-specific headers (e.g., Login links, Select a Plan buttons, nav title tabs) and verbose footer columns (Product, Who, Company, Trust).
- Keep footers on these waiting pages to a bare minimum (e.g., brand logo, description blurb, and inline Privacy Policy and Terms of Service links placed in the bottom row).

### 4. ElevenLabs Voice & Environment Configurations
- **Vercel Environment Keys**: Dynamic audio features require `ELEVENLABS_API_KEY`. If setting up a new deployment or environment, verify that this key is propagated using Vercel CLI (`vercel env add ELEVENLABS_API_KEY`) to prevent server-side TTS generation failures.
- **Accents & Genders Mapping**: When listing voice models in the settings dropdown, group options using `<optgroup>` corresponding to each of the application's supported selector languages (EN, ES, FR, JA, ZH, AR, HI, PT, DE, IT, KO). Ensure each language group contains both a **Female** and a **Male** voice choice.
- **Robust Voice IDs**: Rely on standard premade voice IDs that exist on all ElevenLabs account tiers (e.g., Rachel `21m00Tcm4TlvDq8ikWAM`, Drew `29vD33N1CtxCmqQRPOHJ`, Clyde `2EiwWnXF2V4j29thjbwy`, Paul `5Q0t7uMcgp8Aagzh1ZQQ`, Adam `pNInz6obpgmx5142qiA7`, Jessica `cgSgspJ2msm6clMCxT41`, Brian `nPczCjzI2devA2R17O2Y`, Sarah `EXAVITQu4vr4xnSDxMaL`). Avoid custom/private voice IDs that require the API key to have `voices_read` scopes, as production keys are often restricted to write-only text-to-speech access.



