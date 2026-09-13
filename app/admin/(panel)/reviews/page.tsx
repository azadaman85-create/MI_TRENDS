"use client";

import { motion } from "framer-motion";
import { Check, Star, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { KpiCard } from "@/components/admin/KpiCard";
import { ReviewStatusBadge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { Tabs } from "@/components/admin/ui/Tabs";
import { formatNumber, formatRelative } from "@/lib/admin/format";
import { listVariants } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";
import type { Review } from "@/lib/admin/types";

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={13}
          aria-hidden="true"
          style={{
            fill: index < rating ? "var(--yellow)" : "transparent",
            color: index < rating ? "var(--yellow)" : "var(--line)",
          }}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { reviews, setReviewStatus, notify } = useAdminStore();
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () => (status === "all" ? reviews : reviews.filter((review) => review.status === status)),
    [reviews, status],
  );

  const stats = useMemo(() => {
    const published = reviews.filter((review) => review.status === "published");
    return {
      total: reviews.length,
      pending: reviews.filter((review) => review.status === "pending").length,
      rejected: reviews.filter((review) => review.status === "rejected").length,
      average: published.length
        ? published.reduce((sum, review) => sum + review.rating, 0) / published.length
        : 0,
    };
  }, [reviews]);

  const columns: Column<Review>[] = [
    {
      id: "review",
      header: "Review",
      sortValue: (review) => review.title,
      render: (review) => (
        <span style={{ display: "grid", gap: 5, minWidth: 220, maxWidth: 380 }}>
          <span className="a-row" style={{ gap: 8 }}>
            <Stars rating={review.rating} />
            <strong style={{ fontSize: "0.82rem" }}>{review.title}</strong>
          </span>
          <span className="a-muted" style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
            {review.body}
          </span>
        </span>
      ),
    },
    {
      id: "product",
      header: "Product",
      sortValue: (review) => review.productName,
      render: (review) => (
        <Link href={`/admin/products/${review.productId}`} className="a-cell-product__name">
          {review.productName}
        </Link>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      sortValue: (review) => review.customerName,
      render: (review) => <span className="a-cell-product__meta">{review.customerName}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (review) => review.status,
      render: (review) => <ReviewStatusBadge status={review.status} />,
    },
    {
      id: "created",
      header: "Received",
      sortValue: (review) => review.createdAt,
      render: (review) => (
        <span className="a-muted" style={{ fontSize: "0.74rem" }}>
          {formatRelative(review.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageHeader
        eyebrow="Selling"
        title="Reviews"
        description="Approve or reject what customers write before it appears on a product page."
      />

      <motion.div className="a-kpi-grid" data-count="4" variants={listVariants}>
        <KpiCard label="Total reviews" value={formatNumber(stats.total)} icon={<Star size={17} aria-hidden="true" />} />
        <KpiCard
          label="Average rating"
          value={stats.total ? stats.average.toFixed(2) : "—"}
          caption="Published reviews only"
          icon={<Star size={17} aria-hidden="true" />}
          accent="#8a6100"
          accentSoft="#fff6d4"
        />
        <KpiCard
          label="Awaiting moderation"
          value={formatNumber(stats.pending)}
          icon={<Check size={17} aria-hidden="true" />}
          accent="var(--red)"
          accentSoft="#fdeeeb"
        />
        <KpiCard
          label="Rejected"
          value={formatNumber(stats.rejected)}
          icon={<X size={17} aria-hidden="true" />}
          accent="var(--ink)"
        />
      </motion.div>

      <Card flush>
        <div style={{ padding: "0 16px" }}>
          <Tabs
            layoutId="reviews-status"
            active={status}
            onChange={setStatus}
            items={[
              { id: "all", label: "All", count: reviews.length },
              { id: "pending", label: "Pending", count: stats.pending },
              { id: "published", label: "Published", count: reviews.length - stats.pending - stats.rejected },
              { id: "rejected", label: "Rejected", count: stats.rejected },
            ]}
          />
        </div>

        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(review) => review.id}
          pageSize={8}
          selectable
          searchPlaceholder="Search reviews…"
          searchValue={(review) => `${review.title} ${review.body} ${review.productName} ${review.customerName}`}
          initialSort={{ column: "created", direction: "desc" }}
          emptyTitle="No reviews here"
          emptyMessage="Nothing in this queue right now."
          bulkActions={(ids, clear) => (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  ids.forEach((id) => setReviewStatus(id, "published"));
                  notify(`${ids.length} reviews published`);
                  clear();
                }}
              >
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  ids.forEach((id) => setReviewStatus(id, "rejected"));
                  notify(`${ids.length} reviews rejected`, "info");
                  clear();
                }}
              >
                Reject
              </Button>
            </>
          )}
          rowActions={(review) => (
            <>
              <button
                className="a-row-action"
                type="button"
                title="Publish"
                aria-label={`Publish review ${review.id}`}
                onClick={() => {
                  setReviewStatus(review.id, "published");
                  notify("Review published");
                }}
              >
                <Check size={15} aria-hidden="true" />
              </button>
              <button
                className="a-row-action a-row-action--danger"
                type="button"
                title="Reject"
                aria-label={`Reject review ${review.id}`}
                onClick={() => {
                  setReviewStatus(review.id, "rejected");
                  notify("Review rejected", "info");
                }}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </>
          )}
        />
      </Card>
    </motion.div>
  );
}
