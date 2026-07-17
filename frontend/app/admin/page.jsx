'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl, useApp } from '../context/AppContext';

const emptyProduct = { name: '', category: 'women', type: '', price: '', color: '', image: '', stock: '' };
const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

export default function AdminPage() {
  const { user, authLoading, authFetch } = useApp();
  const router = useRouter();
  const [metrics, setMetrics] = useState({ revenue: 0, orders: 0, customers: 0, averageOrderValue: 0, salesByDay: [] });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [metricsResponse, ordersResponse, productsResponse] = await Promise.all([
        authFetch('/api/admin/metrics'),
        authFetch('/api/admin/orders'),
        fetch(`${getApiUrl()}/api/products`),
      ]);
      if (!metricsResponse.ok || !ordersResponse.ok || !productsResponse.ok) {
        throw new Error('Unable to load the latest store data.');
      }
      setMetrics(await metricsResponse.json());
      setOrders(await ordersResponse.json());
      setProducts(await productsResponse.json());
    } catch (error) {
      console.error('Unable to load admin data:', error);
      setPageError(error.message || 'Unable to load the latest store data.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/admin');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/account');
      return;
    }
    loadAdminData();
  }, [authLoading, user, router, loadAdminData]);

  const lowStockProducts = useMemo(() => products.filter((product) => product.stock <= 15), [products]);
  const maxDailyRevenue = Math.max(...(metrics.salesByDay || []).map((day) => day.revenue), 1);
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const openNewProductForm = () => {
    setFormData(emptyProduct);
    setEditingProductId(null);
    setShowProductForm(true);
  };

  const openEditProductForm = (product) => {
    setFormData({
      name: product.name,
      category: product.category,
      type: product.type,
      price: String(product.price),
      color: product.color,
      image: product.image,
      stock: String(product.stock),
    });
    setEditingProductId(product.id);
    setShowProductForm(true);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setPageError('');
    const payload = { ...formData, price: Number(formData.price), stock: Number(formData.stock) };
    try {
      const response = await authFetch(editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products', {
        method: editingProductId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to save this product.');
      }
      setShowProductForm(false);
      await loadAdminData();
    } catch (error) {
      setPageError(error.message || 'Unable to save this product.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Remove this product from the catalogue?')) return;
    try {
      const response = await authFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to remove this product.');
      }
      await loadAdminData();
    } catch (error) {
      setPageError(error.message || 'Unable to remove this product.');
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return <main className="auth-loading">Checking account access…</main>;
  }

  return (
    <main className="admin">
      <aside className="admin-side">
        <Link href="/" className="wordmark">MODÉ<span>®</span></Link>
        <p>ADMIN CONSOLE</p>
        <nav>
          <a className="current">▦　Overview</a>
          <a>▣　 Orders <small>{orders.length}</small></a>
          <a>◈　 Products <small>{products.length}</small></a>
        </nav>
        <div className="admin-user">
          <i>{initials}</i>
          <span>{user.name}<small>Store administrator</small></span>
        </div>
      </aside>

      <section className="admin-main">
        <header>
          <div><p className="eyebrow">Store management dashboard</p><h1>Welcome, {user.name.split(' ')[0]}.</h1></div>
          <div className="admin-actions">
            <button onClick={loadAdminData} aria-label="Refresh data" style={{ fontSize: '14px', border: '1px solid var(--line)', padding: '8px 12px', marginRight: '5px' }}>Refresh ↻</button>
            <button className="add" onClick={openNewProductForm}>+ Add product</button>
          </div>
        </header>

        {pageError && <div className="auth-error" style={{ marginTop: '24px' }}>{pageError}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '15px' }}>Retrieving store data…</div>
        ) : (
          <>
            <div className="metrics">
              <Metric label="Total revenue" value={formatMoney(metrics.revenue)} />
              <Metric label="Orders" value={String(metrics.orders)} />
              <Metric label="Customers" value={String(metrics.customers)} />
              <Metric label="Average order" value={formatMoney(metrics.averageOrderValue)} />
            </div>

            {showProductForm && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '20px' }}>
                <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '30px', width: '100%', maxWidth: '550px', boxShadow: '0 10px 30px rgba(0,0,0,.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'baseline' }}><h2 style={{ font: '500 24px "Playfair Display"', margin: 0 }}>{editingProductId ? 'Edit product' : 'Add product'}</h2><button onClick={() => setShowProductForm(false)} style={{ fontSize: '20px', fontWeight: 'bold' }} aria-label="Close">×</button></div>
                  <form onSubmit={saveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <Field label="Product name" style={{ flex: 1 }}><input required name="name" value={formData.name} onChange={(event) => setFormData((data) => ({ ...data, name: event.target.value }))} /></Field>
                      <Field label="Category" style={{ width: '130px' }}><select name="category" value={formData.category} onChange={(event) => setFormData((data) => ({ ...data, category: event.target.value }))}><option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option><option value="baby">Baby</option></select></Field>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <Field label="Type" style={{ flex: 1 }}><input required name="type" value={formData.type} onChange={(event) => setFormData((data) => ({ ...data, type: event.target.value }))} /></Field>
                      <Field label="Color" style={{ width: '110px' }}><input required name="color" value={formData.color} onChange={(event) => setFormData((data) => ({ ...data, color: event.target.value }))} /></Field>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <Field label="Price (USD)" style={{ flex: 1 }}><input required type="number" min="0" step="0.01" name="price" value={formData.price} onChange={(event) => setFormData((data) => ({ ...data, price: event.target.value }))} /></Field>
                      <Field label="Stock" style={{ flex: 1 }}><input required type="number" min="0" step="1" name="stock" value={formData.stock} onChange={(event) => setFormData((data) => ({ ...data, stock: event.target.value }))} /></Field>
                    </div>
                    <Field label="Product image URL"><input required type="url" name="image" value={formData.image} onChange={(event) => setFormData((data) => ({ ...data, image: event.target.value }))} /></Field>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}><button type="submit" disabled={saving} className="button dark" style={{ flex: 1, justifyContent: 'center' }}>{saving ? 'Saving…' : editingProductId ? 'Save changes' : 'Create product'}</button><button type="button" onClick={() => setShowProductForm(false)} className="outline">Cancel</button></div>
                  </form>
                </div>
              </div>
            )}

            <div className="admin-layout">
              <div className="orders">
                <div className="panel-top"><div><h2>Recent orders</h2><p>Customer checkouts saved in MongoDB</p></div></div>
                {!orders.length ? <p style={{ fontSize: '12px', color: '#777972', padding: '15px 0' }}>No orders have been placed yet.</p> : (
                  <table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map((order) => (
                    <tr key={order.id}><td><strong>{order.id}</strong></td><td>{order.user?.name || 'Deleted customer'}</td><td>{formatDate(order.createdAt)}</td><td><strong>{formatMoney(order.total)}</strong></td><td><span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span></td></tr>
                  ))}</tbody></table>
                )}
              </div>
              <div className="sales">
                <div className="panel-top"><div><h2>Sales overview</h2><p>Revenue over the last seven days</p></div><b>{formatMoney(metrics.revenue)}</b></div>
                <div className="chart">{metrics.salesByDay.map((day, index) => <i key={`${day.label}-${index}`} className={index === metrics.salesByDay.length - 1 ? 'today' : ''} title={`${day.label}: ${formatMoney(day.revenue)}`} style={{ height: `${Math.max((day.revenue / maxDailyRevenue) * 100, 3)}%` }} />)}</div>
                <div className="days">{metrics.salesByDay.map((day, index) => <span key={`${day.label}-${index}`}>{day.label}</span>)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '18px', marginTop: '18px' }} className="admin-layout">
              <div style={{ background: '#fff', border: '1px solid #e5e3df', padding: '22px', overflowX: 'auto' }}>
                <h2 style={{ font: '500 17px "Playfair Display"', margin: '0 0 15px' }}>Product inventory catalogue</h2>
                {!products.length ? <p style={{ fontSize: '12px', color: '#777972' }}>No products yet. Add your first catalogue item.</p> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', minWidth: '480px' }}><thead><tr style={{ borderBottom: '1px solid #e9e8e4' }}><th style={{ padding: '8px 5px', color: '#8b8b84' }}>Image</th><th style={{ padding: '8px 5px', color: '#8b8b84' }}>Name</th><th style={{ padding: '8px 5px', color: '#8b8b84' }}>Price</th><th style={{ padding: '8px 5px', color: '#8b8b84' }}>Stock</th><th style={{ padding: '8px 5px', color: '#8b8b84', textAlign: 'right' }}>Actions</th></tr></thead><tbody>{products.map((product) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #efeeeb' }}><td style={{ padding: '8px 5px' }}><div style={{ width: '35px', height: '45px', backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #efeeeb' }} /></td><td style={{ padding: '8px 5px' }}><strong>{product.name}</strong><div style={{ fontSize: '9px', color: '#8b8b84' }}>{product.color} · {product.category}</div></td><td style={{ padding: '8px 5px' }}>{formatMoney(product.price)}</td><td style={{ padding: '8px 5px' }}><span style={{ color: product.stock <= 15 ? 'var(--rust)' : 'inherit', fontWeight: product.stock <= 15 ? 'bold' : 'normal' }}>{product.stock} units</span></td><td style={{ padding: '8px 5px', textAlign: 'right' }}><button onClick={() => openEditProductForm(product)} style={{ fontSize: '10px', textDecoration: 'underline', color: 'var(--green)', marginRight: '10px', padding: 0 }}>Edit</button><button onClick={() => deleteProduct(product.id)} style={{ fontSize: '10px', textDecoration: 'underline', color: 'var(--rust)', padding: 0 }}>Delete</button></td></tr>
                  ))}</tbody></table>
                )}
              </div>
              <div className="low-stock" style={{ margin: 0, alignSelf: 'start', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div><h2>Low stock notifications</h2><p>Products with 15 units or fewer</p></div>
                {!lowStockProducts.length ? <div style={{ fontSize: '11px', color: '#777972', padding: '10px', textAlign: 'center' }}>No low-stock products right now.</div> : lowStockProducts.map((product) => <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '10px 0', borderBottom: '1px solid #eee' }}><div><strong>{product.name}</strong><div style={{ fontSize: '9px', color: '#bd4e3b' }}>Only {product.stock} left in stock</div></div><button onClick={() => openEditProductForm(product)} style={{ textDecoration: 'underline', fontSize: '10px' }}>Update →</button></div>)}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Field({ label, children, style }) {
  return <label style={{ ...style, fontSize: '10px', textTransform: 'uppercase', color: '#777972', display: 'block' }}>{label}<span style={{ display: 'block', marginTop: '4px' }}>{children}</span></label>;
}

function Metric({ label, value }) {
  return <div className="metric"><p>{label}</p><h2>{value}</h2><span>Live database total</span></div>;
}
