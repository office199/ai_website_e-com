'use client';

import { useEffect } from 'react';

export const formatMoney = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatCompactMoney = (value) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1000) {
    return `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}`;
  }
  return formatMoney(amount);
};
export const formatDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
export const formatDay = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date(value));
export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function AdminPageHead({ eyebrow, title, description, children }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6f7280]">{eyebrow}</p> : null}
        <h1 className="font-geist text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#1b1b1d] md:text-[30px] md:leading-[38px] md:tracking-[-0.02em]">{title}</h1>
        {description ? <p className="mt-1 text-[14px] leading-5 text-[#45464d]">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
    </div>
  );
}

export function ActionButton({ children, tone = 'secondary', className = '', ...props }) {
  const tones = {
    primary: 'bg-[#0058be] text-white hover:opacity-95',
    secondary: 'border border-[#c6c6cd] bg-white text-[#1b1b1d] hover:bg-[#f6f3f5]',
    subtle: 'bg-[#eae7e9] text-[#1b1b1d] hover:bg-[#dcd9db]',
    danger: 'bg-[#ba1a1a] text-white hover:opacity-95',
  };

  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-geist text-[12px] font-semibold uppercase tracking-[0.05em] transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        tones[tone] || tones.secondary,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SurfaceCard({ children, className = '' }) {
  return <div className={cx('rounded-xl border border-[#c6c6cd] bg-white', className)}>{children}</div>;
}

export function StatCard({ icon, iconTone = 'secondary', label, value, badge, spark }) {
  const toneStyles = {
    secondary: 'bg-[#0058be]/10 text-[#0058be]',
    primary: 'bg-[#131b2e]/10 text-[#131b2e]',
    info: 'bg-[#004395]/10 text-[#004395]',
    neutral: 'bg-[#191c1e]/10 text-[#444749]',
    success: 'bg-emerald-500/10 text-emerald-700',
    warning: 'bg-amber-500/10 text-amber-700',
    danger: 'bg-red-500/10 text-red-700',
  };

  return (
    <SurfaceCard className="p-4 transition-shadow hover:shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={cx('rounded-lg p-2', toneStyles[iconTone] || toneStyles.secondary)}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        {badge || null}
      </div>
      <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6f7280]">{label}</p>
      <h3 className="font-geist mt-1 text-[28px] font-semibold leading-9 tracking-[-0.02em] text-[#1b1b1d]">{value}</h3>
      {spark ? <div className="mt-4 h-12">{spark}</div> : null}
    </SurfaceCard>
  );
}

export function TrendBadge({ value, direction = 'up', label }) {
  const palette = direction === 'down'
    ? 'bg-red-50 text-red-700'
    : direction === 'warn'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-emerald-50 text-emerald-700';
  const icon = direction === 'down' ? 'trending_down' : 'trending_up';
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-1 font-geist text-[11px] font-semibold', palette)}>
      <span className="material-symbols-outlined text-[12px]">{icon}</span>
      {label || value}
    </span>
  );
}

export function TableWrap({ children, className = '' }) {
  return <div className={cx('overflow-x-auto admin-scrollbar', className)}>{children}</div>;
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#1b1b1d]/40 p-4 sm:p-8" onClick={onClose}>
      <div
        className={cx('admin-soft-shadow mt-10 w-full rounded-2xl border border-[#c6c6cd] bg-white p-6', wide ? 'max-w-4xl' : 'max-w-2xl')}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-geist text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#1b1b1d]">{title}</h2>
          <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#f6f3f5]" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, style }) {
  return (
    <label className="flex flex-col gap-2" style={style}>
      <span className="flex items-center justify-between gap-3 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">
        <span>{label}</span>
        {hint ? <em className="text-[11px] normal-case tracking-normal text-[#8c8d93]">{hint}</em> : null}
      </span>
      {children}
    </label>
  );
}

export function Pill({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'border border-[#c6c6cd] bg-[#f6f3f5] text-[#45464d]',
    success: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    warn: 'border border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border border-red-200 bg-red-50 text-red-700',
    muted: 'border border-[#d8d7dd] bg-[#f0edef] text-[#76777d]',
    admin: 'border border-[#d8e2ff] bg-[#d8e2ff] text-[#004395]',
    info: 'border border-sky-200 bg-sky-50 text-sky-700',
  };

  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 font-geist text-[11px] font-semibold uppercase tracking-[0.06em]', tones[tone] || tones.neutral)}>{children}</span>;
}

export function Stars({ value = 0, onChange, size = 16 }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-[#0058be]" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          className={cx('leading-none text-[#c6c6cd]', star <= rounded && 'text-[#0058be]', !onChange && 'cursor-default')}
          style={{ fontSize: `${size}px` }}
          onClick={onChange ? () => onChange(star) : undefined}
          disabled={!onChange}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export function EmptyState({ icon = 'dashboard', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-[#f0edef] p-4 text-[#76777d]">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <h3 className="font-geist text-[20px] font-semibold text-[#1b1b1d]">{title}</h3>
      {message ? <p className="mt-2 max-w-md text-[14px] leading-5 text-[#45464d]">{message}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function RowSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center px-6 py-16 text-center">
      <div>
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#d8d7dd] border-t-[#0058be]" />
        <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#76777d]">{label}</p>
      </div>
    </div>
  );
}

export function PageError({ message }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{message}</div>;
}

export function MiniBar({ value, tone = 'secondary' }) {
  const tones = {
    secondary: 'bg-[#0058be]',
    info: 'bg-[#2170e4]',
    neutral: 'bg-[#7c839b]',
    muted: 'bg-[#c6c6cd]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#eae7e9]">
      <div className={cx('h-full rounded-full', tones[tone] || tones.secondary)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
