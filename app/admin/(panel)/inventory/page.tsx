"use client";

import { motion } from "framer-motion";
import { Boxes, Minus, Plus, RotateCcw, Save, TriangleAlert, Warehouse } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { Badge, StockBadge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { Tabs } from "@/components/admin/ui/Tabs";
import { LOW_STOCK_THRESHOLD, totalStock } from "@/lib/admin/data";
import { formatINR, formatNumber } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import { publishStockFeed, type StockFeed } from "@/lib/stock-feed";
import type { AdminProduct } from "@/lib/admin/types";

export default function InventoryPage() {
  const { products, setStock, notify } = useAdminStore();
  const [view, setView] = useState("all");

  /**
   * Edits are staged here rather than written straight through, so a count can be typed
   * in full ("12", not 1 then 2) and reviewed before it reaches the storefront.
   * Shape: productId → size → units. Only edited cells appear.
   */
  const [draft, setDraft] = useState<Record<number, Record<string, number>>>({});
  const [saving, setSaving] = useState(false);

  /** Staged value if this cell has been touched, otherwise what the store holds. */
  const unitsOf = useCallback(
    (product: AdminProduct, size: string) => draft[product.id]?.[size] ?? product.stock[size] ?? 0,
    [draft],
  );

  const stageStock = useCallback((product: AdminProduct, size: string, units: number) => {
    const next = Math.max(0, Math.floor(Number.isFinite(units) ? units : 0));
    setDraft((current) => {
      const forProduct = { ...(current[product.id] ?? {}), [size]: next };
      // Dropping back to the saved value un-stages the cell, so the dirty count stays honest.
      if (next === (product.stock[size] ?? 0)) {
        delete forProduct[size];
        if (!Object.keys(forProduct).length) {
          const rest = { ...current };
          delete rest[product.id];
          return rest;
        }
      }
      return { ...current, [product.id]: forProduct };
    });
  }, []);

  /** On-hand total including anything staged but not yet saved. */
  const stagedTotal = useCallback(
    (product: AdminProduct) => product.sizes.reduce((sum, size) => sum + unitsOf(product, size), 0),
    [unitsOf],
  );

  const dirtyCells = useMemo(
    () => Object.values(draft).reduce((sum, sizes) => sum + Object.keys(sizes).length, 0),
    [draft],
  );
  const dirtyProducts = Object.keys(draft).length;

  const discard = useCallback(() => setDraft({}), []);

  const save = useCallback(() => {
    if (!dirtyCells) return;
    setSaving(true);

    // 1. Commit every staged cell to the panel's own store.
    Object.entries(draft).forEach(([id, sizes]) => {
      Object.entries(sizes).forEach(([size, units]) => setStock(Number(id), size, units));
    });

    // 2. Publish the whole catalogue's stock so the storefront has a complete picture —
    //    publishing only the edited rows would leave every other product unknown to it.
    const feed: StockFeed = {};
    products.forEach((product) => {
      const sizes: Record<string, number> = {};
      product.sizes.forEach((size) => {
        sizes[size] = draft[product.id]?.[size] ?? product.stock[size] ?? 0;
      });
      feed[String(product.id)] = sizes;
    });
    const published = publishStockFeed(feed);

    setDraft({});
    setSaving(false);
    notify(
      "Inventory saved",
      published ? "success" : "info",
      published
        ? `${dirtyCells} size${dirtyCells === 1 ? "" : "s"} across ${dirtyProducts} product${dirtyProducts === 1 ? "" : "s"} updated. The storefront now shows these counts.`
        : "Saved to the panel, but this browser blocked storage so the storefront cannot read it.",
    );
  }, [draft, dirtyCells, dirtyProducts, notify, products, setStock]);

  const rows = useMemo(() => {
    if (view === "low")
      return products.filter((product) => {
        const units = totalStock(product);
        return units > 0 && units <= LOW_STOCK_THRESHOLD;
      });
    if (view === "out") return products.filter((product) => totalStock(product) === 0);
    return products;
  }, [products, view]);

  const stats = useMemo(() => {
    const units = products.reduce((sum, product) => sum + totalStock(product), 0);
    const value = products.reduce((sum, product) => sum + totalStock(product) * product.costPrice, 0);
    return {
      units,
      value,
      low: products.filter((product) => {
        const count = totalStock(product);
        return count > 0 && count <= LOW_STOCK_THRESHOLD;
      }).length,
      out: products.filter((product) => totalStock(product) === 0).length,
    };
  }, [products]);

  const columns: Column<AdminProduct>[] = [
    {
      id: "product",
      header: "Product",
      sortValue: (product) => product.name,
      render: (product) => (
        <div className="a-cell-product">
          <span className="a-thumb">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" loading="lazy" />
            ) : null}
          </span>
          <span className="a-cell-product__copy">
            <Link href={`/admin/products/${product.id}`} className="a-cell-product__name">
              {product.name}
            </Link>
            <span className="a-cell-product__meta">{product.sku}</span>
          </span>
        </div>
      ),
    },
    {
      id: "sizes",
      header: "Units by size",
      render: (product) => (
        <div className="a-chip-row">
          {product.sizes.map((size) => {
            const units = unitsOf(product, size);
            const edited = draft[product.id]?.[size] !== undefined;
            return (
              <span
                key={size}
                className="a-chip"
                data-edited={edited || undefined}
                style={{
                  gap: 4,
                  padding: "0 6px 0 9px",
                  borderColor: edited ? "var(--accent, #b4451f)" : units === 0 ? "#f0c3bb" : units <= 4 ? "#f0dca8" : "var(--line)",
                  background: edited ? "#fff4ec" : units === 0 ? "#fdeeeb" : "var(--white)",
                }}
              >
                <span className="a-micro" style={{ fontSize: "0.58rem" }}>
                  {size}
                </span>
                <button
                  type="button"
                  className="a-row-action"
                  style={{ opacity: 1, width: 22, height: 22 }}
                  aria-label={`Remove one ${size} from ${product.name}`}
                  onClick={() => stageStock(product, size, units - 1)}
                >
                  <Minus size={11} aria-hidden="true" />
                </button>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="a-stock-input"
                  value={units}
                  aria-label={`Units of ${size} for ${product.name}`}
                  onChange={(event) => stageStock(product, size, event.target.valueAsNumber)}
                  onFocus={(event) => event.target.select()}
                />
                <button
                  type="button"
                  className="a-row-action"
                  style={{ opacity: 1, width: 22, height: 22 }}
                  aria-label={`Add one ${size} to ${product.name}`}
                  onClick={() => stageStock(product, size, units + 1)}
                >
                  <Plus size={11} aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </div>
      ),
    },
    {
      id: "total",
      header: "On hand",
      align: "right",
      sortValue: (product) => stagedTotal(product),
      render: (product) => <StockBadge units={stagedTotal(product)} threshold={LOW_STOCK_THRESHOLD} />,
    },
    {
      id: "value",
      header: "Stock value",
      align: "right",
      sortValue: (product) => stagedTotal(product) * product.costPrice,
      render: (product) => <span>{formatINR(stagedTotal(product) * product.costPrice)}</span>,
    },
  ];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Catalogue"
        title="Inventory"
        description={`Adjust units per size without leaving the list. Anything at or below ${LOW_STOCK_THRESHOLD} units is flagged as low.`}
        actions={
          <>
            <Button variant="ghost" onClick={discard} disabled={!dirtyCells}>
              <RotateCcw size={15} aria-hidden="true" />
              Discard
            </Button>
            <Button
              variant="outline"
              onClick={() => notify("Stock count started", "info", "A physical count sheet would be generated here.")}
            >
              Start stock count
            </Button>
            <Button onClick={save} disabled={!dirtyCells} loading={saving}>
              <Save size={15} aria-hidden="true" />
              {dirtyCells ? `Save ${dirtyCells} change${dirtyCells === 1 ? "" : "s"}` : "Save changes"}
            </Button>
          </>
        }
      />

      <motion.div className="a-kpi-grid" data-count="4" variants={listVariants}>
        <KpiCard label="Units on hand" value={formatNumber(stats.units)} icon={<Boxes size={17} aria-hidden="true" />} />
        <KpiCard
          label="Stock value at cost"
          value={formatINR(stats.value)}
          icon={<Warehouse size={17} aria-hidden="true" />}
          accent="var(--green)"
          accentSoft="var(--green-soft)"
        />
        <KpiCard
          label="Low stock"
          value={formatNumber(stats.low)}
          caption={`At or below ${LOW_STOCK_THRESHOLD} units`}
          icon={<TriangleAlert size={17} aria-hidden="true" />}
          accent="#8a6100"
          accentSoft="#fff6d4"
        />
        <KpiCard
          label="Out of stock"
          value={formatNumber(stats.out)}
          icon={<TriangleAlert size={17} aria-hidden="true" />}
          accent="var(--red)"
          accentSoft="#fdeeeb"
        />
      </motion.div>

      <Card flush>
        <div style={{ padding: "0 16px" }}>
          <Tabs
            layoutId="inventory-view"
            active={view}
            onChange={setView}
            items={[
              { id: "all", label: "All products", count: products.length },
              { id: "low", label: "Low stock", count: stats.low },
              { id: "out", label: "Out of stock", count: stats.out },
            ]}
          />
        </div>

        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(product) => String(product.id)}
          pageSize={8}
          searchPlaceholder="Search inventory…"
          searchValue={(product) => `${product.name} ${product.sku} ${product.collection}`}
          initialSort={{ column: "total", direction: "asc" }}
          emptyTitle="Nothing to restock"
          emptyMessage="Every product in this view has healthy stock levels."
        />
      </Card>

      <p className="a-muted" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: "0.72rem" }}>
        <Badge tone="quiet">{dirtyCells ? "Unsaved" : "Tip"}</Badge>
        {dirtyCells
          ? `${dirtyCells} size${dirtyCells === 1 ? "" : "s"} edited but not saved yet — the storefront still shows the old counts.`
          : "Edits are staged until you save. Setting a size to zero marks it sold out on the storefront size picker."}
      </p>
    </motion.div>
  );
}
