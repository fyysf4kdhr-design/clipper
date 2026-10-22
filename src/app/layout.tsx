import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PwaProvider from "@/components/PwaProvider";
import CursorGlow from "@/components/CursorGlow";

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const jb = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "KLYP",
  title: "KLYP — AI YouTube clipper",
  description:
    "Paste a YouTube link. KLYP finds the moments worth sharing and cuts them into scored, captioned, vertical clips.",
  appleWebApp: {
    capable: true,
    title: "KLYP",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#07070C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${space.variable} ${jb.variable}`}>
      <body className="bg-ink text-cream antialiased">
        <div className="bg-orbs" aria-hidden>
          <span className="orb orb-acid animate-aurora-a" />
          <span className="orb orb-holo animate-aurora-b" />
          <span className="orb orb-viol" />
        </div>
        <div className="noise-overlay" aria-hidden />
        <div className="scanlines" aria-hidden />
        <CursorGlow />
        {children}
        <PwaProvider />
      </body>
    </html>
  );
}
