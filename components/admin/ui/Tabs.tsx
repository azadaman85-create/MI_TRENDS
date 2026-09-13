"use client";

import { motion } from "framer-motion";

export type TabItem = { id: string; label: string; count?: number };

export function Tabs({
  items,
  active,
  onChange,
  layoutId = "admin-tab-underline",
  variant = "underline",
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  layoutId?: string;
  /** "segment" is the compact pill switcher used for date ranges in page headers. */
  variant?: "underline" | "segment";
}) {
  return (
    <div className={`a-tabs ${variant === "segment" ? "a-tabs--segment" : ""}`.trim()} role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active === item.id}
          className={`a-tab ${active === item.id ? "is-active" : ""}`.trim()}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {typeof item.count === "number" ? (
            <span className="a-badge a-badge--quiet" style={{ padding: "3px 6px" }}>
              {item.count}
            </span>
          ) : null}
          {active === item.id ? (
            <motion.span
              className={variant === "segment" ? "a-tab__pill" : "a-tab__underline"}
              layoutId={layoutId}
              transition={{ duration: 0.22 }}
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}
