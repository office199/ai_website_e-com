'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiUrl, useApp } from '../../context/AppContext';
import { AdminPageHead, EmptyState, Field, Modal, PageError, RowSpinner } from '../components/AdminUI';
import Reveal from '../../components/motion/Reveal';

const emptyProduct = { name: '', category: 'women', type: '', price: '', color: '', image: '', stock: '' };
const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;
const CATEGORIES = ['women', 'men', 'kids', 'baby'];

export default function AdminProductsPage() {
  const { authFetch } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | { mode: 'add' | 'edit', data }
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiUrl()}/api/products`);
      if (!res.ok) throw new Error('Unable to load products.');
      setProducts(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => products.filter((p) => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || p.color.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  }), [products, search, categoryFilter]);

  const openAdd = () => { setForm(emptyProduct); setFormError(''); setModal({ mode: 'add' }); };
  const openEdit = (product) => {
    setForm({ name: product.name, category: product.category, type: product.type, price: String(product.price), color: product.color, image: product.image, stock: String(product.stock) });
    setFormError('');
    setModal({ mode: 'edit', id: product.id });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    const editingId = modal?.id;
    try {
      const res = await authFetch(editingId ? `/api/admin/products/${editingId}` : '/api/admin/products', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to save this product.');
      setModal(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this product from the catalogue? Related cart, wishlist and review entries will also be cleared.')) return;
    try {
      const res = await authFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to remove this product.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <Reveal>
      <AdminPageHead eyebrow="Catalogue" title="Products" description="Create, edit and remove items from the store catalogue.">
        <button className="admin-btn primary" onClick={openAdd}>+ Add product</button>
      </AdminPageHead>

      {error && <div style={{ marginTop: '20px' }}><PageError message={error} /></div>}

      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search by name, type or colour…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="admin-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="admin-panel no-pad">
        {loading ? <RowSpinner /> : !filtered.length ? (
          <EmptyState icon="◈" title={products.length ? 'No products match your filters' : 'No products yet'} message={products.length ? 'Try adjusting your search or category filter.' : 'Add your first catalogue item to get started.'} action={!products.length ? <button className="admin-btn primary" onClick={openAdd}>+ Add product</button> : null} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th className="ta-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td><div className="admin-thumb" style={{ backgroundImage: `url(${product.image})` }} /></td>
                    <td><strong>{product.name}</strong><div className="admin-sub">{product.type} · {product.color}</div></td>
                    <td><span className="pill neutral">{product.category}</span></td>
                    <td>{formatMoney(product.price)}</td>
                    <td><span className={product.stock <= 15 ? 'stock-low' : ''}>{product.stock} units</span></td>
                    <td className="ta-right">
                      <button className="admin-link edit" onClick={() => openEdit(product)}>Edit</button>
                      <button className="admin-link danger" onClick={() => remove(product.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </Reveal>
      <Modal open={Boolean(modal)} title={modal?.mode === 'edit' ? 'Edit product' : 'Add product'} onClose={() => setModal(null)}>
        <form onSubmit={submit} className="admin-form">
          {formError && <div className="auth-error">{formError}</div>}
          <div className="admin-form-row">
            <Field label="Product name" style={{ flex: 1 }}><input required className="admin-input" value={form.name} onChange={(e) => setForm((d) => ({ ...d, name: e.target.value }))} /></Field>
            <Field label="Category" style={{ width: '150px' }}>
              <select className="admin-select" value={form.category} onChange={(e) => setForm((d) => ({ ...d, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="admin-form-row">
            <Field label="Type" style={{ flex: 1 }}><input required className="admin-input" value={form.type} onChange={(e) => setForm((d) => ({ ...d, type: e.target.value }))} /></Field>
            <Field label="Colour" style={{ width: '130px' }}><input required className="admin-input" value={form.color} onChange={(e) => setForm((d) => ({ ...d, color: e.target.value }))} /></Field>
          </div>
          <div className="admin-form-row">
            <Field label="Price (USD)" style={{ flex: 1 }}><input required type="number" min="0" step="0.01" className="admin-input" value={form.price} onChange={(e) => setForm((d) => ({ ...d, price: e.target.value }))} /></Field>
            <Field label="Stock" style={{ flex: 1 }}><input required type="number" min="0" step="1" className="admin-input" value={form.stock} onChange={(e) => setForm((d) => ({ ...d, stock: e.target.value }))} /></Field>
          </div>
          <Field label="Product image URL"><input required type="url" className="admin-input" value={form.image} onChange={(e) => setForm((d) => ({ ...d, image: e.target.value }))} /></Field>
          {form.image && <div className="admin-thumb-lg" style={{ backgroundImage: `url(${form.image})` }} />}
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn primary" disabled={saving}>{saving ? 'Saving…' : modal?.mode === 'edit' ? 'Save changes' : 'Create product'}</button>
            <button type="button" className="admin-btn ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
