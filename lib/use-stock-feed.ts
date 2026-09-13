"use client";

import { useSyncExternalStore } from "react";

import { readStockFeed, STOCK_EVENT, type StockFeed } from "@/lib/stock-feed";

const EMPTY: StockFeed = {};

/**
 * `getSnapshot` must return a referentially stable value or React re-renders forever,
 * and `readStockFeed` parses JSON into a fresh object every call. So cache the parse and
 * only hand back a new object when the stored string actually changed.
 */
let cachedRaw: string | null = null;
let cachedFeed: StockFeed = EMPTY;

function getSnapshot(): StockFeed {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem("mitrends-stock-v1");
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedFeed = readStockFeed();
  }
  return cachedFeed;
}

/** The server has no storage, so it always renders the catalogue's own availability. */
function getServerSnapshot(): StockFeed {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  // `storage` covers the admin panel in another tab; the custom event covers this one.
  window.addEventListener(STOCK_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STOCK_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Stock saved by the admin panel, live-updating when the panel saves again. */
export function useStockFeed(): StockFeed {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
