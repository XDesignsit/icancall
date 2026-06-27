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

