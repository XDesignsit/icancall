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

