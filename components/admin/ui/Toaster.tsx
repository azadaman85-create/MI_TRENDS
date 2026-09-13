"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { useAdminStore } from "@/lib/admin/store";
import { spring } from "@/lib/admin/motion";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function Toaster() {
  const { toasts, dismissToast } = useAdminStore();

  return (
    <div className="a-toast-stack" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.tone];
          return (
            <motion.div
              key={toast.id}
              className={`a-toast a-toast--${toast.tone}`}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.97 }}
              transition={spring}
            >
              <span className="a-toast__icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>{toast.message}</strong>
                {toast.description ? <p>{toast.description}</p> : null}
              </div>
              <button
                className="a-toast__close"
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
