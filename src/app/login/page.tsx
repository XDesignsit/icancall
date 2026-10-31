import type { Metadata } from "next";
import { isLinkKind } from "@/lib/linkKinds";
import { LINK_PREVIEWS, OG_SIZE } from "@/lib/linkPreviews";
import LoginPage from "./LoginPage";

// Links sent by text go to /dashboard?n=<kind>. A preview fetcher has no
// session, so the proxy redirects it here with n kept, and the preview shows
// the card for that kind instead of the site-wide one.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { n } = await searchParams;
  if (!isLinkKind(n)) return {};
  const { title, tagline } = LINK_PREVIEWS[n];
  const images = [{ url: `/api/og/${n}`, ...OG_SIZE, type: "image/png", alt: `iCanCall: ${title}` }];
  return {
    openGraph: { type: "website", siteName: "iCanCall", title: `${title} · iCanCall`, description: tagline, images },
    twitter: { card: "summary_large_image", title: `${title} · iCanCall`, description: tagline, images },
  };
}

export default function Page() {
  return <LoginPage />;
}
