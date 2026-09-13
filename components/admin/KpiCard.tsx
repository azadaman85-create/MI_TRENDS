"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { formatPercent } from "@/lib/admin/format";
import { riseVariants } from "@/lib/admin/motion";

export function KpiCard({
  label,
  value,
  icon,
  change,
  caption,
  accent = "var(--ink)",
  accentSoft = "var(--surface)",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  change?: number;
  caption?: string;
  accent?: string;
  accentSoft?: string;
}) {
  const direction = change === undefined ? "flat" : change > 0.05 ? "up" : change < -0.05 ? "down" : "flat";
  const TrendIcon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  return (
    <motion.article
      className="a-kpi"
      variants={riseVariants}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      style={{ ["--accent" as string]: accent, ["--accent-soft" as string]: accentSoft }}
    >
      <div className="a-kpi__top">
        <span className="a-kpi__icon">{icon}</span>
        {change !== undefined ? (
          <span className={`a-trend a-trend--${direction}`}>
            <TrendIcon size={12} aria-hidden="true" />
            {formatPercent(change)}
          </span>
        ) : null}
      </div>
      <p className="a-kpi__value">{value}</p>
      <p className="a-kpi__label">{label}</p>
      {caption ? <p className="a-kpi__foot">{caption}</p> : null}
    </motion.article>
  );
}
