import type { NextRequest } from "next/server";
import {
  renderHomepageMarkdown,
  renderComingSoonMarkdown,
} from "@/lib/homepage-markdown";
import { PRELAUNCH, isPrelaunchGated } from "@/lib/prelaunch";

export async function GET(request: NextRequest) {
  const gated = isPrelaunchGated(request);

  return new Response(
    gated ? renderComingSoonMarkdown() : renderHomepageMarkdown(),
    {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        // While the prelaunch gate is on, the response depends on the
        // bypass cookie — a shared cache primed by a bypassed tester would
        // leak the full edition to everyone, so caching is disabled.
        "Cache-Control": PRELAUNCH ? "no-store" : "public, max-age=3600",
        // Consolidate search ranking signals on the HTML page without
        // hiding this markdown edition from AI answer engines
        Link: gated
          ? '<https://www.icancall.co/coming-soon>; rel="canonical"'
          : '<https://www.icancall.co/>; rel="canonical"',
      },
    },
  );
}
