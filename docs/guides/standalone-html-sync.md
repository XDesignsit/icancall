# Standalone HTML pages: sync and repack

Moved verbatim from AGENTS.md and .agents/AGENTS.md. The rule that binds every task stays in AGENTS.md.

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
- The Main Landing standalone (`iCanCall Landing Page (standalone).html`) is generated from the homepage source, not hand-edited: after any homepage change run `npm run build && node scripts/build-standalone-home.mjs`, then copy the file to the pCloud and Google Drive directories.

## Standalone HTML Mockup Synchronization

When modifying core React components that also exist in the standalone HTML mockups (e.g., `iCanCall Dashboard (standalone).html`, `iCanCall Parents Landing (standalone).html`, etc.):
1. **Locate the Extracted Asset**: Find the matching component source file within the `extracted_designs/` subdirectories.
2. **Apply Identical Changes**: Modify the component code in the extracted JS file.
3. **Repack the HTML Bundle**: Run the corresponding python script in `scratch/` (such as `python3 scratch/repack_dashboard.py` or `python3 scratch/repack_all.py`) to re-compress, base64-encode, and update the manifest within the standalone HTML file.
