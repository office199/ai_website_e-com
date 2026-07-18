'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

/**
 * A parallax image panel. The background layer is slightly over-scaled and
 * translated on the Y axis as the element travels through the viewport, while
 * foreground `children` (labels, badges) stay pinned. Falls back to a static
 * cover image when the user prefers reduced motion.
 */
export default function Parallax({ className = '', backgroundImage, speed = 18, children, style, ...rest }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${speed}px`, `${speed}px`]);

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden', position: 'relative', ...style }} {...rest}>
      {reduce ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            scale: 1.16,
            y,
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      {children && <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>}
    </div>
  );
}
