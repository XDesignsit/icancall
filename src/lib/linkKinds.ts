// The kinds of link iCanCall sends by text. Each gets its own URL so a link
// preview can show a card for that kind (src/lib/linkPreviews.tsx).
export const LINK_KINDS = ["connected", "voicemail", "missed", "welcome"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export function isLinkKind(value: unknown): value is LinkKind {
  return LINK_KINDS.includes(value as LinkKind);
}

// Texts from the A2P 10DLC number may carry links to app.icancall.co, the
// domain declared on its campaign. Links were carrier-filtered (30007) until the
// number was re-attached to the campaign's Messaging Service (2026-10-15), then
// /dashboard and /signup both delivered. The URL is fixed rather than read from
// NEXT_PUBLIC_APP_URL so a preview or local host never ends up in a text.
export function dashboardLink(kind: LinkKind): string {
  return `https://app.icancall.co/dashboard?n=${kind}`;
}
