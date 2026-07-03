import { renderHomepageMarkdown } from "@/lib/homepage-markdown";

export async function GET() {
  return new Response(renderHomepageMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
