import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const baseHost = host.split(":")[0];

  // If the host is the app subdomain, block all crawlers from indexing
  if (baseHost === "app.icancall.co") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  // Marketing pages are public app-surface for AI assistants (see /llms.txt
  // and /index.md), so AI crawlers are explicitly welcomed. A bot that finds
  // its own named group ignores the "*" group entirely, so each named group
  // must repeat the app-route disallows.
  const appRoutes = ["/dashboard", "/super-admin", "/signup", "/login"];
  const aiCrawlers = [
    // OpenAI: training, search index, and user-driven fetches
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    // Anthropic: training, search index, and user-driven fetches
    "ClaudeBot",
    "Claude-SearchBot",
    "Claude-User",
    // Perplexity: index and user-driven fetches
    "PerplexityBot",
    "Perplexity-User",
    // Google Gemini training opt-in (search crawling stays on Googlebot)
    "Google-Extended",
    // Apple Intelligence training
    "Applebot-Extended",
    // Meta AI
    "meta-externalagent",
    // Common Crawl (feeds many model training sets)
    "CCBot",
  ];

  // Otherwise, default marketing site crawler rules
  return {
    rules: [
      {
        userAgent: aiCrawlers,
        allow: "/",
        disallow: appRoutes,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: appRoutes,
      },
    ],
    sitemap: "https://www.icancall.co/sitemap.xml",
  };
}
