"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { useStore } from "@/components/StoreProvider";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function Toast() {
  const { toast, dismissToast } = useStore();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismissToast, 3600);
    return () => window.clearTimeout(timer);
  }, [dismissToast, toast]);

  if (!toast) return null;

  const Icon = icons[toast.tone];

  return (
    <div
      className={`toast toast-${toast.tone}`}
      role={toast.tone === "error" ? "alert" : "status"}
      aria-live={toast.tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <Icon className="toast-icon" aria-hidden="true" size={20} />
      <p>{toast.message}</p>
      <button
        className="icon-button toast-close"
        type="button"
        onClick={dismissToast}
        aria-label="Dismiss notification"
      >
        <X aria-hidden="true" size={17} />
      </button>
      <span className="toast-timer" aria-hidden="true" />
    </div>
  );
}

export default Toast;
