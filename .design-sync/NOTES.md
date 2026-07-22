# design-sync notes — iCanCall

Repo-specific gotchas for future syncs. Read this before touching the config.

## Source shape

- This is a **Next.js application**, not a published component library. There is
  no `dist/`, and `package.json` is `private: true` with no `main`/`module`/
  `exports`. The converter runs in synth-entry mode off `src/`.
- Because the package isn't in `node_modules`, `package-build.mjs` **must** be
  passed `--entry ./src/components/index.ts`. Without it the run dies with
  `ENOENT … node_modules/icancall-fresh/package.json`. `entry` is not a valid
  config key (strict schema) — it only exists as the CLI flag:

  ```
  node .ds-sync/package-build.mjs --config .design-sync/config.json \
    --node-modules ./node_modules --entry ./src/components/index.ts --out ./ds-bundle
  ```

- Components are discovered from `componentSrcMap`, not from `.d.ts` exports —
  the build prints `exported PascalCase symbols: 0`, which is expected here.
  **Adding a component means adding it to `componentSrcMap` and to
  `src/components/index.ts`**, or it silently won't sync.

## CSS

- `cssEntry` points at `.design-sync/.cache/styles.compiled.css`, produced by
  `./.design-sync/prepare-css.sh` (also wired as `buildCmd`). Run it before the
  converter — the path is gitignored, so it does not exist on a fresh clone.
- `src/app/globals.css` **cannot** be used as `cssEntry` directly: its first
  line is `@import "tailwindcss"`, a bare specifier rather than a file, which
  trips `[CSS_IMPORT_MISSING]`. The compiled output is also the more faithful
  input, since `buttonClass()` can emit Tailwind utilities like `rounded-full`.
- The Next chunk name carries a content hash, so `prepare-css.sh` picks the
  largest `.css` under `.next/static` rather than a fixed filename.

## Token scoping — the big one

Dashboard tokens are declared on `.dash, .admin, .admin-shell`, but **`.dash`
also carries layout**:

```css
.dash { display: grid; grid-template-columns: var(--sidebar-w) 1fr; height: 100vh; }
```

Wrapping a preview in `.dash` therefore forces every child into a 264px sidebar
column — it wrecked the `LogRow` preview before this was spotted. **Use
`.admin` in previews**: same token block, no layout. Every dashboard-context
preview here (`AddonRow`, `Card`, `ContactRow`, `EmptyState`, `LogRow`, `Modal`,
`QuantityStepper`, `StatCard`, `Toggle`) uses `.admin`.

## Fonts

- `[FONT_MISSING] "Roboto Mono"` — **accepted substitute, confirmed by the user
  on 2026-07-22.** It sits third in `--mono`
  (`ui-monospace, "SF Mono", "Roboto Mono", Menlo, monospace`), so macOS and
  Windows resolve earlier entries and it effectively never renders. Nothing is
  shipped; the DS pane falls back to system mono. Do not re-litigate this on a
  re-sync — it is expected output, not a regression.

## Known render warns

These are triaged as legitimate; an *unrecorded* warn is the one worth chasing.

- `Toggle` — `variants render identically` between `BothStates` and
  `LandingVariant`. Correct: `.toggle` and `.avail` are the same switch pattern
  with slightly different metrics (40x23 vs 38x22 track). They are meant to look
  alike.
- `Modal` — flagged `[GRID_OVERFLOW] … (fixed/portal)`. `.overlay` is
  `position: fixed`, which the check detects statically. Remedied with
  `cfg.overrides.Modal = {cardMode: "single", primaryStory: "AddContact"}`.
  The preview additionally wraps the dialog in a `transform: translateZ(0)`
  stage so the overlay resolves against that box instead of the viewport —
  without it the card shows a clipped dialog with no title bar.

## Config quirks hit during the first sync

- A `viewport` change in `cfg.overrides` re-stamps grade keys and trips
  `[CONFIG_STALE]` on the targeted `preview-rebuild.mjs` loop — run the full
  `package-build.mjs` after changing it. A `cardMode` change alone is
  presentation-only and the targeted loop accepts it.
- A full `package-build.mjs` clears `ds-bundle/_screenshots/review/`, so re-run
  `package-capture.mjs` unscoped afterwards or you will be grading stale sheets.

## Re-sync risks

- **The compiled CSS is regenerated, not committed.** If `prepare-css.sh` isn't
  run first, `cssEntry` is missing and the run fails. It also means the shipped
  styles track whatever the app build currently produces — a Tailwind or Next
  upgrade changes this input without any design-sync change.
- **`componentSrcMap` is hand-maintained.** New components in
  `src/components/ui` or `src/components/domain` will NOT appear until they are
  added there and re-exported from `src/components/index.ts`.
- **`.d.ts` contracts are weaker than a real build would give**, because there
  is no compiled type output — props come from synth-entry extraction. If prop
  tables look thin for a component, that is the cause; `cfg.dtsPropsFor` is the
  override.
- **Previews depend on app-scoped CSS.** These components carry no styles of
  their own — every class lives in `globals.css`, which is also shipped by the
  standalone HTML exports in the repo root, pCloud and Google Drive. Renaming a
  class breaks the design system, the app, and those exports together.
- Only `Avatar` carries inline styling, deliberately: `.ava` has no standalone
  rule and is only ever styled as a descendant (`.crow .ava`, `.user-chip .ava`,
  `.cp-slot .ava`). Removing those inline styles makes it render as bare text.
