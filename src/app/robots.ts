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

  // Otherwise, default marketing site crawler rules
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/super-admin", "/onboarding", "/login"],
    },
    sitemap: "https://icancall.co/sitemap.xml",
  };
}
