import { headers } from "next/headers";
import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * Two jobs.
 *
 * On the real domain: keep crawlers out of everything private (the panel, the APIs) or
 * meaningless to index (a cart, a checkout, a one-off order confirmation).
 *
 * On any other hostname — a preview deployment, the generated *.vercel.app alias —
 * disallow everything. Those serve the same pages on a different address, which is
 * duplicate content that splits the real domain's ranking, and an alias can sit on an
 * older build and show products that are no longer for sale. The canonical redirect in
 * proxy.ts covers this too, but robots gets read by crawlers that never follow it, and
 * applies even to a deployment the redirect hasn't reached yet.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";
  const canonical = new URL(siteUrl()).host;
  // Only the production domain is indexable. An unreadable host is treated as
  // non-canonical: refusing to be indexed is the safe way to be wrong.
  const isCanonical = host === canonical;

  if (!isCanonical) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/", "/account/", "/cart", "/checkout", "/order-success"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
