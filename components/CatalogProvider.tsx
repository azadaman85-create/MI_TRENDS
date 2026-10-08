"use client";

import { createContext, useContext, useMemo } from "react";

import type { Product } from "@/lib/types";

/**
 * The live catalogue, handed down from the server.
 *
 * Every storefront screen is a client component, but the products come from MongoDB, so
 * they are read once in the server layout and passed in here rather than fetched again in
 * the browser. That keeps the first paint complete — no empty grid that fills in a moment
 * later — and leaves exactly one place that knows where products come from.
 *
 * This replaces the previous `import { products } from "@/lib/catalog"`, which compiled a
 * hand-written array into the bundle and could only change on a redeploy.
 */

type CatalogValue = {
  products: Product[];
  getProductById: (id: number | string) => Product | undefined;
  getProductBySlug: (slug: string) => Product | undefined;
};

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ products, children }: { products: Product[]; children: React.ReactNode }) {
  const value = useMemo<CatalogValue>(() => {
    // Indexed once per catalogue change: the cart rebuilds every line through
    // getProductById on each render, and a linear scan per line adds up.
    const byId = new Map(products.map((product) => [String(product.id), product]));
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    return {
      products,
      getProductById: (id) => byId.get(String(id)),
      getProductBySlug: (slug) => bySlug.get(slug),
    };
  }, [products]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}

/** Convenience for the many screens that only want the list. */
export function useProducts(): Product[] {
  return useCatalog().products;
}
