"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";

import { formatMoneyCompact, formatNumber } from "@/lib/admin/format";

export type AreaPoint = { label: string; value: number };

/**
 * Revenue/traffic line with a soft fill. Drawn by hand rather than pulled from a chart
 * library so the curve, grid and type match the storefront's visual language exactly.
 */
export function AreaChart({
  data,
  height = 230,
  accent = "var(--red)",
  money = true,
  labelEvery,
}: {
  data: AreaPoint[];
  height?: number;
  accent?: string;
  money?: boolean;
  labelEvery?: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const width = 720;
  const padding = { top: 18, right: 12, bottom: 26, left: 46 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((point) => point.value), 1);
  const niceMax = Math.ceil(max / 5000) * 5000 || max;

  const x = (index: number) =>
    padding.left + (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
  const y = (value: number) => padding.top + innerHeight - (value / niceMax) * innerHeight;

  const line = data.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${padding.top + innerHeight} L${x(0)},${padding.top + innerHeight} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const step = labelEvery ?? Math.max(1, Math.round(data.length / 7));
  const format = (value: number) => (money ? formatMoneyCompact(value) : formatNumber(value));

  // Label every `step`-th point plus the last one — unless the last would collide with
  // the previous label, which is what made "11 Sept" and "12 Sept" overlap.
  const labelled = new Set<number>();
  for (let index = 0; index < data.length; index += step) labelled.add(index);
  const lastLabelled = Math.max(...labelled);
  if (data.length - 1 - lastLabelled >= step / 2) labelled.add(data.length - 1);
  else {
    labelled.delete(lastLabelled);
    labelled.add(data.length - 1);
  }

  return (
    <div className="a-chart" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue over time">
        <defs>
          <linearGradient id={`grad-${gradientId}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.26" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="a-chart__grid">
          {gridLines.map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + innerHeight * ratio}
              y2={padding.top + innerHeight * ratio}
            />
          ))}
        </g>

        <g className="a-chart__axis">
          {gridLines.map((ratio) => (
            <text key={ratio} x={padding.left - 9} y={padding.top + innerHeight * ratio + 3} textAnchor="end">
              {format(niceMax * (1 - ratio))}
            </text>
          ))}
          {data.map((point, index) =>
            labelled.has(index) ? (
              <text
                key={point.label}
                x={x(index)}
                y={height - 6}
                textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
              >
                {point.label}
              </text>
            ) : null,
          )}
        </g>

        <motion.path
          d={area}
          fill={`url(#grad-${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={accent}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.05, ease: [0.2, 0.7, 0, 1] }}
        />

        {hover !== null ? (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={padding.top}
              y2={padding.top + innerHeight}
              stroke="var(--ink)"
              strokeDasharray="3 3"
              strokeOpacity="0.35"
            />
            <circle cx={x(hover)} cy={y(data[hover].value)} r={5} fill="var(--white)" stroke={accent} strokeWidth={2.5} />
          </g>
        ) : null}

        {data.map((point, index) => (
          <rect
            key={point.label}
            x={x(index) - innerWidth / data.length / 2}
            y={padding.top}
            width={innerWidth / data.length}
            height={innerHeight}
            fill="transparent"
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {hover !== null ? (
        <div
          className="a-chart-tip"
          style={{
            left: `${(x(hover) / width) * 100}%`,
            top: `${(y(data[hover].value) / height) * 100}%`,
          }}
        >
          {data[hover].label} · {format(data[hover].value)}
        </div>
      ) : null}
    </div>
  );
}
