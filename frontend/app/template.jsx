'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * Next.js `template` re-mounts on every navigation, so wrapping children here
 * gives every route a consistent entrance: a gentle fade with a slight rise.
 * This is the baseline "all pages animate" layer; individual sections add
 * their own scroll reveals on top. Reduced-motion users get an instant mount.
 */
export default function Template({ children }) {
  const reduce = useReducedMotion();
  if (reduce) return children;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
