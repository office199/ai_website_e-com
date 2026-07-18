'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminPageHead, EmptyState, Field, Modal, PageError, RowSpinner } from '../components/AdminUI';
import Reveal from '../../components/motion/Reveal';

const ICON_CHOICES = ['👗', '👔', '👟', '👜', '🕶️', '⌚', '🧢', '🧥', '👖', '🥻', '🎀', '💍', '🛍️', '🏷️', '🧣', '🧦'];
const DEFAULT_ICON = '🏷️';

export default function AdminCategoriesPage() {
  const { authFetch } = useApp();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | { mode, id?, parent? }
  const [form, setForm] = useState({ name: '', icon: DEFAULT_ICON, parent: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/admin/categories');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to load categories.');
      setCategories(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const topLevel = useMemo(() => categories.filter((c) => !c.parent), [categories]);
  const childrenOf = (parentId) => categories.filter((c) => c.parent === parentId);

  const openAdd = (parent = null) => {
    setForm({ name: '', icon: DEFAULT_ICON, parent: parent || '' });
    setFormError('');
    setModal({ mode: 'add' });
  };
  const openEdit = (cat) => {
    setForm({ name: cat.name, icon: cat.icon || DEFAULT_ICON, parent: cat.parent || '' });
    setFormError('');
    setModal({ mode: 'edit', id: cat.id, wasSub: Boolean(cat.parent) });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = { name: form.name.trim(), icon: form.icon || DEFAULT_ICON };
    if (form.parent) payload.parent = form.parent;
    const editingId = modal?.id;
    try {
      const res = await authFetch(editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to save this category.');
      setModal(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cat) => {
    const hasChildren = childrenOf(cat.id).length > 0;
    const message = hasChildren
      ? `Delete "${cat.name}" and its ${childrenOf(cat.id).length} subcategory(s)? This cannot be undone.`
      : `Delete the "${cat.name}" category?`;
    if (!window.confirm(message)) return;
    try {
      const res = await authFetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to delete this category.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <Reveal>
      <AdminPageHead eyebrow="Taxonomy" title="Categories" description="Organise the catalogue with categories and subcategories. Pick an icon for each one.">
        <button className="admin-btn primary" onClick={() => openAdd()}>+ Add category</button>
      </AdminPageHead>

      {error && <div style={{ marginTop: '20px' }}><PageError message={error} /></div>}

      <div className="admin-panel">
        {loading ? <RowSpinner /> : !topLevel.length ? (
          <EmptyState icon="▣" title="No categories yet" message="Create your first category to start organising products." action={<button className="admin-btn primary" onClick={() => openAdd()}>+ Add category</button>} />
        ) : (
          <div className="category-list">
            {topLevel.map((cat) => {
              const subs = childrenOf(cat.id);
              return (
                <div key={cat.id} className="category-block">
                  <div className="category-row top">
                    <span className="category-icon">{cat.icon}</span>
                    <div className="category-row-copy">
                      <strong>{cat.name}</strong>
                      <small>{subs.length} subcategory{subs.length === 1 ? '' : 's'}</small>
                    </div>
                    <div className="category-row-actions">
                      <button className="admin-link add-sub" onClick={() => openAdd(cat.id)}>+ Subcategory</button>
                      <button className="admin-link edit" onClick={() => openEdit(cat)}>Edit</button>
                      <button className="admin-link danger" onClick={() => remove(cat)}>Delete</button>
                    </div>
                  </div>
                  {subs.length > 0 && (
                    <div className="subcategory-list">
                      {subs.map((sub) => (
                        <div key={sub.id} className="category-row sub">
                          <span className="category-icon small">{sub.icon}</span>
                          <div className="category-row-copy"><strong>{sub.name}</strong></div>
                          <div className="category-row-actions">
                            <button className="admin-link edit" onClick={() => openEdit(sub)}>Edit</button>
                            <button className="admin-link danger" onClick={() => remove(sub)}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      </Reveal>
      <Modal open={Boolean(modal)} title={modal?.mode === 'edit' ? 'Edit category' : 'New category'} onClose={() => setModal(null)}>
        <form onSubmit={submit} className="admin-form">
          {formError && <div className="auth-error">{formError}</div>}
          <Field label="Category name"><input required className="admin-input" value={form.name} onChange={(e) => setForm((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Dresses, Footwear" /></Field>

          <div className="admin-field">
            <span className="admin-field-label">Icon <em>shown next to the category</em></span>
            <div className="icon-picker">
              {ICON_CHOICES.map((icon) => (
                <button type="button" key={icon} className={`icon-chip${form.icon === icon ? ' selected' : ''}`} onClick={() => setForm((d) => ({ ...d, icon }))}>{icon}</button>
              ))}
              <label className="icon-custom">
                <span>Custom</span>
                <input className="admin-input" maxLength={4} value={form.icon} onChange={(e) => setForm((d) => ({ ...d, icon: e.target.value }))} placeholder="🏷️" />
              </label>
            </div>
          </div>

          {modal?.mode === 'add' && (
            <Field label="Parent category" hint="leave blank for a top-level category">
              <select className="admin-select" value={form.parent} onChange={(e) => setForm((d) => ({ ...d, parent: e.target.value }))}>
                <option value="">— Top-level category —</option>
                {topLevel.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
          )}

          {modal?.mode === 'edit' && (
            <Field label="Parent category" hint="move under another category to make it a subcategory">
              <select className="admin-select" value={form.parent} onChange={(e) => setForm((d) => ({ ...d, parent: e.target.value }))} disabled={modal.id && childrenOf(modal.id).length > 0}>
                <option value="">— Top-level category —</option>
                {topLevel.filter((c) => c.id !== modal.id).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
          )}

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn primary" disabled={saving}>{saving ? 'Saving…' : modal?.mode === 'edit' ? 'Save changes' : 'Create category'}</button>
            <button type="button" className="admin-btn ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
