"use client";

import { motion } from "framer-motion";
import { Boxes, Minus, Plus, TriangleAlert, Warehouse } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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
import type { AdminProduct } from "@/lib/admin/types";

export default function InventoryPage() {
  const { products, setStock, notify } = useAdminStore();
  const [view, setView] = useState("all");

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
            const units = product.stock[size] ?? 0;
            return (
              <span
                key={size}
                className="a-chip"
                style={{
                  gap: 4,
                  padding: "0 6px 0 9px",
                  borderColor: units === 0 ? "#f0c3bb" : units <= 4 ? "#f0dca8" : "var(--line)",
                  background: units === 0 ? "#fdeeeb" : "var(--white)",
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
                  onClick={() => setStock(product.id, size, units - 1)}
                >
                  <Minus size={11} aria-hidden="true" />
                </button>
                <strong className="a-num" style={{ minWidth: 18, textAlign: "center", fontSize: "0.74rem" }}>
                  {units}
                </strong>
                <button
                  type="button"
                  className="a-row-action"
                  style={{ opacity: 1, width: 22, height: 22 }}
                  aria-label={`Add one ${size} to ${product.name}`}
                  onClick={() => setStock(product.id, size, units + 1)}
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
      sortValue: (product) => totalStock(product),
      render: (product) => <StockBadge units={totalStock(product)} threshold={LOW_STOCK_THRESHOLD} />,
    },
    {
      id: "value",
      header: "Stock value",
      align: "right",
      sortValue: (product) => totalStock(product) * product.costPrice,
      render: (product) => <span>{formatINR(totalStock(product) * product.costPrice)}</span>,
    },
  ];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Catalogue"
        title="Inventory"
        description={`Adjust units per size without leaving the list. Anything at or below ${LOW_STOCK_THRESHOLD} units is flagged as low.`}
        actions={
          <Button
            variant="outline"
            onClick={() => notify("Stock count started", "info", "A physical count sheet would be generated here.")}
          >
            Start stock count
          </Button>
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
        <Badge tone="quiet">Tip</Badge>
        Setting a size to zero also marks it sold out on the storefront size picker.
      </p>
    </motion.div>
  );
}
