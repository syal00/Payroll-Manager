import type { Transition, Variants } from "framer-motion";

/** Premium SaaS easing — smooth, not bouncy */
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const duration = {
  fast: 0.4,
  base: 0.55,
  slow: 0.75,
} as const;

export const transition: Transition = {
  duration: duration.base,
  ease: easeOut,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: easeOut } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easeOut },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.slow, ease: easeOut },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easeOut },
  },
};

export const hoverLift = {
  rest: { y: 0, boxShadow: "var(--shadow-card)" },
  hover: {
    y: -4,
    transition: { duration: 0.25, ease: easeOut },
  },
};

export const navbarReveal: Variants = {
  top: { backgroundColor: "rgba(247, 245, 240, 0.72)", boxShadow: "none" },
  scrolled: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    boxShadow: "0 1px 0 rgba(27, 37, 48, 0.06), 0 8px 24px rgba(27, 37, 48, 0.06)",
  },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 8,
    transition: { duration: 0.25 },
  },
};

/** Use with motion components when reduced motion is preferred */
export const reducedMotionVariants = (variants: Variants): Variants => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
});
