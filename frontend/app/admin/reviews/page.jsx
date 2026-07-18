'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminPageHead, EmptyState, Field, Modal, PageError, RowSpinner, Stars } from '../components/AdminUI';
import Reveal from '../../components/motion/Reveal';

const formatDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminReviewsPage() {
  const { authFetch } = useApp();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pending');
  const [modal, setModal] = useState(null); // null | { id }
  const [form, setForm] = useState({ rating: 5, title: '', comment: '', status: 'pending' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/admin/reviews');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to load reviews.');
      setReviews(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    all: reviews.length,
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  }), [reviews]);

  const filtered = useMemo(() => (tab === 'all' ? reviews : reviews.filter((r) => r.status === tab)), [reviews, tab]);

  const setStatus = async (review, status) => {
    try {
      const res = await authFetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to update this review.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const openEdit = (review) => {
    setForm({ rating: review.rating, title: review.title || '', comment: review.comment, status: review.status });
    setFormError('');
    setModal({ id: review.id });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const res = await authFetch(`/api/admin/reviews/${modal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to save this review.');
      setModal(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (review) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const res = await authFetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to delete this review.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <Reveal>
      <AdminPageHead eyebrow="Moderation" title="Product reviews" description="Approve, edit or remove reviews submitted by customers.">
        <button className="admin-btn ghost" onClick={load}>Refresh ↻</button>
      </AdminPageHead>

      {error && <div style={{ marginTop: '20px' }}><PageError message={error} /></div>}

      <div className="filter-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'selected' : ''} onClick={() => setTab(t.key)}>
            {t.label} <small>{counts[t.key]}</small>
          </button>
        ))}
      </div>

      <div className="admin-panel no-pad">
        {loading ? <RowSpinner /> : !filtered.length ? (
          <EmptyState icon="★" title={tab === 'pending' ? 'No reviews awaiting moderation' : 'No reviews here'} message={tab === 'pending' ? 'New customer reviews will appear here for approval.' : 'Try a different filter tab.'} />
        ) : (
          <div className="review-list">
            {filtered.map((review) => (
              <article key={review.id} className={`review-card ${review.status}`}>
                <div className="review-card-head">
                  <div>
                    <Stars value={review.rating} />
                    <strong className="review-product">{review.product?.name || 'Removed product'}</strong>
                  </div>
                  <span className={`pill ${review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'muted' : 'warn'}`}>{review.status}</span>
                </div>
                {review.title && <h4 className="review-title">“{review.title}”</h4>}
                <p className="review-comment">{review.comment}</p>
                <div className="review-meta">
                  <span>By {review.name}</span>
                  <span>{formatDate(review.createdAt)}</span>
                </div>
                <div className="review-actions">
                  {review.status !== 'approved' && <button className="admin-link edit" onClick={() => setStatus(review, 'approved')}>Approve</button>}
                  {review.status !== 'rejected' && <button className="admin-link" onClick={() => setStatus(review, 'rejected')}>Reject</button>}
                  <button className="admin-link edit" onClick={() => openEdit(review)}>Edit</button>
                  <button className="admin-link danger" onClick={() => remove(review)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      </Reveal>
      <Modal open={Boolean(modal)} title="Edit review" onClose={() => setModal(null)}>
        <form onSubmit={submit} className="admin-form">
          {formError && <div className="auth-error">{formError}</div>}
          <div className="admin-field">
            <span className="admin-field-label">Rating</span>
            <Stars value={form.rating} size={24} onChange={(value) => setForm((d) => ({ ...d, rating: value }))} />
          </div>
          <Field label="Title" hint="optional"><input className="admin-input" value={form.title} onChange={(e) => setForm((d) => ({ ...d, title: e.target.value }))} /></Field>
          <Field label="Comment"><textarea required className="admin-input" rows={4} value={form.comment} onChange={(e) => setForm((d) => ({ ...d, comment: e.target.value }))} /></Field>
          <Field label="Status">
            <select className="admin-select" value={form.status} onChange={(e) => setForm((d) => ({ ...d, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button type="button" className="admin-btn ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
