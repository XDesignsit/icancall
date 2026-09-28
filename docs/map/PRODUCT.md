# Map — product code

Start here for any code change. Find the area, open its README router, then only what the task needs.

| Area | What lives there | Read before changing |
|---|---|---|
| [src/README.md](../../src/README.md) | Next.js app: pages, API routes, server libs, UI components | `node_modules/next/dist/docs/` |
| `src/app/api/twilio/`, `src/lib/twilio*.ts`, `src/lib/telnyx.ts` | Inbound voice webhooks, call cascade, SMS, carrier numbers | [src/README.md](../../src/README.md) |
| `src/app/api/billing/`, `src/lib/stripe.ts`, `planConfig.ts`, `pricing.ts` | Stripe checkout, webhook, plan changes, add-ons | [OPERATIONS.md](OPERATIONS.md) (Stripe setup) |
| `src/app/dashboard/` | Signed-in caregiver dashboard (views, primitives) | AGENTS.md billing and no-emoji rules |
| `src/app/_home/` | Homepage v2 (markup, CSS, controller, simulator) | [standalone-html-sync.md](../guides/standalone-html-sync.md) |
| `src/lib/translations/` | 11-language copy; `home/` is the homepage set | AGENTS.md sync rule |
| `supabase/` | `schema.sql` and dated migrations | [OPERATIONS.md](OPERATIONS.md) (Data) |
| `public/` | Static assets served to users (no routers inside) | none |
| `extracted_designs/`, `scratch/` | Unpacked standalone-page assets and repack scripts | [standalone-html-sync.md](../guides/standalone-html-sync.md) |
| root `*(standalone).html` | Generated or repacked offline page copies; not hand-edited | [standalone-html-sync.md](../guides/standalone-html-sync.md) |
