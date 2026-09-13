"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { riseVariants } from "@/lib/admin/motion";

export function Card({
  title,
  description,
  actions,
  footer,
  flush = false,
  className = "",
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  flush?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section className={`a-card ${className}`.trim()} variants={riseVariants}>
      {title ? (
        <header className="a-card__head">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="a-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={`a-card__body ${flush ? "a-card__body--flush" : ""}`.trim()}>{children}</div>
      {footer ? <footer className="a-card__foot">{footer}</footer> : null}
    </motion.section>
  );
}
