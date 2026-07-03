import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
