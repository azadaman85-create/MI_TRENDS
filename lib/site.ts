/**
 * The site's own absolute origin.
 *
 * Needed wherever a relative path won't do: links and images in email, canonical and
 * Open Graph URLs, the sitemap. Read at call time rather than captured at module load,
 * so a host that injects the variable late still gets the right value.
 */
const FALLBACK = "https://mitrends.co.in";

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  // A trailing slash would turn every `${siteUrl()}/path` into a double slash.
  return (configured || FALLBACK).replace(/\/+$/, "");
}
