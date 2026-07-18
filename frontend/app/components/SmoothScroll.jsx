'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Wraps the app with Lenis-powered smooth scrolling.
 * - Intercepts wheel/touch input and eases the native scroll position.
 * - Handles in-page anchor links (`#section`) with an offset for the sticky header.
 * - Respects `prefers-reduced-motion` by skipping the smooth layer entirely.
 */
export default function SmoothScroll({ children }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const handleAnchorClick = (event) => {
      const link = event.target.closest('a[href*="#"]');
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      // Only intercept same-page anchors (ignore cross-route links like /#new).
      if (url.pathname !== window.location.pathname || url.search !== window.location.search) return;
      const hash = url.hash;
      if (!hash || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (target) {
        event.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      }
    };
    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return children;
}
