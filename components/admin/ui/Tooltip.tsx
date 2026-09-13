"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Tooltip used by the collapsed sidebar rail and icon-only actions. */
export function Tooltip({
  label,
  side = "right",
  children,
}: {
  label: string;
  side?: "right" | "top";
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(
      side === "right"
        ? { x: rect.right + 10, y: rect.top + rect.height / 2 }
        : { x: rect.left + rect.width / 2, y: rect.top - 8 },
    );
  };

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={show}
        onMouseLeave={() => setPosition(null)}
        onFocus={show}
        onBlur={() => setPosition(null)}
        style={{ display: "contents" }}
      >
        {children}
      </span>
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {position ? (
                <motion.span
                  className="admin-tooltip"
                  role="tooltip"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.13 }}
                  style={{
                    left: position.x,
                    top: position.y,
                    transform:
                      side === "right" ? "translateY(-50%)" : "translate(-50%, -100%)",
                  }}
                >
                  {label}
                </motion.span>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
