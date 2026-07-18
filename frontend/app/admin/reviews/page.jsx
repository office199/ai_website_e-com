'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ActionButton,
  AdminPageHead,
  EmptyState,
  Field,
  MiniBar,
  Modal,
  PageError,
  Pill,
  RowSpinner,
  Stars,
  SurfaceCard,
  TableWrap,
  formatDate,
  formatNumber,
} from '../components/AdminUI';

export default function AdminReviewsPage() {
  const { authFetch } = useApp();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '', status: 'pending' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authFetch('/api/admin/reviews');
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to load reviews.');
      setReviews(await response.json());
    } catch (loadError) {
      setError(loadError.message || 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => ({
    all: reviews.length,
    approved: reviews.filter((review) => review.status === 'approved').length,
    pending: reviews.filter((review) => review.status === 'pending').length,
    rejected: reviews.filter((review) => review.status === 'rejected').length,
  }), [reviews]);

  const filteredReviews = useMemo(() => (tab === 'all' ? reviews : reviews.filter((review) => review.status === tab)), [reviews, tab]);

  const averageRating = useMemo(() => (reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0), [reviews]);
  const sentiment = useMemo(() => {
    const total = reviews.length || 1;
    const positive = reviews.filter((review) => review.rating >= 4).length;
    const neutral = reviews.filter((review) => review.rating === 3).length;
    const negative = reviews.filter((review) => review.rating <= 2).length;
    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100),
    };
  }, [reviews]);

  const setStatus = async (review, status) => {
    try {
      const response = await authFetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to update this review.');
      await load();
    } catch (statusError) {
      setError(statusError.message || 'Unable to update this review.');
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
      const response = await authFetch(`/api/admin/reviews/${modal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to save this review.');
      setModal(null);
      await load();
    } catch (submitError) {
      setFormError(submitError.message || 'Unable to save this review.');
    } finally {
      setSaving(false);
    }
  };

  const removeReview = async (review) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const response = await authFetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to delete this review.');
      await load();
    } catch (removeError) {
      setError(removeError.message || 'Unable to delete this review.');
    }
  };

  return (
    <div>
      <AdminPageHead
        eyebrow="Moderation"
        title="Reviews Management"
        description="Manage and moderate customer feedback across your product catalog."
      >
        <ActionButton tone="secondary" type="button" onClick={load}><span className="material-symbols-outlined text-[18px]">refresh</span>Refresh</ActionButton>
      </AdminPageHead>

      {error ? <div className="mb-6"><PageError message={error} /></div> : null}

      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SurfaceCard className="p-4">
            <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Avg. Rating</span>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-geist text-[30px] font-semibold text-[#1b1b1d]">{averageRating.toFixed(1)}</span>
              <Stars value={averageRating} />
            </div>
          </SurfaceCard>
          <SurfaceCard className="p-4">
            <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Pending Approval</span>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-geist text-[30px] font-semibold text-[#1b1b1d]">{formatNumber(counts.pending)}</span>
              <Pill tone="danger">Priority</Pill>
            </div>
          </SurfaceCard>
          <SurfaceCard className="p-4">
            <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Approved</span>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-geist text-[30px] font-semibold text-[#1b1b1d]">{formatNumber(counts.approved)}</span>
              <Pill tone="success">Live</Pill>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        {[
          ['all', 'All Reviews'],
          ['approved', 'Approved'],
          ['pending', 'Pending'],
          ['rejected', 'Rejected'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={tab === key ? 'rounded-lg bg-[#0058be] px-4 py-2 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm' : 'rounded-lg border border-[#c6c6cd] bg-white px-4 py-2 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#76777d] hover:bg-[#f6f3f5]'}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button className="rounded-lg border border-[#c6c6cd] p-2 text-[#45464d] transition hover:bg-[#f6f3f5]" type="button"><span className="material-symbols-outlined">download</span></button>
          <button className="rounded-lg border border-[#c6c6cd] p-2 text-[#45464d] transition hover:bg-[#f6f3f5]" type="button" onClick={load}><span className="material-symbols-outlined">refresh</span></button>
        </div>
      </div>

      <SurfaceCard className="overflow-hidden">
        {loading ? (
          <RowSpinner label="Loading customer reviews…" />
        ) : !filteredReviews.length ? (
          <EmptyState icon="reviews" title={tab === 'pending' ? 'No reviews awaiting moderation' : 'No reviews here'} message="Switch filters or wait for new customer feedback to arrive." />
        ) : (
          <>
            <TableWrap>
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[#f6f3f5]">
                  <tr>
                    {['Product', 'Customer', 'Rating', 'Comment', 'Date', 'Status', 'Actions'].map((heading, index) => (
                      <th key={`${heading}-${index}`} className={`px-6 py-4 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280] ${index === 2 ? 'text-center' : ''} ${index === 6 ? 'text-right' : ''}`}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]">
                  {filteredReviews.map((review) => {
                    const initials = review.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
                    const statusTone = review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'danger' : 'warn';
                    return (
                      <tr key={review.id} className="transition-colors hover:bg-[#f6f3f5]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0edef] text-[#76777d]">
                              <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-[#1b1b1d]">{review.product?.name || 'Removed product'}</p>
                              <p className="text-[11px] text-[#76777d]">{review.product?.category || 'Catalog item'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8e2ff] font-geist text-[10px] font-bold text-[#004395]">{initials}</div>
                            <div>
                              <p className="text-[14px] font-medium text-[#1b1b1d]">{review.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center"><Stars value={review.rating} /></td>
                        <td className="px-6 py-4">
                          <p className="admin-clamp-2 max-w-xs text-[13px] leading-5 text-[#45464d]">{review.comment}</p>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#45464d]">{formatDate(review.createdAt)}</td>
                        <td className="px-6 py-4"><Pill tone={statusTone}>{review.status}</Pill></td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {review.status !== 'approved' ? <button className="rounded-lg bg-[#0058be] px-3 py-1 text-[12px] font-semibold text-white" type="button" onClick={() => setStatus(review, 'approved')}>Approve</button> : null}
                            <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#eae7e9] hover:text-[#0058be]" type="button" onClick={() => openEdit(review)}>
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#ffdad6] hover:text-[#ba1a1a]" type="button" onClick={() => removeReview(review)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
            <div className="flex items-center justify-between bg-[#f6f3f5] px-6 py-4 text-[13px] text-[#45464d]">
              <span>Showing {formatNumber(filteredReviews.length)} of {formatNumber(reviews.length)} reviews</span>
              <div className="flex gap-1">
                <button className="rounded-lg border border-[#c6c6cd] p-2 text-[#76777d]" type="button"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                <button className="rounded-lg bg-[#0058be] px-3 py-1 font-geist text-[12px] font-semibold text-white" type="button">1</button>
                <button className="rounded-lg border border-[#c6c6cd] p-2 text-[#76777d]" type="button"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
              </div>
            </div>
          </>
        )}
      </SurfaceCard>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SurfaceCard className="relative overflow-hidden p-6 lg:col-span-2">
          <div className="relative z-10">
            <h3 className="font-geist text-[18px] font-semibold text-[#1b1b1d]">Review Sentiment Analysis</h3>
            <p className="mt-1 text-[13px] text-[#45464d]">AI-style summary of the latest moderation signals.</p>
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-[12px] font-semibold text-[#1b1b1d]"><span>Positive ({sentiment.positive}%)</span></div>
                <MiniBar value={sentiment.positive} tone="secondary" />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[12px] font-semibold text-[#1b1b1d]"><span>Neutral ({sentiment.neutral}%)</span></div>
                <MiniBar value={sentiment.neutral} tone="muted" />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[12px] font-semibold text-[#1b1b1d]"><span>Negative ({sentiment.negative}%)</span></div>
                <MiniBar value={sentiment.negative} tone="danger" />
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 -right-8 opacity-10">
            <span className="material-symbols-outlined text-[120px]">monitoring</span>
          </div>
        </SurfaceCard>

        <div className="rounded-xl bg-[#131b2e] p-6 text-white shadow-lg">
          <div>
            <h3 className="font-geist text-[18px] font-semibold">Moderation Queue</h3>
            <p className="mt-2 text-[13px] text-white/75">You have {formatNumber(counts.pending)} pending reviews that need attention today.</p>
          </div>
          <ActionButton tone="secondary" type="button" className="mt-6 w-full justify-center border-transparent bg-white text-[#131b2e] hover:bg-white/90" onClick={() => setTab('pending')}>
            Process Queue
          </ActionButton>
        </div>
      </div>

      <Modal open={Boolean(modal)} title="Edit review" onClose={() => setModal(null)}>
        <form className="space-y-4" onSubmit={submit}>
          {formError ? <PageError message={formError} /> : null}
          <div>
            <span className="mb-2 block font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Rating</span>
            <Stars value={form.rating} size={24} onChange={(value) => setForm((current) => ({ ...current, rating: value }))} />
          </div>
          <Field label="Title" hint="optional">
            <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </Field>
          <Field label="Comment">
            <textarea className="min-h-[110px] w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} />
          </Field>
          <Field label="Status">
            <select className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <ActionButton tone="secondary" type="button" onClick={() => setModal(null)}>Cancel</ActionButton>
            <ActionButton tone="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
