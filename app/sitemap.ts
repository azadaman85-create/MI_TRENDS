import type { MetadataRoute } from "next";

import { getActiveProducts } from "@/lib/products.server";
import { siteUrl } from "@/lib/site";

/**
 * Every page worth indexing: the storefront entry points, each product, and the
 * information pages. Private routes (cart, checkout, account, admin) are left out here
 * and disallowed in robots.ts.
 *
 * Generated per request, not at build time. Next prerenders a sitemap by default, which
 * meant the build itself opened a database connection — so a deploy failed outright if
 * the database was unreachable or its URI hadn't been set yet. A build should not need
 * runtime secrets, and a sitemap baked at build time would freeze the catalogue into the
 * deployment anyway, which is the thing this project moved away from.
 */
export const dynamic = "force-dynamic";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...INFO_PAGES.map((slug) => ({
      url: `${base}/info/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];

  // A database that is briefly unreachable should cost the product URLs, not the whole
  // sitemap — an empty document would tell search engines the site has no pages at all.
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getActiveProducts();
    productEntries = products.map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("sitemap: could not read products, serving static pages only", error);
  }

  return [...staticEntries.slice(0, 2), ...productEntries, ...staticEntries.slice(2)];
}
