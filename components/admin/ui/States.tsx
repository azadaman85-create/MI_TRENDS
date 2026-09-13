"use client";

import { motion } from "framer-motion";
import { AlertTriangle, PackageSearch, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/admin/ui/Button";
import { smooth } from "@/lib/admin/motion";

export function Skeleton({ width = "100%", height = 14, radius = 4 }: { width?: string | number; height?: number; radius?: number }) {
  return <span className="a-skeleton" style={{ display: "block", width, height, borderRadius: radius }} />;
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{ display: "grid", gridTemplateColumns: `56px repeat(${columns - 1}, 1fr)`, gap: 14, alignItems: "center" }}
        >
          <Skeleton width={44} height={56} radius={4} />
          {Array.from({ length: columns - 1 }).map((__, cellIndex) => (
            <Skeleton key={cellIndex} height={12} width={cellIndex === 0 ? "78%" : "52%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ height = 120 }: { height?: number }) {
  return (
    <div className="a-card" style={{ padding: 18 }}>
      <Skeleton width="42%" height={12} />
      <div style={{ height: 12 }} />
      <Skeleton height={height} radius={8} />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <motion.div className="a-empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={smooth}>
      <span className="a-empty__icon">{icon ?? <PackageSearch size={24} aria-hidden="true" />}</span>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </motion.div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="a-error" role="alert">
      <span className="a-error__icon">
        <AlertTriangle size={23} aria-hidden="true" />
      </span>
      <h3 className="a-display" style={{ fontSize: "1.05rem", textTransform: "uppercase" }}>
        {title}
      </h3>
      <p className="a-muted" style={{ maxWidth: "46ch", fontSize: "0.8rem" }}>
        {message}
      </p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} style={{ marginTop: 12 }}>
          <RotateCcw size={14} aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
