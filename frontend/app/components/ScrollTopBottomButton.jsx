'use client';

import { useState, useEffect } from 'react';

export function ScrollTopBottomButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 180);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 animate-fade-in shadow-2xl">
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
        className="w-11 h-11 bg-[var(--ink)] text-white rounded-full flex items-center justify-center hover:bg-[var(--rust)] transition-all shadow-lg text-sm cursor-pointer"
        aria-label="Scroll to Top"
        title="Scroll to Top"
      >
        ▲
      </button>
      <button 
        onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })} 
        className="w-11 h-11 bg-[var(--ink)] text-white rounded-full flex items-center justify-center hover:bg-[var(--rust)] transition-all shadow-lg text-sm cursor-pointer"
        aria-label="Scroll to Bottom"
        title="Scroll to Bottom"
      >
        ▼
      </button>
    </div>
  );
}
