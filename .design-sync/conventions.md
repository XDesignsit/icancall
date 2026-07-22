## How to build with iCanCall components

iCanCall is a call-routing product for families: one memorable number that rings
a chain of trusted contacts. Copy should read calm and plain — never clinical,
never cute.

### Setup

There is **no provider or theme component**. Two rules cover setup:

1. `styles.css` must be loaded. Every component here is class-driven and ships
   no styles of its own — without the stylesheet they render as bare HTML.
2. **Dashboard-context components must be wrapped in `.admin`.** The token block
   is declared on `.dash, .admin, .admin-shell`, and it redefines radii, shadows
   and greens to tighter dashboard values. `.admin` applies those tokens and
   nothing else — prefer it. Do **not** use `.dash` as a wrapper: it also sets
   `display: grid; grid-template-columns: var(--sidebar-w) 1fr; height: 100vh`,
   which forces children into a 264px sidebar column.

Wrap these in `.admin`: `AddonRow`, `ContactRow`, `LogRow`, `StatCard`, and any
`Card`, `EmptyState`, `Modal`, `QuantityStepper` or `Toggle` used inside the
dashboard. Marketing/signup surfaces need no wrapper.

```jsx
<div className="admin">
  <StatCard value="11" label="Calls this week" trend="▲ 18%" trendDirection="up" />
</div>
```

### The styling idiom

**Semantic classes plus CSS custom properties — not utility-first.** When you
write layout glue around these components, reach for the tokens, not hardcoded
values. Tailwind utilities do resolve (the stylesheet is compiled from a
Tailwind v4 app), but the design language lives in the tokens below.

| Group | Tokens |
|---|---|
| Surfaces | `--bg` `--surface` `--tint` `--tint-2` `--line` `--line-soft` |
| Text | `--ink` `--ink-soft` `--ink-faint` |
| Brand | `--blue` `--blue-deep` `--blue-ink` `--teal` `--teal-deep` |
| Status | `--green` `--rose` `--amber` `--violet` |
| Radii | `--r-sm` `--r-md` `--r-lg` `--r-xl` |
| Elevation | `--shadow-sm` `--shadow-md` `--shadow-lg` |
| Layout / type | `--maxw` `--pad` `--font` `--mono` |

Colours are authored in `oklch()`. Use `var(--mono)` for anything numeric that
should align — phone numbers, call durations, capacity counts.

Useful structural classes when composing pages: `.wrap` (max-width + gutter),
`.section` (vertical rhythm), `.lead` (intro paragraph), `.eyebrow` (small
uppercase kicker), `.card` / `.card-head` / `.card-pad`.

Two exported helpers matter:

- `buttonClass({ variant, large, className })` — the button class string alone.
  **Use it instead of `<Button>` whenever the control must stay an anchor** (a
  link, a router `<Link>`); rendering a `<button>` there breaks navigation.
- `initialsOf(name)` — the initials `Avatar` displays.

### Where the truth lives

- `_ds/<folder>/styles.css` and its `@import` closure — the real, complete
  stylesheet. Read it before inventing a class; the vocabulary is large and
  every component's markup contract is in there.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component usage.
- `components/<group>/<Name>/<Name>.d.ts` — the prop contract.

Class names are load-bearing beyond this library: the same CSS is shipped by
standalone HTML exports of the marketing pages. **Never rename a class.**

### An idiomatic composition

```jsx
<div className="admin">
  <Card>
    <CardHead
      title="Call chain"
      subtitle="Rung in order until someone answers"
      actions={<Button variant="ghost">Add a contact</Button>}
    />
    <CardBody>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ContactRow
          position={1}
          name="Maria Delgado"
          relationship="Daughter"
          phone="(415) 555-0142"
          color="var(--blue)"
          actions={<Toggle on onChange={() => {}} label="Available" />}
        />
        <ContactRow
          position={2}
          name="Joseph Award"
          relationship="Son"
          phone="(415) 555-0188"
          color="var(--teal-deep)"
          actions={<Toggle on={false} onChange={() => {}} label="Busy" />}
        />
      </div>
    </CardBody>
  </Card>
</div>
```

### House rules

- **No raw emoji** in notices, badges, status pills or dialogs. Use the SVG icon
  slots (`icon` props on `EmptyState`, `StatCard`, `AddonRow`, `LogRow`) or
  typography and background tints instead.
- Prefer real content over placeholders — these components describe a caregiving
  product, and `foo` / `test` reads wrong in every screenshot.
