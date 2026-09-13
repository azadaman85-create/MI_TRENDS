"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { riseVariants } from "@/lib/admin/motion";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.header className="admin-page-head" variants={riseVariants}>
      <div>
        {eyebrow ? <p className="a-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="a-actions">{actions}</div> : null}
    </motion.header>
  );
}
