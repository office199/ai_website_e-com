'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiUrl, useApp } from '../../context/AppContext';
import {
  ActionButton,
  AdminPageHead,
  EmptyState,
  Field,
  Modal,
  PageError,
  Pill,
  RowSpinner,
  SurfaceCard,
  TableWrap,
  formatCompactMoney,
  formatMoney,
  formatNumber,
} from '../components/AdminUI';

const emptyProduct = { name: '', category: '', type: '', price: '', color: '', image: '', stock: '' };

function productStatus(product) {
  if (product.stock <= 0) return { label: 'Out of Stock', tone: 'danger' };
  if (product.stock <= 15) return { label: 'Low Stock', tone: 'warn' };
  return { label: 'Active', tone: 'success' };
}

export default function AdminProductsPage() {
  const { authFetch } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${getApiUrl()}/api/products`);
      if (!response.ok) throw new Error('Unable to load products.');
      setProducts(await response.json());
    } catch (loadError) {
      setError(loadError.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categoryOptions = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(), [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = products.filter((product) => {
      const status = productStatus(product).label;
      const matchesSearch = !query || [product.name, product.type, product.color, product.category].some((field) => String(field || '').toLowerCase().includes(query));
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    result.sort((left, right) => {
      if (sortBy === 'price-high') return right.price - left.price;
      if (sortBy === 'price-low') return left.price - right.price;
      if (sortBy === 'stock') return left.stock - right.stock;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
    return result;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 15).length;
    const outOfStock = products.filter((product) => product.stock === 0).length;
    const revenueProxy = products.reduce((sum, product) => sum + product.price * product.stock, 0);
    return { totalProducts, lowStock, outOfStock, revenueProxy };
  }, [products]);

  const openAdd = () => {
    setForm(emptyProduct);
    setFormError('');
    setModal({ mode: 'add' });
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      type: product.type,
      price: String(product.price),
      color: product.color,
      image: product.image,
      stock: String(product.stock),
    });
    setFormError('');
    setModal({ mode: 'edit', id: product.id });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        category: form.category.trim().toLowerCase(),
        price: Number(form.price),
        stock: Number(form.stock),
      };
      const response = await authFetch(modal?.mode === 'edit' ? `/api/admin/products/${modal.id}` : '/api/admin/products', {
        method: modal?.mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to save this product.');
      }
      setModal(null);
      await loadProducts();
    } catch (submitError) {
      setFormError(submitError.message || 'Unable to save this product.');
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (productId) => {
    if (!window.confirm('Remove this product from the catalogue? Related cart, wishlist and review entries will also be cleared.')) return;
    try {
      const response = await authFetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to remove this product.');
      }
      await loadProducts();
    } catch (removeError) {
      setError(removeError.message || 'Unable to remove this product.');
    }
  };

  return (
    <div>
      <AdminPageHead
        eyebrow="Catalogue"
        title="Product Inventory"
        description="Manage, edit and track your global product listings."
      >
        <ActionButton tone="secondary" type="button">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          Category Filter
        </ActionButton>
        <ActionButton tone="primary" type="button" onClick={openAdd}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Product
        </ActionButton>
      </AdminPageHead>

      {error ? <div className="mb-6"><PageError message={error} /></div> : null}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SurfaceCard className="p-4">
          <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6f7280]">Total Products</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <span className="font-geist text-[30px] font-semibold tracking-[-0.02em] text-[#1b1b1d]">{formatNumber(stats.totalProducts)}</span>
            <Pill tone="success">Live</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6f7280]">Low Stock</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <span className="font-geist text-[30px] font-semibold tracking-[-0.02em] text-[#1b1b1d]">{formatNumber(stats.lowStock)}</span>
            <Pill tone="warn">Action Needed</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6f7280]">Out of Stock</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <span className="font-geist text-[30px] font-semibold tracking-[-0.02em] text-[#1b1b1d]">{formatNumber(stats.outOfStock)}</span>
            <Pill tone="danger">Critical</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6f7280]">Inventory Value</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <span className="font-geist text-[30px] font-semibold tracking-[-0.02em] text-[#1b1b1d]">{formatCompactMoney(stats.revenueProxy)}</span>
            <div className="flex h-6 w-16 items-end gap-0.5">
              <span className="h-1/3 flex-1 rounded-t-sm bg-[#0058be]/20" />
              <span className="h-2/3 flex-1 rounded-t-sm bg-[#0058be]/20" />
              <span className="h-1/2 flex-1 rounded-t-sm bg-[#0058be]/20" />
              <span className="h-full flex-1 rounded-t-sm bg-[#0058be]" />
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#c6c6cd] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex overflow-hidden rounded-lg border border-[#c6c6cd]">
              {['all', 'Active', 'Low Stock', 'Out of Stock'].map((status) => {
                const selected = (status === 'all' && statusFilter === 'all') || statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status === 'all' ? 'all' : status)}
                    className={selected ? 'bg-[#eae7e9] px-3 py-2 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1b1b1d]' : 'bg-white px-3 py-2 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#76777d] hover:bg-[#f6f3f5]'}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            <input
              className="rounded-lg border border-[#c6c6cd] bg-white px-4 py-2 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20"
              placeholder="Search by name, type, colour..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="rounded-lg border border-[#c6c6cd] bg-white px-4 py-2 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#45464d]">
            <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Sort by:</span>
            <select
              className="rounded-lg border border-[#c6c6cd] bg-white px-4 py-2 text-[14px] font-semibold text-[#1b1b1d] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="stock">Stock Level</option>
            </select>
          </div>
        </div>

        {loading ? (
          <RowSpinner label="Loading product inventory…" />
        ) : !filteredProducts.length ? (
          <EmptyState
            icon="inventory_2"
            title={products.length ? 'No products match your filters' : 'No products yet'}
            message={products.length ? 'Try changing the search, category or status filters.' : 'Add your first product to populate the inventory dashboard.'}
            action={<ActionButton tone="primary" type="button" onClick={openAdd}>Add Product</ActionButton>}
          />
        ) : (
          <>
            <TableWrap>
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[#f6f3f5]">
                  <tr>
                    {['Thumbnail', 'Product Name & SKU', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((heading, index) => (
                      <th key={`${heading}-${index}`} className={`px-6 py-4 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280] ${index === 6 ? 'text-right' : ''}`}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]">
                  {filteredProducts.map((product) => {
                    const status = productStatus(product);
                    return (
                      <tr key={product.id} className="transition-colors hover:bg-[#f6f3f5]">
                        <td className="px-6 py-4">
                          <div className="h-12 w-12 overflow-hidden rounded-lg border border-[#c6c6cd] bg-[#f6f3f5]">
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[14px] font-semibold text-[#1b1b1d]">{product.name}</p>
                          <p className="font-geist text-[12px] uppercase tracking-[0.08em] text-[#76777d]">SKU-{product.id.slice(-8).toUpperCase()}</p>
                        </td>
                        <td className="px-6 py-4"><span className="rounded-md bg-[#f6f3f5] px-2 py-1 text-[13px] text-[#45464d]">{product.category}</span></td>
                        <td className="px-6 py-4 font-geist text-[13px] text-[#1b1b1d]">{formatMoney(product.price)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#eae7e9]">
                              <div className={product.stock <= 0 ? 'h-full bg-[#ba1a1a]' : product.stock <= 15 ? 'h-full bg-amber-500' : 'h-full bg-emerald-500'} style={{ width: `${Math.max(4, Math.min(100, product.stock))}%` }} />
                            </div>
                            <span className={`font-geist text-[13px] ${product.stock <= 15 ? 'font-bold text-amber-700' : 'text-[#1b1b1d]'}`}>{formatNumber(product.stock)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><Pill tone={status.tone}>{status.label}</Pill></td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#eae7e9] hover:text-[#0058be]" type="button" onClick={() => openEdit(product)}>
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#ffdad6] hover:text-[#ba1a1a]" type="button" onClick={() => removeProduct(product.id)}>
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
            <div className="flex flex-col gap-4 border-t border-[#c6c6cd] bg-[#f6f3f5] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Showing {formatNumber(filteredProducts.length)} of {formatNumber(products.length)} results</span>
              <div className="flex items-center gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white text-[#76777d]" type="button">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0058be] font-geist text-[12px] font-semibold text-white" type="button">1</button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white font-geist text-[12px] font-semibold text-[#1b1b1d]" type="button">2</button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white font-geist text-[12px] font-semibold text-[#1b1b1d]" type="button">3</button>
                <span className="px-1 text-[#76777d]">...</span>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white font-geist text-[12px] font-semibold text-[#1b1b1d]" type="button">9</button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#c6c6cd] bg-white text-[#76777d]" type="button">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </SurfaceCard>

      <Modal open={Boolean(modal)} title={modal?.mode === 'edit' ? 'Edit product' : 'Add product'} onClose={() => setModal(null)} wide>
        <form className="space-y-4" onSubmit={submit}>
          {formError ? <PageError message={formError} /> : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,220px]">
            <Field label="Product name">
              <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <Field label="Category" hint="lowercase recommended">
              <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,180px]">
            <Field label="Type">
              <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} />
            </Field>
            <Field label="Colour">
              <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Price (USD)">
              <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} />
            </Field>
            <Field label="Stock">
              <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required min="0" step="1" type="number" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} />
            </Field>
          </div>
          <Field label="Product image URL">
            <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required type="url" value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} />
          </Field>
          {form.image ? (
            <div className="overflow-hidden rounded-xl border border-[#c6c6cd] bg-[#f6f3f5]">
              <img src={form.image} alt="Product preview" className="h-48 w-full object-cover" />
            </div>
          ) : null}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <ActionButton tone="secondary" type="button" onClick={() => setModal(null)}>Cancel</ActionButton>
            <ActionButton tone="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : modal?.mode === 'edit' ? 'Save Changes' : 'Create Product'}</ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
