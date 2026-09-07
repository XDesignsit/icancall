import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value:
              '</index.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain"',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "xdesignsit",
  project: "icancall",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  // disableLogger / automaticVercelMonitors moved under `webpack` in Sentry 10.
  // Both are webpack-only and inert under Turbopack, which is what `next dev`
  // uses -- kept so webpack builds behave as before, without the deprecation.
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
});
