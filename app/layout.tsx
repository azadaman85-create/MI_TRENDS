import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Without `cover`, env(safe-area-inset-*) resolves to 0 on iOS, and the fixed
  // bottom bars (tab bar, product buy bar) end up under the home indicator.
  viewportFit: "cover",
  themeColor: "#171716",
};

export const metadata: Metadata = {
  title: {
    default: "MI TRENDS — Made to be noticed",
    template: "%s | MI TRENDS",
  },
  description:
    "Original streetwear, graphic essentials and everyday statement pieces designed in India.",
  referrer: "no-referrer",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/*
        Browser extensions (Grammarly, password managers, translators) add attributes to
        <body> before React hydrates, which reads as a mismatch. Suppressing here covers
        this element's own attributes only — real mismatches inside the tree still warn.
      */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
