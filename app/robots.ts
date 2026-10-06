import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * Keeps crawlers out of everything that is either private (the panel, the APIs) or
 * meaningless to index (a cart, a checkout, a one-off order confirmation). Without
 * this they are all fair game, and /admin in particular has no business in search.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/", "/account/", "/cart", "/checkout", "/order-success"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
