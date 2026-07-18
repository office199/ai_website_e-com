'use client';

import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Reveals its children with a soft fade + upward rise when scrolled into view.
 * Renders a semantic tag (`as`) so it can replace any block element without
 * breaking layout. Honours `prefers-reduced-motion`.
 */
export default function Reveal({
  children,
  as = 'div',
  className,
  delay = 0,
  y = 26,
  duration = 0.65,
  amount = 0.2,
  once = true,
  ...rest
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    return (
      <MotionTag className={className} {...rest}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
