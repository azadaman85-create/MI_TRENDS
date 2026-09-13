"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CornerDownLeft, Package, Search, ShoppingCart, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { formatINR } from "@/lib/admin/format";
import { quick, spring } from "@/lib/admin/motion";
import { useAdminStore } from "@/lib/admin/store";

type Result = {
  id: string;
  title: string;
  meta: string;
  href: string;
  kind: "product" | "order" | "customer";
};

const kindIcon = { product: Package, order: ShoppingCart, customer: Users };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { products, orders, customers } = useAdminStore();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const close = useCallback(() => {
    setQuery("");
    setCursor(0);
    onClose();
  }, [onClose]);

  const results = useMemo<Result[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const productHits: Result[] = products
      .filter((product) => `${product.name} ${product.sku} ${product.collection}`.toLowerCase().includes(term))
      .slice(0, 5)
      .map((product) => ({
        id: `product-${product.id}`,
        title: product.name,
        meta: `${product.sku} · ${formatINR(product.price)}`,
        href: `/admin/products/${product.id}`,
        kind: "product",
      }));

    const orderHits: Result[] = orders
      .filter((order) => `${order.id} ${order.customerName}`.toLowerCase().includes(term))
      .slice(0, 4)
      .map((order) => ({
        id: `order-${order.id}`,
        title: order.id,
        meta: `${order.customerName} · ${formatINR(order.total)}`,
        href: `/admin/orders/${order.id}`,
        kind: "order",
      }));

    const customerHits: Result[] = customers
      .filter((customer) => `${customer.name} ${customer.email}`.toLowerCase().includes(term))
      .slice(0, 4)
      .map((customer) => ({
        id: `customer-${customer.id}`,
        title: customer.name,
        meta: `${customer.email} · ${customer.orders} orders`,
        href: `/admin/customers/${customer.id}`,
        kind: "customer",
      }));

    return [...productHits, ...orderHits, ...customerHits];
  }, [query, products, orders, customers]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((current) => Math.min(current + 1, Math.max(0, results.length - 1)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((current) => Math.max(0, current - 1));
      }
      if (event.key === "Enter" && results[cursor]) {
        router.push(results[cursor].href);
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, cursor, router, close]);

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
            onClick={close}
          />
          <motion.div
            className="a-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Search the admin panel"
            initial={{ opacity: 0, scale: 0.97, x: "-50%", y: "-46%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.98, x: "-50%", y: "-48%" }}
            transition={spring}
            style={{ top: "16%", transform: "translateX(-50%)", width: "min(620px, calc(100vw - 32px))" }}
          >
            <div className="a-row" style={{ gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--line-soft)" }}>
              <Search size={17} aria-hidden="true" style={{ color: "var(--ink-mute)" }} />
              <input
                autoFocus
                className="a-input"
                value={query}
                placeholder="Search products, orders or customers…"
                aria-label="Search products, orders or customers"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCursor(0);
                }}
                style={{ border: 0, padding: 0, minHeight: 28, fontSize: "0.92rem", boxShadow: "none" }}
              />
              <button className="admin-icon-button" type="button" onClick={close} aria-label="Close search">
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {query && results.length === 0 ? (
                <p className="a-muted" style={{ padding: 28, textAlign: "center", fontSize: "0.82rem" }}>
                  No matches for “{query}”.
                </p>
              ) : null}

              {!query ? (
                <p className="a-muted" style={{ padding: 24, textAlign: "center", fontSize: "0.8rem" }}>
                  Start typing to jump to a product, order or customer.
                </p>
              ) : null}

              <ul className="a-list">
                {results.map((result, index) => {
                  const Icon = kindIcon[result.kind];
                  return (
                    <li
                      key={result.id}
                      style={{ background: index === cursor ? "var(--surface)" : undefined, cursor: "pointer" }}
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => {
                        router.push(result.href);
                        close();
                      }}
                    >
                      <span className="admin-notification__icon">
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: "block", fontSize: "0.83rem" }}>{result.title}</strong>
                        <span className="a-muted" style={{ fontSize: "0.72rem" }}>
                          {result.meta}
                        </span>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" style={{ color: "var(--ink-mute)" }} />
                    </li>
                  );
                })}
              </ul>
            </div>

            <footer className="a-modal__foot" style={{ justifyContent: "flex-start", gap: 16 }}>
              <span className="a-micro" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CornerDownLeft size={12} aria-hidden="true" /> Open
              </span>
              <span className="a-micro">↑ ↓ Navigate</span>
              <span className="a-micro">Esc Close</span>
            </footer>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
