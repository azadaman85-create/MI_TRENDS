import type { Transition, Variants } from "framer-motion";

/**
 * Motion presets for the admin panel. The storefront animates with short 180-200ms
 * eases and one long 620ms cubic-bezier for imagery; the admin keeps the same feel but
 * trims the distances so data-dense screens settle quickly.
 */
export const easeOut = [0.2, 0.7, 0, 1] as const;

export const spring: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };
export const quick: Transition = { duration: 0.18, ease: easeOut };
export const smooth: Transition = { duration: 0.32, ease: easeOut };

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { ...smooth, when: "beforeChildren", staggerChildren: 0.045 } },
  exit: { opacity: 0, y: -6, transition: quick },
};

export const riseVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: smooth },
};

export const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } },
};

export const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: quick },
};

export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.16, ease: easeOut } },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.12, ease: easeOut } },
};

export const shakeAnimation = {
  x: [0, -9, 8, -6, 4, 0],
  transition: { duration: 0.42, ease: "easeInOut" as const },
};

export const tapFeedback = { scale: 0.97 };
export const hoverLift = { y: -2 };
