import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";

import { siteUrl } from "@/lib/site";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /*
    Without this, browsers allow pinch-zooming out to 0.25 — the layout viewport stays
    at device width while the visual viewport grows, so the page shrinks into a corner
    with blank canvas filling the rest of the screen. Pinning the floor at 1 means the
    page can never be zoomed out smaller than "fits the screen".

    Zooming *in* is untouched (maximumScale stays 5), so this doesn't take away the
    zoom that low-vision users actually rely on.
  */
  minimumScale: 1,
  maximumScale: 5,
  // Without `cover`, env(safe-area-inset-*) resolves to 0 on iOS, and the fixed
  // bottom bars (tab bar, product buy bar) end up under the home indicator.
  viewportFit: "cover",
  themeColor: "#171716",
};

const DESCRIPTION =
  "Original streetwear, graphic essentials and everyday statement pieces designed in India.";

export const metadata: Metadata = {
  // Lets Next resolve the relative URLs below into absolute ones. Without it, Open
  // Graph images are emitted as paths, which no social scraper can fetch.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "MI TRENDS — Made to be noticed",
    template: "%s | MI TRENDS",
  },
  description: DESCRIPTION,
  referrer: "no-referrer",
  applicationName: "MI TRENDS",
  // Shown when the link is pasted into WhatsApp, Instagram, Slack or a search result.
  openGraph: {
    type: "website",
    siteName: "MI TRENDS",
    title: "MI TRENDS — Made to be noticed",
    description: DESCRIPTION,
    url: "/",
    locale: "en_IN",
    images: [{ url: "/images/logo-email.png", width: 1200, height: 262, alt: "MI TRENDS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MI TRENDS — Made to be noticed",
    description: DESCRIPTION,
    images: ["/images/logo-email.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        Browser extensions (Grammarly, password managers, translators) add attributes to
        <html>/<body> before React hydrates, which reads as a mismatch. Suppressing here covers
        these elements' own attributes only — real mismatches inside the tree still warn.
      */}
      <body suppressHydrationWarning>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
