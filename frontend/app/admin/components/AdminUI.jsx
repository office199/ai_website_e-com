'use client';

import { useEffect } from 'react';

// Reusable building blocks shared across the admin console pages.

export function AdminPageHead({ eyebrow, title, description, children }) {
  return (
    <header className="admin-page-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="admin-page-sub">{description}</p>}
      </div>
      {children && <div className="admin-actions">{children}</div>}
    </header>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="admin-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className={`admin-modal-card${wide ? ' wide' : ''}`} onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-top">
          <h2>{title}</h2>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, style }) {
  return (
    <label className="admin-field" style={style}>
      <span className="admin-field-label">{label}{hint && <em>{hint}</em>}</span>
      {children}
    </label>
  );
}

export function Pill({ tone = 'neutral', children }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function Stars({ value = 0, onChange, size = 16 }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" style={{ fontSize: `${size}px` }} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          className={star <= rounded ? 'on' : ''}
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

export function EmptyState({ icon = '◦', title, message, action }) {
  return (
    <div className="admin-empty">
      <span>{icon}</span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function RowSpinner({ label = 'Loading…' }) {
  return <div className="admin-loading">{label}</div>;
}

export function PageError({ message }) {
  return <div className="auth-error admin-inline-error">{message}</div>;
}
