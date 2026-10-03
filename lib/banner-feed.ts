import type { Banner } from "@/lib/admin/types";

/**
 * Hand-off between the admin banners screen and the storefront.
 *
 * Same shape as `lib/stock-feed.ts`: there is no backend, so banners saved in the
 * panel are written to their own localStorage key and the storefront reads them
 * when rendering. Keeping it in a separate key (rather than the admin store's own
 * `mitrends-admin-state-v4`) means a shopper who has never opened the panel just
 * falls back to the homepage's own hardcoded hero slides.
 */
const BANNER_KEY = "mitrends-banner-feed-v1";

/** Broadcast so an open storefront tab can react without a reload. */
export const BANNER_EVENT = "mitrends:banners";

export function readBannerFeed(): Banner[] {
  try {
    const raw = window.localStorage.getItem(BANNER_KEY);
    const parsed = raw ? (JSON.parse(raw) as Banner[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Storage unavailable (private mode, blocked cookies) — fall back to the defaults.
    return [];
  }
}

/** Called whenever the panel's banner list changes. Replaces the feed wholesale. */
export function publishBannerFeed(banners: Banner[]) {
  try {
    window.localStorage.setItem(BANNER_KEY, JSON.stringify(banners));
    // `storage` only fires in *other* tabs, so dispatch locally too.
    window.dispatchEvent(new CustomEvent(BANNER_EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Whether `now` falls inside the banner's start/end window (empty bounds = unbounded). */
function isWithinSchedule(banner: Banner, now: number): boolean {
  const starts = banner.startsAt ? Date.parse(banner.startsAt) : NaN;
  const ends = banner.endsAt ? Date.parse(banner.endsAt) : NaN;
  if (!Number.isNaN(starts) && now < starts) return false;
  if (!Number.isNaN(ends) && now > ends) return false;
  return true;
}

/** Banners the panel has marked live, currently inside their scheduled window, for a placement. */
export function activeBanners(banners: Banner[], placement: Banner["placement"]): Banner[] {
  const now = Date.now();
  return banners
    .filter((banner) => banner.placement === placement && banner.status === "live" && isWithinSchedule(banner, now))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
