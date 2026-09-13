"use client";

import { useEffect, useId, useRef } from "react";
import { Ruler, X } from "lucide-react";

type SizeGuideProps = {
  open: boolean;
  onClose: () => void;
  productType?: string;
};

const topRows = [
  ["XS", "36", "25", "16.5"],
  ["S", "38", "26", "17.5"],
  ["M", "40", "27", "18.5"],
  ["L", "42", "28", "19.5"],
  ["XL", "44", "29", "20.5"],
  ["XXL", "46", "30", "21.5"],
];

const bottomRows = [
  ["28", "28", "39", "39"],
  ["30", "30", "41", "40"],
  ["32", "32", "43", "41"],
  ["34", "34", "45", "42"],
  ["36", "36", "47", "43"],
  ["38", "38", "49", "44"],
];

const shoeRows = [
  ["UK 6", "25.0", "40"],
  ["UK 7", "25.7", "41"],
  ["UK 8", "26.4", "42"],
  ["UK 9", "27.1", "43"],
  ["UK 10", "27.8", "44"],
  ["UK 11", "28.5", "45"],
];

export function SizeGuide({ open, onClose, productType = "T-shirt" }: SizeGuideProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const normalized = productType.toLowerCase();
  const isShoe = normalized.includes("sneaker") || normalized.includes("shoe");
  const isBottom = ["jogger", "short", "boxer", "bottom"].some((term) => normalized.includes(term));
  const headings = isShoe
    ? ["Size", "Foot length (cm)", "EU"]
    : isBottom
      ? ["Size", "Waist", "Hip", "Outseam"]
      : ["Size", "Chest", "Length", "Shoulder"];
  const rows = isShoe ? shoeRows : isBottom ? bottomRows : topRows;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="size-guide" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="size-guide__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="size-guide__head">
          <div>
            <span className="size-guide__eyebrow"><Ruler size={15} /> Find your fit</span>
            <h2 id={titleId}>Size guide</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close size guide">
            <X size={21} />
          </button>
        </div>

        <p className="size-guide__intro">
          Measurements are in inches unless noted. Measure a similar piece you already own and
          compare it with the chart for the most reliable fit.
        </p>

        <div className="size-guide__table-wrap">
          <table>
            <thead>
              <tr>{headings.map((heading) => <th key={heading}>{heading}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="size-guide__tip">
          <strong>Between sizes?</strong>
          <span>Size up for a relaxed streetwear fit, or stay true to size for a cleaner silhouette.</span>
        </div>

        <button className="size-guide__done" type="button" onClick={onClose}>Got it</button>
      </section>

      <style jsx>{`
        .size-guide {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(12, 12, 12, .62);
          backdrop-filter: blur(4px);
          animation: fade-in .18s ease-out;
        }
        .size-guide__dialog {
          width: min(600px, 100%);
          max-height: min(760px, calc(100vh - 40px));
          overflow: auto;
          border-radius: 16px;
          background: #fff;
          color: #151515;
          padding: 28px;
          box-shadow: 0 28px 80px rgba(0,0,0,.3);
          animation: rise .24s ease-out;
        }
        .size-guide__head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
        .size-guide__head h2 { margin: 4px 0 0; font-size: clamp(28px, 6vw, 42px); letter-spacing: -.045em; line-height: 1; }
        .size-guide__eyebrow { display: inline-flex; align-items: center; gap: 7px; color: #e7482a; font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .size-guide__head button { width: 42px; height: 42px; border: 1px solid #ddd9d2; border-radius: 50%; display: grid; place-items: center; background: #fff; cursor: pointer; }
        .size-guide__head button:hover { background: #f3f1ed; }
        .size-guide__intro { color: #67635d; line-height: 1.65; margin: 22px 0; }
        .size-guide__table-wrap { overflow-x: auto; border: 1px solid #e6e2db; border-radius: 10px; }
        table { border-collapse: collapse; width: 100%; min-width: 430px; text-align: left; }
        th, td { padding: 13px 16px; border-bottom: 1px solid #ece8e2; }
        th { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; background: #f6f4f0; color: #64605a; }
        td { font-size: 14px; font-weight: 600; }
        tbody tr:last-child td { border-bottom: 0; }
        .size-guide__tip { display: grid; gap: 4px; padding: 16px; margin-top: 18px; border-radius: 10px; background: #f1efe9; font-size: 13px; line-height: 1.5; }
        .size-guide__tip span { color: #66615b; }
        .size-guide__done { width: 100%; min-height: 50px; margin-top: 18px; border: 0; border-radius: 8px; background: #171717; color: #fff; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
        :global(.size-guide__head button:focus-visible), .size-guide__done:focus-visible { outline: 3px solid #f0a16f; outline-offset: 3px; }
        @keyframes fade-in { from { opacity: 0; } }
        @keyframes rise { from { transform: translateY(16px); opacity: 0; } }
        @media (max-width: 520px) {
          .size-guide { align-items: end; padding: 0; }
          .size-guide__dialog { max-height: 88vh; border-radius: 18px 18px 0 0; padding: 22px 18px calc(22px + env(safe-area-inset-bottom)); }
        }
        @media (prefers-reduced-motion: reduce) { .size-guide, .size-guide__dialog { animation: none; } }
      `}</style>
    </div>
  );
}

export default SizeGuide;
