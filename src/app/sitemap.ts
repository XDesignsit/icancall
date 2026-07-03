import { MetadataRoute } from "next";

// Marketing pages only — app routes (/dashboard, /signup, /login,
// /super-admin) are disallowed in robots.txt and excluded here.
// URLs use www.icancall.co, the canonical host (the apex 308s to it).
const BASE = "https://www.icancall.co";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/seniors`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/parents`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/caregivers`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/comparison-chart`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms-of-service`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
