"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/admin/ui/Button";
import { quick, spring } from "@/lib/admin/motion";

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  width,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
  width?: number;
}) {
  useEscape(open, onClose);
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="a-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quick}
            onClick={onClose}
          />
          <motion.div
            className="a-modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, x: "-50%", y: "-46%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.97, x: "-50%", y: "-47%" }}
            transition={spring}
            style={width ? { width: `min(${width}px, calc(100vw - 32px))` } : undefined}
          >
            <header className="a-modal__head">
              <div>
                <h3>{title}</h3>
                {description ? <p>{description}</p> : null}
              </div>
              <button className="admin-icon-button" type="button" onClick={onClose} aria-label="Close dialog">
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="a-modal__body">{children}</div>
            {footer ? <footer className="a-modal__foot">{footer}</footer> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "primary" : "ink"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ color: "var(--ink-soft)", fontSize: "0.86rem", lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "right" | "left";
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEscape(open, onClose);
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="a-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quick}
            onClick={onClose}
          />
          <motion.aside
            className={`a-drawer ${side === "left" ? "a-drawer--left" : ""}`.trim()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: side === "left" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "left" ? "-100%" : "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <header className="a-drawer__head">
              <h3 className="a-display" style={{ fontSize: "1.05rem", textTransform: "uppercase" }}>
                {title}
              </h3>
              <button className="admin-icon-button" type="button" onClick={onClose} aria-label="Close panel">
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="a-drawer__body">{children}</div>
            {footer ? <footer className="a-card__foot">{footer}</footer> : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
