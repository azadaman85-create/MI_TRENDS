"use client";

import { motion } from "framer-motion";

import { formatNumber } from "@/lib/admin/format";

export type BarPoint = { label: string; value: number; accent?: string };

export function BarChart({
  data,
  height = 200,
  formatValue = formatNumber,
}: {
  data: BarPoint[];
  height?: number;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className="a-chart" style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          height,
          display: "grid",
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
          gap: 10,
          alignItems: "end",
        }}
      >
        {data.map((point, index) => (
          <div key={`${point.label}-${index}`} style={{ display: "grid", gap: 7, justifyItems: "center", height: "100%", alignContent: "end" }}>
            <span className="a-num" style={{ fontSize: "0.68rem", fontWeight: 800 }}>
              {formatValue(point.value)}
            </span>
            <motion.div
              title={`${point.label}: ${formatValue(point.value)}`}
              style={{
                width: "100%",
                maxWidth: 46,
                borderRadius: "5px 5px 2px 2px",
                background: point.accent ?? "var(--ink)",
                transformOrigin: "bottom",
              }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, (point.value / max) * (height - 34))}px` }}
              transition={{ duration: 0.6, delay: 0.06 * index, ease: [0.2, 0.7, 0, 1] }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`, gap: 10 }}>
        {data.map((point, index) => (
          <span key={`${point.label}-${index}`} className="a-micro" style={{ textAlign: "center", fontSize: "0.6rem" }}>
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
