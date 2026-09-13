import type { ReactNode } from "react";

import type { Coupon, OrderStatus, ProductStatus, Review } from "@/lib/admin/types";

type Tone = "neutral" | "success" | "danger" | "warning" | "info" | "ink" | "yellow" | "quiet";

export function Badge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  const toneClass = tone === "neutral" ? "" : `a-badge--${tone}`;
  return <span className={`a-badge ${toneClass} ${dot ? "a-badge--dot" : ""}`.trim()}>{children}</span>;
}

const orderTone: Record<OrderStatus, Tone> = {
  pending: "warning",
  confirmed: "info",
  packed: "info",
  shipped: "ink",
  delivered: "success",
  cancelled: "danger",
  returned: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={orderTone[status]} dot>
      {status}
    </Badge>
  );
}

const productTone: Record<ProductStatus, Tone> = {
  active: "success",
  draft: "warning",
  archived: "quiet",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge tone={productTone[status]} dot>
      {status}
    </Badge>
  );
}

const reviewTone: Record<Review["status"], Tone> = {
  published: "success",
  pending: "warning",
  rejected: "danger",
};

export function ReviewStatusBadge({ status }: { status: Review["status"] }) {
  return (
    <Badge tone={reviewTone[status]} dot>
      {status}
    </Badge>
  );
}

const couponTone: Record<Coupon["status"], Tone> = {
  active: "success",
  scheduled: "info",
  expired: "quiet",
  paused: "warning",
};

export function CouponStatusBadge({ status }: { status: Coupon["status"] }) {
  return (
    <Badge tone={couponTone[status]} dot>
      {status}
    </Badge>
  );
}

export function StockBadge({ units, threshold = 12 }: { units: number; threshold?: number }) {
  if (units <= 0) return <Badge tone="danger" dot>Out of stock</Badge>;
  if (units <= threshold) return <Badge tone="warning" dot>{units} left</Badge>;
  return <Badge tone="quiet">{units} in stock</Badge>;
}
