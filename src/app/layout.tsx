import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

// Atkinson Hyperlegible Next (Braille Institute, SIL OFL: fonts/OFL.txt), the
// variable Latin subset from Google Fonts. One file covers weights 200-800.
// scripts/embed-standalone-font.mjs embeds the same file in the landing exports.
const atkinson = localFont({
  src: "./fonts/AtkinsonHyperlegibleNext-latin.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "iCanCall - Smart Family Voice Routing",
  description: "Give your family a dedicated phone number that intelligently cascades calls to trusted contacts until someone answers.",
  alternates: {
    types: {
      "text/markdown": "/index.md",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const concordProjectId = process.env.NEXT_PUBLIC_CONCORD_PROJECT_ID;
  const showConcord = concordProjectId && concordProjectId !== "YOUR_CONCORD_PROJECT_ID";

  return (
    <html
      lang="en"
      className={`${atkinson.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* React hoists this into <head>; the Metadata API has no rel="describedby" support */}
        <link rel="describedby" type="text/plain" href="/llms.txt" />
        {showConcord && (
          <Script
            src={`https://api.concord.tech/site-v1/${concordProjectId}/site-client`}
            strategy="beforeInteractive"
          />
        )}
        {children}
      </body>
    </html>
  );
}
