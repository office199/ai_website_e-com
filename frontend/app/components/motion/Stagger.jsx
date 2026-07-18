'use client';

import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * Container that staggers the entrance of its <StaggerItem> children as the
 * group scrolls into view. Pair with <StaggerItem> for grids and lists.
 */
export function Stagger({ children, as = 'div', className, amount = 0.15, once = true, ...rest }) {
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
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/** A single animated child of <Stagger>. */
export function StaggerItem({ children, as = 'div', className, ...rest }) {
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
    <MotionTag className={className} variants={itemVariants} {...rest}>
      {children}
    </MotionTag>
  );
}
