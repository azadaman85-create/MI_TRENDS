"use client";

import { motion } from "framer-motion";

export type DonutSegment = { label: string; value: number; color: string };

export function Donut({
  segments,
  size = 168,
  thickness = 20,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pre-compute each arc's start offset so nothing is mutated while rendering.
  const arcs = segments.reduce<{ segment: DonutSegment; length: number; offset: number }[]>(
    (list, segment) => {
      const previous = list[list.length - 1];
      const offset = previous ? previous.offset + previous.length : 0;
      return [...list, { segment, length: (segment.value / total) * circumference, offset }];
    },
    [],
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Share by segment">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
          {arcs.map(({ segment, length, offset }, index) => {
            const dash = `${length} ${circumference - length}`;
            const rotation = (offset / circumference) * 360 - 90;
            return (
              <motion.circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeLinecap="butt"
                transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                initial={{ opacity: 0, strokeDasharray: `0 ${circumference}` }}
                animate={{ opacity: 1, strokeDasharray: dash }}
                transition={{ duration: 0.7, delay: 0.08 * index, ease: [0.2, 0.7, 0, 1] }}
              />
            );
          })}
        </svg>
        {centerValue ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeContent: "center",
              justifyItems: "center",
              textAlign: "center",
            }}
          >
            <strong className="a-display" style={{ fontSize: "1.3rem" }}>
              {centerValue}
            </strong>
            {centerLabel ? <span className="a-micro" style={{ fontSize: "0.56rem" }}>{centerLabel}</span> : null}
          </div>
        ) : null}
      </div>

      <ul className="a-list" style={{ flex: 1, minWidth: 150 }}>
        {segments.map((segment) => (
          <li key={segment.label} style={{ padding: "7px 0", border: 0, gap: 9 }}>
            <span className="a-legend-swatch" style={{ background: segment.color }} aria-hidden="true" />
            <span style={{ flex: 1, fontSize: "0.78rem" }}>{segment.label}</span>
            <strong className="a-num" style={{ fontSize: "0.78rem" }}>
              {Math.round((segment.value / total) * 100)}%
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
