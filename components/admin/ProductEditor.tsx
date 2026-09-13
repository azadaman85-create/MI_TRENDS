"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Eye, Save, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { ProductImageUploader } from "@/components/admin/ProductImageUploader";
import { Badge, ProductStatusBadge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Input, Select, Switch, Textarea } from "@/components/admin/ui/Field";
import { ConfirmDialog } from "@/components/admin/ui/Modal";
import { collections } from "@/lib/catalog";
import { formatINR } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import type { AdminProduct } from "@/lib/admin/types";

const sizeSets: Record<string, string[]> = {
  apparel: ["XS", "S", "M", "L", "XL", "XXL"],
  footwear: ["6", "7", "8", "9", "10", "11"],
  onesize: ["One size"],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductEditor({ product, mode }: { product: AdminProduct; mode: "edit" | "create" }) {
  const router = useRouter();
  const { saveProduct, createProduct, deleteProducts, duplicateProduct, notify, products } = useAdminStore();

  const [draft, setDraft] = useState<AdminProduct>(product);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patch = (changes: Partial<AdminProduct>) => setDraft((current) => ({ ...current, ...changes }));

  const margin = useMemo(() => {
    if (!draft.price) return 0;
    return ((draft.price - draft.costPrice) / draft.price) * 100;
  }, [draft.price, draft.costPrice]);

  const totalUnits = Object.values(draft.stock).reduce((sum, units) => sum + units, 0);

  const validate = () => {
    const next: Record<string, string> = {};
    if (draft.name.trim().length < 3) next.name = "Give the product a name customers will recognise.";
    if (!draft.sku.trim()) next.sku = "Every product needs a SKU.";
    if (draft.mrp <= 0) next.mrp = "MRP must be more than zero.";
    if (draft.price <= 0) next.price = "Selling price must be more than zero.";
    if (draft.price > draft.mrp) next.price = "Selling price cannot be higher than MRP.";
    if (products.some((item) => item.sku === draft.sku && item.id !== draft.id)) next.sku = "That SKU is already in use.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (status?: AdminProduct["status"]) => {
    const candidate = status ? { ...draft, status } : draft;
    setDraft(candidate);
    if (!validate()) {
      notify("Check the highlighted fields", "error", "Some required values are missing or invalid.");
      return;
    }

    setSaving(true);
    // Give the save state a beat so the interaction reads as deliberate.
    await new Promise((resolve) => setTimeout(resolve, 420));

    const finished: AdminProduct = {
      ...candidate,
      slug: candidate.slug || slugify(candidate.name),
      discount: candidate.mrp > 0 ? Math.round(((candidate.mrp - candidate.price) / candidate.mrp) * 100) : 0,
      outOfStock: Object.entries(candidate.stock)
        .filter(([, units]) => units <= 0)
        .map(([size]) => size),
      updatedAt: new Date().toISOString(),
    };

    if (mode === "create") {
      createProduct(finished);
      notify("Product created", "success", `${finished.name} is now in the catalogue.`);
      router.push(`/admin/products/${finished.id}`);
    } else {
      saveProduct(finished);
      notify("Changes saved", "success", `${finished.name} updated.`);
    }
    setSaving(false);
  };

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow={mode === "create" ? "New product" : `Editing · ${draft.sku}`}
        title={draft.name || "Untitled product"}
        description={
          mode === "create"
            ? "Fill in the details, add images and publish when the drop is ready."
            : "Update pricing, stock and storefront copy. Changes apply the moment you save."
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push("/admin/products")}>
              <ArrowLeft size={15} aria-hidden="true" />
              Back
            </Button>
            {mode === "edit" ? (
              <Button variant="outline" onClick={() => router.push(`/product/${draft.slug}`)}>
                <Eye size={15} aria-hidden="true" />
                Preview
              </Button>
            ) : null}
            <Button loading={saving} onClick={() => handleSave()}>
              <Save size={15} aria-hidden="true" />
              {mode === "create" ? "Create product" : "Save changes"}
            </Button>
          </>
        }
      />

      <div className="a-split">
        <div className="a-stack">
          <Card title="Product information" description="How the piece is named and described on the storefront.">
            <div className="a-stack">
              <Input
                label="Product name"
                value={draft.name}
                error={errors.name}
                placeholder="Drop 01 Oversized Tee"
                onChange={(event) => patch({ name: event.target.value })}
              />

              <div className="a-grid a-grid--2">
                <Input
                  label="URL slug"
                  value={draft.slug}
                  hint={`mitrends.in/product/${draft.slug || slugify(draft.name) || "…"}`}
                  onChange={(event) => patch({ slug: slugify(event.target.value) })}
                />
                <Input
                  label="SKU"
                  value={draft.sku}
                  error={errors.sku}
                  onChange={(event) => patch({ sku: event.target.value.toUpperCase() })}
                />
              </div>

              <Textarea
                label="Description"
                value={draft.description}
                rows={5}
                hint="Two or three sentences. Lead with the fabric and the fit."
                onChange={(event) => patch({ description: event.target.value })}
              />

              <div className="a-grid a-grid--2">
                <Input label="Fit" value={draft.fit} onChange={(event) => patch({ fit: event.target.value })} />
                <Input label="Fabric" value={draft.fabric} onChange={(event) => patch({ fabric: event.target.value })} />
              </div>
            </div>
          </Card>

          <Card title="Images" description="Drag to reorder. The first image is the storefront hero.">
            <ProductImageUploader images={draft.images} onChange={(images) => patch({ images, imageUrl: images[0], backImageUrl: images[1] })} />
          </Card>

          <Card title="Pricing" description="MRP, selling price and the margin this product earns.">
            <div className="a-grid a-grid--3">
              <Input
                label="MRP"
                type="number"
                prefix="₹"
                value={draft.mrp}
                error={errors.mrp}
                onChange={(event) => patch({ mrp: Number(event.target.value) })}
              />
              <Input
                label="Selling price"
                type="number"
                prefix="₹"
                value={draft.price}
                error={errors.price}
                onChange={(event) => patch({ price: Number(event.target.value) })}
              />
              <Input
                label="Cost price"
                type="number"
                prefix="₹"
                value={draft.costPrice}
                hint="Used for margin only — never shown publicly."
                onChange={(event) => patch({ costPrice: Number(event.target.value) })}
              />
            </div>

            <div className="a-row" style={{ marginTop: 16, gap: 10, flexWrap: "wrap" }}>
              <Badge tone={draft.price < draft.mrp ? "yellow" : "quiet"}>
                {draft.mrp > 0 ? Math.round(((draft.mrp - draft.price) / draft.mrp) * 100) : 0}% off
              </Badge>
              <Badge tone={margin > 45 ? "success" : margin > 25 ? "warning" : "danger"}>
                {margin.toFixed(0)}% margin
              </Badge>
              <span className="a-muted" style={{ fontSize: "0.76rem" }}>
                {formatINR(draft.price - draft.costPrice)} gross per unit
              </span>
            </div>
          </Card>

          <Card title="Variants & inventory" description="Colourways, sizes and units on hand.">
            <div className="a-stack">
              <div>
                <span className="a-label">Colourways</span>
                <div className="a-chip-row" style={{ marginTop: 8 }}>
                  {draft.colors.map((color) => (
                    <span className="a-chip" key={color.hex}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: color.hex,
                          border: "1px solid rgb(0 0 0 / 0.18)",
                        }}
                      />
                      {color.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="a-label">Size set</span>
                <div className="a-chip-row" style={{ marginTop: 8 }}>
                  {Object.entries(sizeSets).map(([key, sizes]) => (
                    <button
                      key={key}
                      type="button"
                      className={`a-chip ${sizes.join() === draft.sizes.join() ? "is-active" : ""}`.trim()}
                      onClick={() =>
                        patch({
                          sizes,
                          stock: Object.fromEntries(sizes.map((size) => [size, draft.stock[size] ?? 0])),
                        })
                      }
                    >
                      {key === "apparel" ? "Apparel XS–XXL" : key === "footwear" ? "Footwear 6–11" : "One size"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="a-row a-row--between" style={{ marginBottom: 8 }}>
                  <span className="a-label">Units by size</span>
                  <span className="a-micro">{totalUnits} total</span>
                </div>
                <div className="a-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))", gap: 10 }}>
                  {draft.sizes.map((size) => (
                    <label key={size} className="a-field">
                      <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {size}
                      </span>
                      <input
                        className="a-input"
                        type="number"
                        min={0}
                        value={draft.stock[size] ?? 0}
                        onChange={(event) =>
                          patch({ stock: { ...draft.stock, [size]: Math.max(0, Number(event.target.value)) } })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Search engine listing" description="How this product appears on Google and in shared links.">
            <div className="a-stack">
              <Input
                label="SEO title"
                value={draft.seoTitle}
                hint={`${draft.seoTitle.length}/60 characters`}
                onChange={(event) => patch({ seoTitle: event.target.value })}
              />
              <Textarea
                label="Meta description"
                rows={3}
                value={draft.seoDescription}
                hint={`${draft.seoDescription.length}/160 characters`}
                onChange={(event) => patch({ seoDescription: event.target.value })}
              />
              <div
                style={{
                  padding: 15,
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  background: "#fbfaf7",
                }}
              >
                <span className="a-muted" style={{ fontSize: "0.7rem" }}>
                  mitrends.in › product › {draft.slug || "…"}
                </span>
                <p style={{ margin: "4px 0 3px", color: "#1a0dab", fontSize: "0.95rem" }}>{draft.seoTitle || draft.name}</p>
                <p className="a-muted" style={{ fontSize: "0.76rem" }}>
                  {draft.seoDescription || "Add a meta description so search results read well."}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="a-stack a-sticky">
          <Card title="Publishing">
            <div className="a-stack">
              <div className="a-row a-row--between">
                <span className="a-label">Current status</span>
                <ProductStatusBadge status={draft.status} />
              </div>

              <Select
                label="Status"
                value={draft.status}
                onChange={(event) => patch({ status: event.target.value as AdminProduct["status"] })}
                options={[
                  { value: "active", label: "Active — visible on the storefront" },
                  { value: "draft", label: "Draft — hidden until published" },
                  { value: "archived", label: "Archived — removed from the shop" },
                ]}
              />

              <Switch
                checked={draft.featured}
                onChange={(featured) => patch({ featured })}
                label="Feature on the homepage rail"
              />

              <div className="a-row" style={{ gap: 8 }}>
                <Button full loading={saving} onClick={() => handleSave("active")}>
                  Publish
                </Button>
                <Button variant="outline" full onClick={() => handleSave("draft")}>
                  Save draft
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Organisation">
            <div className="a-stack">
              <Select
                label="Category"
                value={draft.category}
                onChange={(event) => patch({ category: event.target.value as AdminProduct["category"] })}
                options={[
                  { value: "men", label: "Men" },
                  { value: "women", label: "Women" },
                  { value: "unisex", label: "Unisex" },
                ]}
              />
              <Select
                label="Collection"
                value={draft.collectionSlug}
                onChange={(event) => {
                  const match = collections.find((entry) => entry.slug === event.target.value);
                  if (match) patch({ collection: match.name, collectionSlug: match.slug, palette: [...match.palette] });
                }}
                options={collections.map((entry) => ({ value: entry.slug, label: entry.name }))}
              />
              <Input label="Product type" value={draft.type} onChange={(event) => patch({ type: event.target.value })} />
              <div>
                <span className="a-label">Tags</span>
                <div className="a-chip-row" style={{ marginTop: 8 }}>
                  {(["new", "bestseller", "sale"] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`a-chip ${draft.tags.includes(tag) ? "is-active" : ""}`.trim()}
                      onClick={() =>
                        patch({
                          tags: draft.tags.includes(tag)
                            ? draft.tags.filter((entry) => entry !== tag)
                            : [...draft.tags, tag],
                        })
                      }
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Storefront preview">
            <div style={{ display: "grid", gap: 11 }}>
              <div
                style={{
                  aspectRatio: "3 / 4",
                  overflow: "hidden",
                  borderRadius: "var(--radius)",
                  background: "var(--surface-2)",
                }}
              >
                {draft.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : null}
              </div>
              <div>
                <strong style={{ fontSize: "0.86rem" }}>{draft.name || "Untitled product"}</strong>
                <p className="a-muted" style={{ fontSize: "0.72rem" }}>
                  {draft.collection}
                </p>
                <p style={{ marginTop: 5, fontSize: "0.9rem", fontWeight: 800 }}>
                  {formatINR(draft.price)}{" "}
                  {draft.price < draft.mrp ? (
                    <span className="a-muted" style={{ fontWeight: 400, textDecoration: "line-through", fontSize: "0.78rem" }}>
                      {formatINR(draft.mrp)}
                    </span>
                  ) : null}
                </p>
              </div>
              {mode === "edit" ? (
                <Link
                  className="a-btn a-btn--outline a-btn--sm"
                  href={`/product/${draft.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  Open on storefront
                </Link>
              ) : null}
            </div>
          </Card>

          {mode === "edit" ? (
            <Card title="Danger zone">
              <div className="a-stack">
                <Button
                  variant="outline"
                  full
                  onClick={() => {
                    const copy = duplicateProduct(draft.id);
                    if (copy) {
                      notify("Product duplicated", "success", `${copy.name} saved as a draft.`);
                      router.push(`/admin/products/${copy.id}`);
                    }
                  }}
                >
                  Duplicate product
                </Button>
                <Button variant="danger" full onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} aria-hidden="true" />
                  Delete product
                </Button>
                <p className="a-muted" style={{ display: "flex", gap: 7, fontSize: "0.72rem" }}>
                  <TriangleAlert size={13} aria-hidden="true" style={{ flex: "none", marginTop: 2 }} />
                  Deleting removes the product from the catalogue and any live collection rails.
                </p>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete product"
        message={`${draft.name} will be removed from the catalogue. This cannot be undone.`}
        confirmLabel="Delete product"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteProducts([draft.id]);
          notify("Product deleted", "info");
          router.push("/admin/products");
        }}
      />
    </motion.div>
  );
}
