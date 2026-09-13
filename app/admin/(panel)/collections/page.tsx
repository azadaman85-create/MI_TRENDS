"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/admin/ui/Badge";
import { Card } from "@/components/admin/ui/Card";
import { formatINR, formatNumber } from "@/lib/admin/format";
import { listVariants, riseVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import { collections } from "@/lib/catalog";

export default function CollectionsPage() {
  const { products, orders } = useAdminStore();

  const rows = useMemo(
    () =>
      collections.map((collection) => {
        const items = products.filter((product) => product.collectionSlug === collection.slug);
        const ids = new Set(items.map((product) => product.id));
        const revenue = orders
          .filter((order) => order.status !== "cancelled")
          .flatMap((order) => order.lines)
          .filter((line) => ids.has(line.productId))
          .reduce((sum, line) => sum + line.price * line.quantity, 0);

        return {
          ...collection,
          products: items.length,
          active: items.filter((product) => product.status === "active").length,
          revenue,
          hero: items.find((product) => product.imageUrl)?.imageUrl,
        };
      }),
    [products, orders],
  );

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Catalogue"
        title="Collections"
        description="The eight drops the storefront is built around. Each one carries its own palette, motif and story."
      />

      <motion.div
        className="a-grid"
        variants={listVariants}
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
      >
        {rows.map((collection) => (
          <motion.article key={collection.slug} className="a-card" variants={riseVariants} whileHover={{ y: -3 }}>
            <div
              style={{
                position: "relative",
                aspectRatio: "16 / 9",
                overflow: "hidden",
                borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                background: collection.palette[0],
              }}
            >
              {collection.hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={collection.hero}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.82 }}
                  loading="lazy"
                />
              ) : null}
              <div style={{ position: "absolute", top: 11, left: 11, display: "flex", gap: 5 }}>
                {collection.palette.map((hex) => (
                  <span
                    key={hex}
                    aria-hidden="true"
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 4,
                      background: hex,
                      border: "1.5px solid rgb(255 255 255 / 0.85)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="a-card__body">
              <h3 className="a-display" style={{ fontSize: "1.05rem", textTransform: "uppercase" }}>
                {collection.name}
              </h3>
              <p className="a-muted" style={{ marginTop: 5, fontSize: "0.78rem" }}>
                {collection.tagline}
              </p>

              <dl className="a-meta-grid" style={{ marginTop: 15 }}>
                <div>
                  <dt>Products</dt>
                  <dd>
                    {formatNumber(collection.products)}{" "}
                    <span className="a-muted" style={{ fontWeight: 400, fontSize: "0.72rem" }}>
                      ({collection.active} live)
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Revenue</dt>
                  <dd>{formatINR(collection.revenue)}</dd>
                </div>
              </dl>

              <div className="a-row" style={{ marginTop: 15, gap: 8, flexWrap: "wrap" }}>
                <Badge tone="quiet">{collection.motif}</Badge>
                <Link
                  className="a-btn a-btn--outline a-btn--sm"
                  href={`/shop?collection=${collection.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowUpRight size={13} aria-hidden="true" />
                  View on shop
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>

      <Card title="Why collections matter" className="a-stack" flush>
        <p className="a-muted" style={{ padding: 19, fontSize: "0.8rem", lineHeight: 1.65 }}>
          <LayoutGrid size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px", marginRight: 7 }} />
          Every product inherits its palette and motif from its collection, which is what keeps product cards, hero art
          and the admin previews consistent. Reassign a product&apos;s collection in the product editor and its colourways
          follow automatically.
        </p>
      </Card>
    </motion.div>
  );
}
