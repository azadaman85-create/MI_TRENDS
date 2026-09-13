"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

import { quick, tapFeedback } from "@/lib/admin/motion";

type Variant = "primary" | "ink" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  iconOnly?: boolean;
  children?: ReactNode;
};

const variantClass: Record<Variant, string> = {
  primary: "",
  ink: "a-btn--ink",
  outline: "a-btn--outline",
  ghost: "a-btn--ghost",
  danger: "a-btn--danger",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  full = false,
  iconOnly = false,
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    "a-btn",
    variantClass[variant],
    size === "sm" ? "a-btn--sm" : size === "lg" ? "a-btn--lg" : "",
    full ? "a-btn--full" : "",
    iconOnly ? "a-btn--icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      type="button"
      className={classes}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { y: -2 }}
      whileTap={disabled || loading ? undefined : tapFeedback}
      transition={quick}
      {...rest}
    >
      {loading ? <span className="a-spinner" aria-hidden="true" /> : null}
      {children}
    </motion.button>
  );
}
