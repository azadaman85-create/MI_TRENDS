"use client";

import { useSyncExternalStore } from "react";

import { BANNER_EVENT, readBannerFeed } from "@/lib/banner-feed";
import type { Banner } from "@/lib/admin/types";

const EMPTY: Banner[] = [];

/**
 * `getSnapshot` must return a referentially stable value or React re-renders forever,
 * and `readBannerFeed` parses JSON into a fresh array every call. So cache the parse
 * and only hand back a new array when the stored string actually changed.
 */
let cachedRaw: string | null = null;
let cachedFeed: Banner[] = EMPTY;

function getSnapshot(): Banner[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem("mitrends-banner-feed-v1");
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedFeed = readBannerFeed();
  }
  return cachedFeed;
}

/** The server has no storage, so it always renders the page's own default slides. */
function getServerSnapshot(): Banner[] {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  // `storage` covers the admin panel in another tab; the custom event covers this one.
  window.addEventListener(BANNER_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(BANNER_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Banners saved by the admin panel, live-updating when the panel saves again. */
export function useBannerFeed(): Banner[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
