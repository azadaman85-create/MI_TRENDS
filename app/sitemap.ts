import type { MetadataRoute } from "next";

import { products } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

/**
 * Every page worth indexing: the storefront entry points, each product, and the
 * information pages. Private routes (cart, checkout, account, admin) are left out
 * here and disallowed in robots.ts.
 *
 * Built from the catalogue rather than written by hand, so a new product is listed
 * the moment it ships.
 */

const INFO_PAGES = [
  "about",
  "contact",
  "faqs",
  "shipping",
  "returns",
  "size-guide",
  "track-order",
  "terms",
  "privacy",
  "accessibility",
  "stores",
  "careers",
  "press",
  "gift-cards",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...products.map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...INFO_PAGES.map((slug) => ({
      url: `${base}/info/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
