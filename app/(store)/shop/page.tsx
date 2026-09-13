"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, IndianRupee, Layers, Percent, Ruler, Shapes, Shirt, Tag } from "lucide-react";
import { collections as allCollections, products } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { FilterBar, type Filter, type FilterFieldDef } from "@/components/ui/filter-token-bar";
import type { Product } from "@/lib/types";

type SortKey = "popular" | "newest" | "price-asc" | "price-desc" | "discount" | "rating";

const sortLabels: Record<SortKey, string> = {
  popular: "Most popular",
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  discount: "Best discount",
  rating: "Top rated",
};

const priceBands = [
  { value: "under-799", label: "Under ₹799", min: 0, max: 799 },
  { value: "800-1199", label: "₹800 – ₹1,199", min: 800, max: 1199 },
  { value: "1200-1799", label: "₹1,200 – ₹1,799", min: 1200, max: 1799 },
  { value: "1800-plus", label: "₹1,800 & above", min: 1800, max: Infinity },
];

const discountBands = [10, 20, 30, 40];

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Product types as they appear in the catalogue, keyed by URL slug. */
const typeBySlug = new Map(
  [...new Set(products.map((product) => product.type))].map((type) => [slugify(type), type]),
);

/** The mega-menu links use friendlier slugs than the raw type names. */
const typeAliases: Record<string, string[]> = {
  tees: ["t-shirt"],
  "t-shirts": ["t-shirt"],
  tshirts: ["t-shirt"],
  shirts: ["shirt"],
  pyjamas: ["pyjama-set"],
  pajamas: ["pyjama-set"],
  sleepwear: ["pyjama-set"],
  nightwear: ["pyjama-set"],
};

const sizeOrder = [
  "XS", "S", "M", "L", "XL", "XXL",
  "28", "30", "32", "34", "36", "38",
  "UK6", "UK7", "UK8", "UK9", "UK10", "UK11",
  "Free size",
];

const availableSizes = (() => {
  const present = new Set(products.flatMap((product) => product.sizes));
  return sizeOrder.filter((size) => present.has(size));
})();

const PaletteGlyph = ({ palette }: { palette: readonly string[] }) => (
  <span style={{ display: "inline-flex", gap: 2 }} aria-hidden>
    {palette.slice(0, 3).map((hex) => (
      <span
        key={hex}
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: hex,
          border: "1px solid rgb(0 0 0 / 0.15)",
        }}
      />
    ))}
  </span>
);

const fields: FilterFieldDef[] = [
  {
    id: "category",
    label: "Category",
    icon: <Shapes size={13} />,
    operators: [
      { value: "is", label: "is" },
      { value: "is_not", label: "is not", negate: true },
      { value: "is_any", label: "is any of", multi: true },
    ],
    options: (["men", "women", "unisex"] as const)
      .filter((value) => products.some((product) => product.category === value))
      .map((value) => ({ value, label: `${value[0].toUpperCase()}${value.slice(1)}` })),
  },
  {
    id: "type",
    label: "Product type",
    icon: <Shirt size={13} />,
    operators: [
      { value: "is_any", label: "is any of", multi: true },
      { value: "is_none", label: "is none of", multi: true, negate: true },
    ],
    options: [...typeBySlug.entries()]
      .map(([slug, type]) => ({ value: slug, label: type }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  },
  {
    id: "size",
    label: "Size",
    icon: <Ruler size={13} />,
    operators: [{ value: "is_any", label: "is any of", multi: true }],
    options: availableSizes.map((size) => ({ value: slugify(size), label: size })),
  },
  {
    id: "collection",
    label: "Collection",
    icon: <Layers size={13} />,
    operators: [
      { value: "is_any", label: "is any of", multi: true },
      { value: "is_none", label: "is none of", multi: true, negate: true },
    ],
    options: allCollections.map((collection) => ({
      value: collection.slug,
      label: collection.name,
      glyph: <PaletteGlyph palette={collection.palette} />,
    })),
  },
  {
    id: "tag",
    label: "Tag",
    icon: <Tag size={13} />,
    operators: [
      { value: "is_any", label: "is any of", multi: true },
      { value: "is_none", label: "is none of", multi: true, negate: true },
    ],
    options: [
      { value: "new", label: "New arrival" },
      { value: "bestseller", label: "Bestseller" },
      { value: "sale", label: "On sale" },
    ],
  },
  {
    id: "price",
    label: "Price",
    icon: <IndianRupee size={13} />,
    operators: [{ value: "is", label: "is" }],
    options: priceBands.map((band) => ({ value: band.value, label: band.label })),
  },
  {
    id: "discount",
    label: "Discount",
    icon: <Percent size={13} />,
    operators: [{ value: "at_least", label: "is at least" }],
    options: discountBands.map((value) => ({ value: String(value), label: `${value}% off` })),
  },
];

const fieldMap = new Map(fields.map((field) => [field.id, field]));

/** Negative operators are written to the URL as a leading "!" on the value list. */
function negatedOperator(fieldId: string) {
  return fieldMap.get(fieldId)?.operators.find((operator) => operator.negate)?.value;
}

function isNegated(fieldId: string, operator: string) {
  return !!fieldMap.get(fieldId)?.operators.find((o) => o.value === operator)?.negate;
}

function defaultOperator(fieldId: string) {
  return fieldMap.get(fieldId)?.operators[0]?.value ?? "is";
}

function normalizeValues(fieldId: string, raw: string[]) {
  const options = fieldMap.get(fieldId)?.options;
  return raw
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .filter((value) => options?.some((option) => option.value === value));
}

function expandValues(fieldId: string, raw: string[]) {
  if (fieldId === "type") return raw.flatMap((value) => typeAliases[value] ?? [value]);
  if (fieldId === "collection")
    return raw.map((value) => {
      // Accept either a slug or a display name, which older links used.
      const match = allCollections.find(
        (entry) => entry.slug === value || slugify(entry.name) === slugify(value),
      );
      return match?.slug ?? value;
    });
  return raw;
}

function operatorFor(fieldId: string, values: string[], negate: boolean) {
  const field = fieldMap.get(fieldId);
  if (negate) return negatedOperator(fieldId) ?? defaultOperator(fieldId);
  if (values.length > 1) return field?.operators.find((o) => o.multi)?.value ?? defaultOperator(fieldId);
  return defaultOperator(fieldId);
}

/**
 * Filters live entirely in the query string, so any view is shareable. A field can appear
 * more than once (`?tag=new&tag=!sale`), a leading "!" means the negative operator, and a
 * bare key (`?type=`) is a token the shopper has opened but not answered yet.
 */
function parseFilters(params: URLSearchParams): Filter[] {
  const parsed: Filter[] = [];

  for (const field of fields) {
    let entries = params.getAll(field.id);

    if (field.id === "category" && !entries.length) entries = params.getAll("gender");
    if (field.id === "price" && !entries.length && params.get("maxPrice") === "799")
      entries = ["under-799"];
    if (field.id === "collection" && !entries.length && params.get("browse") === "collections")
      entries = [""];

    entries.forEach((raw, index) => {
      const negate = raw.startsWith("!");
      const body = negate ? raw.slice(1) : raw;
      const values = normalizeValues(field.id, expandValues(field.id, body.split(",")));
      const single = !fieldMap.get(field.id)?.operators.find((o) => o.value === operatorFor(field.id, values, negate))?.multi;
      parsed.push({
        id: `${field.id}-${index}`,
        field: field.id,
        operator: operatorFor(field.id, values, negate),
        values: single ? values.slice(0, 1) : values,
      });
    });
  }

  return parsed;
}

function serializeFilters(filters: Filter[], params: URLSearchParams) {
  const next = new URLSearchParams();
  ["q", "sort"].forEach((name) => {
    const value = params.get(name);
    if (value) next.set(name, value);
  });

  for (const filter of filters) {
    const prefix = isNegated(filter.field, filter.operator) ? "!" : "";
    next.append(filter.field, filter.values.length ? `${prefix}${filter.values.join(",")}` : "");
  }

  // Keep the entry point in the URL so the page keeps its "Browse collections" framing.
  if (params.get("browse") === "collections") next.set("browse", "collections");

  return next.toString();
}

function matchesFilter(product: Product, filter: Filter) {
  if (!filter.values.length) return true;
  const negate = isNegated(filter.field, filter.operator);
  const values = filter.values;
  let hit = false;

  switch (filter.field) {
    case "category":
      // Unisex pieces belong to both the men's and women's edits.
      hit = values.includes(product.category) || (!negate && product.category === "unisex" && values.some((v) => v !== "unisex"));
      break;
    case "type":
      hit = values.includes(slugify(product.type));
      break;
    case "size":
      hit = product.sizes.some((size) => values.includes(slugify(size)));
      break;
    case "collection":
      hit = values.includes(product.collectionSlug);
      break;
    case "tag":
      hit = product.tags.some((tag) => values.includes(tag));
      break;
    case "price": {
      const band = priceBands.find((entry) => entry.value === values[0]);
      hit = !!band && product.price >= band.min && product.price <= band.max;
      break;
    }
    case "discount":
      hit = product.discount >= Number(values[0]);
      break;
    default:
      hit = true;
  }

  return negate ? !hit : hit;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const paramString = searchParams.toString();

  const query = (searchParams.get("q") || "").trim();
  const browsingCollections = searchParams.get("browse") === "collections";

  const [filters, setFilters] = useState<Filter[]>(() =>
    parseFilters(new URLSearchParams(paramString)),
  );
  const [sort, setSort] = useState<SortKey>(() => {
    const fromUrl = searchParams.get("sort") as SortKey | null;
    return fromUrl && fromUrl in sortLabels ? fromUrl : "popular";
  });

  // The query string we last wrote ourselves, so our own writes don't re-seed state.
  const [written, setWritten] = useState(paramString);
  const [syncedParams, setSyncedParams] = useState(paramString);

  if (paramString !== syncedParams) {
    // A link elsewhere on the site changed the query (e.g. the Men/Women mega menu).
    setSyncedParams(paramString);
    if (paramString !== written) {
      setFilters(parseFilters(new URLSearchParams(paramString)));
      const nextSort = new URLSearchParams(paramString).get("sort") as SortKey | null;
      setSort(nextSort && nextSort in sortLabels ? nextSort : "popular");
    }
  }

  const writeParams = useCallback(
    (serialized: string) => {
      setWritten(serialized);
      window.history.replaceState(null, "", serialized ? `${pathname}?${serialized}` : pathname);
    },
    [pathname],
  );

  const applyFilters = useCallback(
    (next: Filter[]) => {
      setFilters(next);
      writeParams(serializeFilters(next, new URLSearchParams(window.location.search)));
    },
    [writeParams],
  );

  const updateSort = (next: SortKey) => {
    setSort(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "popular") params.delete("sort");
    else params.set("sort", next);
    writeParams(params.toString());
  };

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const list = products.filter((product) => {
      if (normalizedQuery) {
        const searchable =
          `${product.name} ${product.collection} ${product.type} ${product.art}`.toLowerCase();
        if (!searchable.includes(normalizedQuery)) return false;
      }
      return filters.every((filter) => matchesFilter(product, filter));
    });

    return [...list].sort((a, b) => {
      if (sort === "newest") return Number(b.tags.includes("new")) - Number(a.tags.includes("new")) || b.id - a.id;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "discount") return b.discount - a.discount;
      if (sort === "rating") return b.rating - a.rating;
      return b.popularity - a.popularity;
    });
  }, [query, filters, sort]);

  const activeCategory = filters.find((filter) => filter.field === "category");
  const activeTag = filters.find((filter) => filter.field === "tag");

  const title = query
    ? `Results for “${query}”`
    : browsingCollections
      ? "Browse collections"
      : activeTag?.values.includes("sale")
        ? "The sale edit"
        : activeTag?.values.includes("new")
          ? "New arrivals"
          : activeCategory?.values.length === 1
            ? `${activeCategory.values[0][0].toUpperCase()}${activeCategory.values[0].slice(1)}'s edit`
            : "Shop all";

  return (
    <div className="shop-page">
      <div className="shop-crumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Shop</span>
      </div>

      <header className="shop-hero">
        <div>
          <span className="eyebrow">Curated for right now</span>
          <h1>{title}</h1>
          <p>
            {filtered.length} original {filtered.length === 1 ? "style" : "styles"}, designed for
            everyday main-character energy.
          </p>
        </div>
        <div className="sort-wrap">
          <label htmlFor="sort">Sort by</label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => updateSort(event.target.value as SortKey)}
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </header>

      <div className="filter-rail">
        <FilterBar
          fields={fields}
          value={filters}
          onChange={applyFilters}
          aria-label="Product filters"
          addLabel="Add filter"
          emptyLabel="Filter this edit"
        />
        {browsingCollections && filters.every((filter) => !filter.values.length) && (
          <p className="filter-hint">
            Pick a collection to see the drop, or add another filter to narrow it further.
          </p>
        )}
      </div>

      <div className="mobile-toolbar">
        <div className="mobile-sort">
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(event) => updateSort(event.target.value as SortKey)}
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </div>
      </div>

      <div className="shop-body">
        <section aria-live="polite">
          {filtered.length ? (
            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="shop-empty">
              <span>Nothing hiding here</span>
              <h2>Try a wider mix.</h2>
              <p>Remove a filter or browse every MI TRENDS piece to get back in the flow.</p>
              <button type="button" onClick={() => applyFilters([])}>
                Reset filters
              </button>
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .shop-page { width: min(1400px, calc(100% - 48px)); margin: 0 auto; padding: 28px 0 90px; color: #171717; }
        .shop-crumb { display: flex; gap: 8px; align-items: center; color: #77716a; font-size: 12px; margin-bottom: 34px; }
        .shop-crumb a { color: inherit; text-decoration: none; }
        .shop-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; padding-bottom: 28px; border-bottom: 1px solid #dedbd5; }
        .eyebrow { color: #e84a2a; font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        h1 { max-width: 850px; margin: 8px 0 8px; font-size: clamp(36px, 5vw, 68px); line-height: .94; letter-spacing: -.055em; text-transform: uppercase; }
        .shop-hero p { margin: 0; color: #69645e; font-size: 14px; }
        .sort-wrap { position: relative; flex: 0 0 232px; }
        .sort-wrap label { display: block; margin-bottom: 7px; font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .sort-wrap select, .mobile-sort select { width: 100%; appearance: none; border: 1px solid #d8d4cd; background: #fff; color: #171717; border-radius: 6px; min-height: 48px; padding: 0 42px 0 14px; font: inherit; cursor: pointer; }
        .sort-wrap > :global(svg), .mobile-sort > :global(svg) { pointer-events: none; position: absolute; right: 14px; bottom: 16px; }

        .filter-rail { position: sticky; top: 104px; z-index: 20; display: grid; gap: 9px; margin: 0 -6px; padding: 16px 6px 15px; background: linear-gradient(#fffdf9 78%, rgb(255 253 249 / 0)); }
        .filter-hint { margin: 0; color: #77716a; font-size: 12px; }

        .shop-body { padding-top: 10px; }
        .product-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 34px 15px; }
        .shop-empty { min-height: 480px; display: grid; place-content: center; justify-items: center; text-align: center; background: #f4f2ee; border-radius: 10px; padding: 30px; }
        .shop-empty span { color: #e4482a; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .11em; }
        .shop-empty h2 { margin: 8px 0; font-size: clamp(30px, 5vw, 54px); letter-spacing: -.05em; text-transform: uppercase; }
        .shop-empty p { max-width: 440px; margin: 0 0 22px; color: #68635d; line-height: 1.6; }
        .shop-empty button { border: 0; border-radius: 5px; min-height: 48px; padding: 0 24px; background: #171717; color: #fff; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; cursor: pointer; }
        .mobile-toolbar { display: none; }
        button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible { outline: 3px solid #f3a078; outline-offset: 2px; }

        @media (max-width: 1180px) { .product-grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
        @media (max-width: 900px) {
          .shop-page { width: min(100% - 32px, 1400px); padding-top: 22px; }
          .shop-hero { align-items: flex-start; }
          .sort-wrap { display: none; }
          .filter-rail { position: static; padding-top: 18px; background: none; }
          .mobile-toolbar { display: block; margin-top: 4px; }
          .mobile-sort { position: relative; border: 1px solid #d9d5ce; border-radius: 6px; overflow: hidden; }
          .mobile-sort select { min-height: 48px; border: 0; font-size: 12px; font-weight: 800; text-transform: uppercase; }
          .mobile-sort > :global(svg) { bottom: 16px; }
          .shop-body { padding-top: 20px; }
        }
        @media (max-width: 620px) {
          .shop-page { width: calc(100% - 24px); padding-bottom: 60px; }
          .shop-crumb { margin-bottom: 24px; }
          .shop-hero { padding-bottom: 20px; }
          .shop-hero p { line-height: 1.5; }
          .product-grid { grid-template-columns: repeat(2, minmax(0,1fr)); gap: 26px 8px; }
        }
      `}</style>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <ShopContent />
    </Suspense>
  );
}
