import { renderHomepageMarkdown } from "@/lib/homepage-markdown";

export async function GET() {
  return new Response(renderHomepageMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      // Consolidate search ranking signals on the HTML homepage without
      // hiding this markdown edition from AI answer engines (unlike noindex)
      Link: '<https://www.icancall.co/>; rel="canonical"',
    },
  });
}
