'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiUrl, useApp } from '../../context/AppContext';
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
  SurfaceCard,
  TableWrap,
  formatDate,
  formatNumber,
} from '../components/AdminUI';

const DEFAULT_ICON = '🏷️';
const ICON_CHOICES = ['📱', '🧥', '🪑', '💄', '⚽', '🧸', '🎧', '⌚', '🍽️', '💡', '🛒', '🎁', '🏷️', '🧳', '🪴', '📚'];

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminCategoriesPage() {
  const { authFetch } = useApp();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', icon: DEFAULT_ICON, parent: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        authFetch('/api/admin/categories'),
        fetch(`${getApiUrl()}/api/products`),
      ]);
      if (!categoriesRes.ok || !productsRes.ok) throw new Error('Unable to load categories.');
      const [categoriesData, productsData] = await Promise.all([categoriesRes.json(), productsRes.json()]);
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load categories.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const topLevel = useMemo(() => categories.filter((category) => !category.parent), [categories]);
  const childrenOf = useCallback((parentId) => categories.filter((category) => category.parent === parentId), [categories]);

  const productCountByCategory = useMemo(() => {
    const counts = new Map();
    products.forEach((product) => {
      const key = slugify(product.category);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [products]);

  const rows = useMemo(() => categories.map((category) => {
    const slug = slugify(category.name);
    const ownCount = productCountByCategory.get(slug) || 0;
    const childCount = childrenOf(category.id).reduce((sum, child) => sum + (productCountByCategory.get(slugify(child.name)) || 0), 0);
    const totalCount = ownCount + childCount;
    const status = totalCount === 0 ? 'Disabled' : ownCount === 0 && category.parent ? 'Draft' : 'Active';
    return { ...category, slug, totalCount, status };
  }), [categories, childrenOf, productCountByCategory]);

  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const totalItems = products.length;
    const activeCategories = rows.filter((row) => row.status === 'Active').length;
    return {
      totalCategories,
      totalItems,
      activeRate: totalCategories ? Math.round((activeCategories / totalCategories) * 100) : 0,
    };
  }, [categories.length, products.length, rows]);

  const distribution = useMemo(() => {
    const max = Math.max(...rows.map((row) => row.totalCount), 1);
    return rows
      .slice()
      .sort((left, right) => right.totalCount - left.totalCount)
      .slice(0, 5)
      .map((row) => ({ ...row, share: (row.totalCount / max) * 100 }));
  }, [rows]);

  const recentUpdates = useMemo(() => rows.slice().sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 3), [rows]);

  const openAdd = (parent = '') => {
    setForm({ name: '', icon: DEFAULT_ICON, parent });
    setFormError('');
    setModal({ mode: 'add' });
  };

  const openEdit = (category) => {
    setForm({ name: category.name, icon: category.icon || DEFAULT_ICON, parent: category.parent || '' });
    setFormError('');
    setModal({ mode: 'edit', id: category.id });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { name: form.name.trim(), icon: form.icon || DEFAULT_ICON };
      if (form.parent) payload.parent = form.parent;
      const response = await authFetch(modal?.mode === 'edit' ? `/api/admin/categories/${modal.id}` : '/api/admin/categories', {
        method: modal?.mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to save this category.');
      }
      setModal(null);
      await load();
    } catch (submitError) {
      setFormError(submitError.message || 'Unable to save this category.');
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    const childCount = childrenOf(category.id).length;
    const prompt = childCount ? `Delete "${category.name}" and its ${childCount} subcategories?` : `Delete the "${category.name}" category?`;
    if (!window.confirm(prompt)) return;
    try {
      const response = await authFetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to delete this category.');
      }
      await load();
    } catch (removeError) {
      setError(removeError.message || 'Unable to delete this category.');
    }
  };

  return (
    <div>
      <AdminPageHead
        eyebrow="Taxonomy"
        title="Categories"
        description="Organize and manage your store product structure."
      >
        <ActionButton tone="primary" type="button" onClick={() => openAdd()}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Category
        </ActionButton>
      </AdminPageHead>

      {error ? <div className="mb-6"><PageError message={error} /></div> : null}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <SurfaceCard className="flex items-center gap-4 p-6">
          <div className="rounded-lg bg-[#0058be]/10 p-3 text-[#0058be]"><span className="material-symbols-outlined text-[32px]">category</span></div>
          <div>
            <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Total Categories</p>
            <p className="font-geist text-[30px] font-semibold tracking-[-0.02em] text-[#1b1b1d]">{formatNumber(stats.totalCategories)}</p>
          </div>
        </SurfaceCard>
        <SurfaceCard className="flex items-center gap-4 p-6">
          <div className="rounded-lg bg-[#131b2e]/10 p-3 text-[#131b2e]"><span className="material-symbols-outlined text-[32px]">inventory</span></div>
          <div>
            <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Categorized Items</p>
            <p className="font-geist text-[30px] font-semibold tracking-[-0.02em] text-[#1b1b1d]">{formatNumber(stats.totalItems)}</p>
          </div>
        </SurfaceCard>
        <SurfaceCard className="flex items-center gap-4 p-6">
          <div className="rounded-lg bg-[#004395]/10 p-3 text-[#004395]"><span className="material-symbols-outlined text-[32px]">trending_up</span></div>
          <div>
            <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Active Status</p>
            <p className="font-geist text-[30px] font-semibold tracking-[-0.02em] text-[#1b1b1d]">{stats.activeRate}%</p>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#c6c6cd] p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[#45464d]">
            <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Showing</span>
            <select className="rounded-lg border border-[#c6c6cd] bg-[#f6f3f5] px-2 py-1 text-[13px] outline-none">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">per page</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton tone="secondary" type="button"><span className="material-symbols-outlined text-[18px]">filter_list</span>Filter</ActionButton>
            <ActionButton tone="secondary" type="button"><span className="material-symbols-outlined text-[18px]">download</span>Export</ActionButton>
          </div>
        </div>

        {loading ? (
          <RowSpinner label="Loading categories…" />
        ) : !rows.length ? (
          <EmptyState icon="category" title="No categories yet" message="Create your first category to start organising products." action={<ActionButton tone="primary" type="button" onClick={() => openAdd()}>Add Category</ActionButton>} />
        ) : (
          <>
            <TableWrap>
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[#f6f3f5]">
                  <tr>
                    {['Category Name', 'Slug', 'Number of Products', 'Status', 'Actions'].map((heading, index) => (
                      <th key={`${heading}-${index}`} className={`px-6 py-4 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280] ${index === 2 ? 'text-right' : ''} ${index === 4 ? 'text-right' : ''}`}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]">
                  {rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-[#f6f3f5]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0edef] text-[20px]">{row.icon || DEFAULT_ICON}</div>
                          <div>
                            <p className="text-[14px] font-semibold text-[#1b1b1d]">{row.name}</p>
                            {row.parent ? <p className="text-[11px] text-[#76777d]">Subcategory</p> : <p className="text-[11px] text-[#76777d]">Top-level category</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-geist text-[13px] text-[#76777d]">{row.slug}</td>
                      <td className="px-6 py-4 text-right font-geist text-[13px] text-[#1b1b1d]">{formatNumber(row.totalCount)}</td>
                      <td className="px-6 py-4"><Pill tone={row.status === 'Active' ? 'success' : row.status === 'Draft' ? 'warn' : 'danger'}>{row.status}</Pill></td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {!row.parent ? <button className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0058be] hover:underline" type="button" onClick={() => openAdd(row.id)}>+ Subcategory</button> : null}
                          <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#eae7e9] hover:text-[#0058be]" type="button" onClick={() => openEdit(row)}>
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#ffdad6] hover:text-[#ba1a1a]" type="button" onClick={() => removeCategory(row)}>
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="flex flex-col gap-4 border-t border-[#c6c6cd] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Showing {formatNumber(rows.length)} of {formatNumber(rows.length)} entries</span>
              <div className="flex items-center gap-1">
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white text-[#76777d]" type="button">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0058be] font-geist text-[12px] font-semibold text-white" type="button">1</button>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white font-geist text-[12px] font-semibold text-[#1b1b1d]" type="button">2</button>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white font-geist text-[12px] font-semibold text-[#1b1b1d]" type="button">3</button>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white text-[#76777d]" type="button">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </SurfaceCard>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SurfaceCard className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="font-geist text-[18px] font-semibold text-[#1b1b1d]">Category Distribution</h4>
            <span className="material-symbols-outlined text-[#76777d]">more_vert</span>
          </div>
          <div className="space-y-4 rounded-xl bg-[#f6f3f5] p-5">
            {distribution.length ? distribution.map((row) => (
              <div key={row.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-[13px]">
                  <span className="font-medium text-[#1b1b1d]">{row.icon} {row.name}</span>
                  <span className="font-geist font-semibold text-[#1b1b1d]">{formatNumber(row.totalCount)}</span>
                </div>
                <MiniBar value={row.share} tone="secondary" />
              </div>
            )) : <p className="text-center text-[13px] text-[#76777d]">Distribution analytics unavailable in demo mode</p>}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="font-geist text-[18px] font-semibold text-[#1b1b1d]">Recently Updated</h4>
            <span className="material-symbols-outlined text-[#76777d]">history</span>
          </div>
          <div className="space-y-4">
            {recentUpdates.length ? recentUpdates.map((row, index) => (
              <div key={row.id} className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-[#0058be]' : index === 1 ? 'bg-[#adc6ff]' : 'bg-[#c6c6cd]'}`} />
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-[#1b1b1d]">{row.name}</p>
                  <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Updated {formatDate(row.createdAt)}</p>
                </div>
              </div>
            )) : <p className="text-[13px] text-[#76777d]">No recent category changes.</p>}
          </div>
        </SurfaceCard>
      </div>

      <Modal open={Boolean(modal)} title={modal?.mode === 'edit' ? 'Edit category' : 'New category'} onClose={() => setModal(null)}>
        <form className="space-y-4" onSubmit={submit}>
          {formError ? <PageError message={formError} /> : null}
          <Field label="Category name">
            <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Electronics" />
          </Field>
          <div className="space-y-2">
            <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Icon</span>
            <div className="flex flex-wrap gap-2">
              {ICON_CHOICES.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, icon }))}
                  className={form.icon === icon ? 'flex h-10 w-10 items-center justify-center rounded-lg border border-[#0058be] bg-[#d8e2ff]' : 'flex h-10 w-10 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white'}
                >
                  <span className="text-[18px]">{icon}</span>
                </button>
              ))}
            </div>
            <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" maxLength={16} value={form.icon} onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))} placeholder="Custom emoji or icon" />
          </div>
          <Field label="Parent category" hint="leave blank for a top-level category">
            <select className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" value={form.parent} onChange={(event) => setForm((current) => ({ ...current, parent: event.target.value }))}>
              <option value="">— Top-level category —</option>
              {topLevel.filter((category) => category.id !== modal?.id).map((category) => (
                <option key={category.id} value={category.id}>{category.icon || DEFAULT_ICON} {category.name}</option>
              ))}
            </select>
          </Field>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <ActionButton tone="secondary" type="button" onClick={() => setModal(null)}>Cancel</ActionButton>
            <ActionButton tone="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : modal?.mode === 'edit' ? 'Save Changes' : 'Create Category'}</ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
