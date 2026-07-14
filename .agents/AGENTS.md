# Project-Scoped Rules: iCanCall

## Third-Party Client-Side Widgets (Turnstile, reCAPTCHA, Maps, etc.)

When integrating third-party widgets that manipulate the DOM or require external scripts in Next.js client components:
1. **Prevent Hydration Mismatch**: Render the widget placeholder container conditionally only after hydration is complete (using a `mounted` state in `useEffect`), or dynamically import the widget component with `ssr: false` via `next/dynamic`.
2. **Strict Mode Cleanup**: Always implement a robust cleanup function in `useEffect`'s return block (e.g. calling `turnstile.remove(widgetId)` or corresponding SDK cleanup method) to prevent duplicate renders or console warnings like *"Nothing to remove found for the provided container"* during development hot-reloads.
3. **Dynamic Script Loading**: Use Next.js `next/script` or a single global DOM check to prevent inserting duplicate `<script>` tags when components remount.

## Cookie Consent & Compliance Scripts (Concord, Cookiebot, etc.)

When integrating third-party cookie consent or compliance scripts:
1. **Direct API Integration**: Use the active integration URL pattern instead of old CDN hostnames. For Concord.tech, use:
   `https://api.concord.tech/site-v1/PROJECT_ID/site-client`
   Avoid using deprecated/dead domains like `cdn.concord.tech`.
2. **No Async or Defer**: Do not use `async` or `defer` attributes on cookie consent scripts unless explicitly required, as they need to run synchronously to block other trackers/cookies before user interaction.
3. **Next.js Integration**: In Next.js, render the script in the root layout (`src/app/layout.tsx`) using the `next/script` component with `strategy="beforeInteractive"`.
4. **Standalone Sync Pages**: For static mirrored pages (such as `/parents`, `/seniors`, etc. generated via `repack_all.py`), ensure script placeholders are added to the templates and that build scripts interpolate the active Project ID from `.env.local` at repack/injection time.

## Serverless Database Optimizations & Latency

When building serverless endpoints (Next.js API routes or Server Actions) that query a Supabase PostgreSQL database:
1. **Regional Alignment**: Always match the Vercel execution region to the physical location of the Supabase database. For database clusters in `us-east-1`, add `export const preferredRegion = 'iad1';` at the top of the API route files to reduce serverless-to-database latency to 1–2ms.
2. **In-Memory Caching**: For latency-sensitive webhook chains (e.g. Twilio voice gather streams), wrap database lookup operations in short-lived in-memory TTL caches (60s). Reused serverless containers will resolve subsequent sequential reads from memory, reducing database read load. Ensure you invalidate this cache on any database writes (like `deductMinutes`).

## Development & Tooling Limitations

1. **Browser Automation**: The `browser_subagent` tool is constrained by platform capabilities and only supports local Chrome mode on Linux. When the host OS is macOS, do not attempt to spawn browser subagents for dashboard settings or configurations; instead, provide step-by-step manual instructions for the user.

## Standalone HTML Mockup Synchronization

When modifying core React components that also exist in the standalone HTML mockups (e.g., `iCanCall Dashboard (standalone).html`, `iCanCall Parents Landing (standalone).html`, etc.):
1. **Locate the Extracted Asset**: Find the matching component source file within the `extracted_designs/` subdirectories.
2. **Apply Identical Changes**: Modify the component code in the extracted JS file.
3. **Repack the HTML Bundle**: Run the corresponding python script in `scratch/` (such as `python3 scratch/repack_dashboard.py` or `python3 scratch/repack_all.py`) to re-compress, base64-encode, and update the manifest within the standalone HTML file.

## Cross-Device UI Interactions

1. **Outside Click Dismissals**: When implementing document-level event listeners to dismiss or close custom dropdowns, popovers, or modals upon clicking outside:
   - Always register both `mousedown` and `touchstart` event listeners on the document to ensure reliable dismissal behavior across both desktop mice and mobile touch screens.
   - Clean up both event listeners when the component unmounts.
