import { LINK_KINDS, isLinkKind } from "@/lib/linkKinds";
import { LINK_PREVIEWS, previewImage } from "@/lib/linkPreviews";

// The link preview card for each kind of link sent by text, rendered at build
// time. Under /api so the proxy never redirects it between hosts.
export const dynamicParams = false;

export function generateStaticParams() {
  return LINK_KINDS.map((kind) => ({ kind }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isLinkKind(kind)) return new Response("Not found", { status: 404 });
  return previewImage(LINK_PREVIEWS[kind]);
}
