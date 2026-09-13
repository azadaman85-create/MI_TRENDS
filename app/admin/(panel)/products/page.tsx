"use client";

import { motion } from "framer-motion";
import { Copy, ExternalLink, Package, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, ProductStatusBadge, StockBadge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { ConfirmDialog } from "@/components/admin/ui/Modal";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { Tabs } from "@/components/admin/ui/Tabs";
import { LOW_STOCK_THRESHOLD, totalStock } from "@/lib/admin/data";
import { formatDate, formatINR } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";

export default function ProductsPage() {
  const router = useRouter();
  const { products, notify, deleteProducts, duplicateProduct, setProductStatus } = useAdminStore();

  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [collection, setCollection] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<number[] | null>(null);

  const collectionOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.collection))).sort(),
    [products],
  );

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        if (status === "low" && totalStock(product) > LOW_STOCK_THRESHOLD) return false;
        if (status !== "all" && status !== "low" && product.status !== status) return false;
        if (category !== "all" && product.category !== category) return false;
        if (collection !== "all" && product.collection !== collection) return false;
        return true;
      }),
    [products, status, category, collection],
  );

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((product) => product.status === "active").length,
      draft: products.filter((product) => product.status === "draft").length,
      archived: products.filter((product) => product.status === "archived").length,
      low: products.filter((product) => totalStock(product) <= LOW_STOCK_THRESHOLD).length,
    }),
    [products],
  );

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
            <span className="a-cell-product__meta">
              {product.sku} · {product.collection}
            </span>
          </span>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      sortValue: (product) => product.category,
      render: (product) => (
        <span style={{ display: "grid", gap: 4 }}>
          <Badge tone="quiet">{product.category}</Badge>
          <span className="a-cell-product__meta">{product.type}</span>
        </span>
      ),
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      sortValue: (product) => product.price,
      render: (product) => (
        <span style={{ display: "grid", gap: 2, justifyItems: "end" }}>
          <strong>{formatINR(product.price)}</strong>
          {product.discount > 0 ? (
            <span className="a-cell-product__meta" style={{ textDecoration: "line-through" }}>
              {formatINR(product.mrp)}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      sortValue: (product) => totalStock(product),
      render: (product) => <StockBadge units={totalStock(product)} threshold={LOW_STOCK_THRESHOLD} />,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (product) => product.status,
      render: (product) => <ProductStatusBadge status={product.status} />,
    },
    {
      id: "updated",
      header: "Updated",
      sortValue: (product) => product.updatedAt,
      render: (product) => (
        <span className="a-muted" style={{ fontSize: "0.74rem" }}>
          {formatDate(product.updatedAt)}
        </span>
      ),
    },
  ];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Every piece in the MI TRENDS catalogue — pricing, stock and publishing status in one view."
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/admin/inventory")}>
              Manage stock
            </Button>
            <Button onClick={() => router.push("/admin/products/new")}>
              <Plus size={15} aria-hidden="true" />
              Add product
            </Button>
          </>
        }
      />

      <Card flush>
        <div style={{ padding: "0 16px" }}>
          <Tabs
            layoutId="products-status"
            active={status}
            onChange={setStatus}
            items={[
              { id: "all", label: "All", count: counts.all },
              { id: "active", label: "Active", count: counts.active },
              { id: "draft", label: "Drafts", count: counts.draft },
              { id: "archived", label: "Archived", count: counts.archived },
              { id: "low", label: "Low stock", count: counts.low },
            ]}
          />
        </div>

        <DataTable
          rows={filtered}
          columns={columns}
          getRowId={(product) => String(product.id)}
          pageSize={10}
          selectable
          searchPlaceholder="Search by name, SKU or collection…"
          searchValue={(product) => `${product.name} ${product.sku} ${product.collection} ${product.type}`}
          initialSort={{ column: "updated", direction: "desc" }}
          emptyTitle="No products found"
          emptyMessage="No product matches these filters yet. Add one to start building the drop."
          emptyActionLabel="Add product"
          onEmptyAction={() => router.push("/admin/products/new")}
          toolbar={
            <>
              <select
                className="a-select"
                style={{ width: "auto", minWidth: 150 }}
                value={category}
                aria-label="Filter by category"
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
              <select
                className="a-select"
                style={{ width: "auto", minWidth: 170 }}
                value={collection}
                aria-label="Filter by collection"
                onChange={(event) => setCollection(event.target.value)}
              >
                <option value="all">All collections</option>
                {collectionOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </>
          }
          bulkActions={(ids, clear) => (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProductStatus(ids.map(Number), "active");
                  notify(`${ids.length} products published`);
                  clear();
                }}
              >
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProductStatus(ids.map(Number), "archived");
                  notify(`${ids.length} products archived`, "info");
                  clear();
                }}
              >
                Archive
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPendingDelete(ids.map(Number))}>
                <Trash2 size={13} aria-hidden="true" />
                Delete
              </Button>
            </>
          )}
          rowActions={(product) => (
            <>
              <Link
                className="a-row-action"
                href={`/product/${product.slug}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`View ${product.name} on the storefront`}
                title="View on storefront"
              >
                <ExternalLink size={15} aria-hidden="true" />
              </Link>
              <Link className="a-row-action" href={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`} title="Edit">
                <Pencil size={15} aria-hidden="true" />
              </Link>
              <button
                className="a-row-action"
                type="button"
                title="Duplicate"
                aria-label={`Duplicate ${product.name}`}
                onClick={() => {
                  const copy = duplicateProduct(product.id);
                  if (copy) notify("Product duplicated", "success", `${copy.name} saved as a draft.`);
                }}
              >
                <Copy size={15} aria-hidden="true" />
              </button>
              <button
                className="a-row-action a-row-action--danger"
                type="button"
                title="Delete"
                aria-label={`Delete ${product.name}`}
                onClick={() => setPendingDelete([product.id])}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </>
          )}
        />
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete && pendingDelete.length > 1 ? "Delete products" : "Delete product"}
        message={
          pendingDelete && pendingDelete.length > 1
            ? `${pendingDelete.length} products will be removed from the catalogue. This cannot be undone.`
            : "This product will be removed from the catalogue. This cannot be undone."
        }
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteProducts(pendingDelete);
            notify(
              pendingDelete.length > 1 ? `${pendingDelete.length} products deleted` : "Product deleted",
              "info",
            );
          }
          setPendingDelete(null);
        }}
      />

      <p className="a-muted" style={{ marginTop: 14, fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 7 }}>
        <Package size={13} aria-hidden="true" />
        Edits are stored on this device so the demo catalogue stays intact for everyone else.
      </p>
    </motion.div>
  );
}
