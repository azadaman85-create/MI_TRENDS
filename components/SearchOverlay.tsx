"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Search, TrendingUp, X } from "lucide-react";

import { useStore } from "@/components/StoreProvider";
import { products } from "@/lib/catalog";
import { money } from "@/lib/format";

const trendingSearches = [
  "Oversized tees",
  "Graphic tees",
  "Hoodies",
  "Sneakers",
];

export function SearchOverlay() {
  const { searchOpen, openSearch, closeSearch } = useStore();

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        openSearch();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [openSearch]);

  if (!searchOpen) return null;

  return <SearchModal closeSearch={closeSearch} />;
}

function SearchModal({ closeSearch }: { closeSearch: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const normalizedQuery = query.trim().toLowerCase();
  const matchingProducts = useMemo(() => {
    if (!normalizedQuery) {
      return [...products]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 6);
    }

    return products.filter((product) => {
      const searchableText = [
        product.name,
        product.collection,
        product.type,
        product.category,
        ...product.tags,
      ]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, []);

  const submitSearch = (event?: FormEvent) => {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    closeSearch();
    router.push(`/shop?q=${encodeURIComponent(cleanQuery)}`);
  };

  const visibleProducts = matchingProducts.slice(0, 6);

  return (
    <section
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-overlay-title"
    >
      <header className="search-overlay-header shell">
        <Link
          className="brand-lockup"
          href="/"
          onClick={closeSearch}
          aria-label="MI TRENDS home"
        >
          <span className="brand-mark" aria-hidden="true">
            MI
          </span>
          <span className="brand-name">TRENDS</span>
        </Link>
        <button
          className="icon-button search-close"
          type="button"
          onClick={closeSearch}
          aria-label="Close search"
        >
          <X aria-hidden="true" size={24} />
        </button>
      </header>

      <div className="search-overlay-content shell">
        <div className="search-intro">
          <p className="eyebrow">Find your next repeat-wear</p>
          <h2 id="search-overlay-title">What are you looking for?</h2>
        </div>

        <form className="search-form" role="search" onSubmit={submitSearch}>
          <Search className="search-form-icon" aria-hidden="true" size={22} />
          <label className="sr-only" htmlFor="global-product-search">
            Search products and collections
          </label>
          <input
            id="global-product-search"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tees, collections, colours..."
            autoComplete="off"
            aria-controls="search-suggestions"
          />
          {query && (
            <button
              className="search-clear-button"
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </form>

        <div className="trending-searches" aria-label="Trending searches">
          <span className="trending-searches-label">
            <TrendingUp aria-hidden="true" size={16} />
            Trending
          </span>
          <div className="search-chip-list">
            {trendingSearches.map((term) => (
              <button
                className="search-chip"
                type="button"
                key={term}
                onClick={() => {
                  setQuery(term);
                  inputRef.current?.focus();
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="search-results" id="search-suggestions" aria-live="polite">
          <div className="search-results-heading">
            <h3>
              {normalizedQuery
                ? `${matchingProducts.length} ${matchingProducts.length === 1 ? "match" : "matches"}`
                : "Popular right now"}
            </h3>
            {normalizedQuery && matchingProducts.length > 0 && (
              <button className="text-link" type="button" onClick={() => submitSearch()}>
                See all results
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            )}
          </div>

          {visibleProducts.length > 0 ? (
            <ul className="search-suggestion-list">
              {visibleProducts.map((product) => (
                <li key={product.id}>
                  <Link
                    className="search-suggestion"
                    href={`/product/${product.slug}`}
                    onClick={closeSearch}
                  >
                    <span
                      className="search-suggestion-art"
                      role="img"
                      aria-label={`${product.name} product artwork`}
                      style={{
                        background: `linear-gradient(145deg, ${product.palette[0]}, ${product.palette[1]} 58%, ${product.palette[2]})`,
                      }}
                    >
                      <span aria-hidden="true">{product.art}</span>
                    </span>
                    <span className="search-suggestion-copy">
                      <small>{product.collection}</small>
                      <strong>{product.name}</strong>
                      <span>{product.type}</span>
                    </span>
                    <span className="search-suggestion-price">
                      {money(product.price)}
                    </span>
                    <ArrowRight
                      className="search-suggestion-arrow"
                      aria-hidden="true"
                      size={18}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="search-empty-state">
              <h3>No exact match yet</h3>
              <p>
                Try a product type, colour, or collection name—or browse the full
                drop.
              </p>
              <Link className="button button-secondary" href="/shop" onClick={closeSearch}>
                Browse all styles
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SearchOverlay;
