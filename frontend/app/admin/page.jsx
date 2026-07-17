'use client';

import Link from 'next/link';
import { getApiUrl } from '../context/AppContext';
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [metrics, setMetrics] = useState({ revenue: 24892, orders: 384, customers: 1204, conversion: 3.8 });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Add/Edit Product form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'women',
    type: '',
    price: '',
    color: '',
    image: '',
    stock: ''
  });

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [resMetrics, resOrders, resProducts] = await Promise.all([
        fetch(`${getApiUrl()}/api/admin/metrics`),
        fetch(`${getApiUrl()}/api/admin/orders`),
        fetch(`${getApiUrl()}/api/products`)
      ]);

      if (resMetrics.ok) {
        const data = await resMetrics.json();
        setMetrics(data);
      }
      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data);
      }
      if (resProducts.ok) {
        const data = await resProducts.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddForm = () => {
    setFormData({
      name: '',
      category: 'women',
      type: 'Women · Tailoring',
      price: '120',
      color: 'Sand',
      image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=500&q=85',
      stock: '25'
    });
    setEditingProductId(null);
    setShowAddForm(true);
  };

  const handleOpenEditForm = (p) => {
    setFormData({
      name: p.name,
      category: p.category,
      type: p.type,
      price: String(p.price),
      color: p.color,
      image: p.image,
      stock: String(p.stock)
    });
    setEditingProductId(p.id);
    setShowAddForm(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      type: formData.type,
      price: Number(formData.price),
      color: formData.color,
      image: formData.image,
      stock: Number(formData.stock)
    };

    try {
      let res;
      if (editingProductId) {
        // Edit product
        res = await fetch(`${getApiUrl()}/api/admin/products/${editingProductId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Add new product
        res = await fetch(`${getApiUrl()}/api/admin/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowAddForm(false);
        loadAdminData();
        alert(editingProductId ? 'Product updated successfully!' : 'Product added successfully!');
      } else {
        alert('Failed to save product');
      }
    } catch (err) {
      console.error('Error submitting product:', err);
      alert('Error connecting to backend');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to remove this product from the inventory?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok || res.status === 204) {
        loadAdminData();
        alert('Product deleted successfully');
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const lowStockProducts = products.filter(p => p.stock <= 15);

  return (
    <main className="admin">
      <aside className="admin-side">
        <Link href="/" className="wordmark">
          MODÉ<span>®</span>
        </Link>
        <p>ADMIN CONSOLE</p>
        <nav>
          <a className="current">▦　Overview</a>
          <a>▣　 Orders <small>{orders.length}</small></a>
          <a>◈　 Products <small>{products.length}</small></a>
          <a>♙　 Customers</a>
          <a>⌁　 Analytics</a>
          <a>⚙　 Settings</a>
        </nav>
        <div className="admin-user">
          <i>AM</i>
          <span>
            Amelia Martin
            <small>Store owner</small>
          </span>
          <b>···</b>
        </div>
      </aside>

      <section className="admin-main">
        <header>
          <div>
            <p className="eyebrow">Store Management Dashboard</p>
            <h1>Good morning, Amelia.</h1>
          </div>
          <div className="admin-actions">
            <button onClick={loadAdminData} aria-label="Refresh data" style={{ fontSize: '14px', border: '1px solid var(--line)', padding: '8px 12px', marginRight: '5px' }}>
              Refresh ↻
            </button>
            <button className="add" onClick={handleOpenAddForm}>+ Add product</button>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '15px' }}>
            <span>Retrieving store ledger...</span>
          </div>
        ) : (
          <>
            {/* Metrics cards */}
            <div className="metrics">
              <Metric label="Total revenue" value={`$${metrics.revenue.toLocaleString()}`} trend="↑ 12.5%" />
              <Metric label="Orders" value={String(metrics.orders)} trend="↑ 8.2%" />
              <Metric label="Customers" value={String(metrics.customers)} trend="↑ 18.1%" />
              <Metric label="Conversion rate" value={`${metrics.conversion}%`} trend="↑ 0.4%" />
            </div>

            {/* Product management modal overlay */}
            {showAddForm && (
              <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                padding: '20px'
              }}>
                <div style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  padding: '30px',
                  width: '100%',
                  maxWidth: '550px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'baseline' }}>
                    <h2 style={{ font: '500 24px "Playfair Display"', margin: 0 }}>
                      {editingProductId ? 'Edit Product Details' : 'Add New Product'}
                    </h2>
                    <button onClick={() => setShowAddForm(false)} style={{ fontSize: '20px', fontWeight: 'bold' }}>×</button>
                  </div>
                  <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#777972', display: 'block', marginBottom: '4px' }}>Product Name</label>
                        <input
                          type="text"
                          required
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ width: '130px' }}>
                        <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#777972', display: 'block', marginBottom: '4px' }}>Category</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                        >
                          <option value="women">Women</option>
                          <option value="men">Men</option>
                          <option value="kids">Kids</option>
                          <option value="baby">Baby</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#777972', display: 'block', marginBottom: '4px' }}>Type (Sub-label)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Women · Tailoring"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ width: '100px' }}>
                        <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#777972', display: 'block', marginBottom: '4px' }}>Color</label>
                        <input
                          type="text"
                          required
                          name="color"
                          value={formData.color}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#777972', display: 'block', marginBottom: '4px' }}>Price ($ USD)</label>
                        <input
                          type="number"
                          required
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#777972', display: 'block', marginBottom: '4px' }}>Stock Quantity</label>
                        <input
                          type="number"
                          required
                          name="stock"
                          value={formData.stock}
                          onChange={handleInputChange}
                          style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#777972', display: 'block', marginBottom: '4px' }}>Product Image URL</label>
                      <input
                        type="url"
                        required
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                      <button type="submit" className="button dark" style={{ flex: 1, justifyContent: 'center' }}>
                        {editingProductId ? 'Save Product Changes' : 'Create Product Listing'}
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="outline">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="admin-layout">
              {/* Left Column: Recent Orders */}
              <div className="orders">
                <div className="panel-top">
                  <div>
                    <h2>Recent Orders</h2>
                    <p>Latest live transactions from your customer checkouts</p>
                  </div>
                  <Link href="/account">Go to User History →</Link>
                </div>
                {orders.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#777972', padding: '15px 0' }}>No live orders placed yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Standard mock orders base so that baseline looks robust */}
                      <tr key="MO-10427">
                        <td>MO-10427</td>
                        <td>Liam Johnson</td>
                        <td>Mar 08, 2025</td>
                        <td>$148.00</td>
                        <td><span className="badge shipped">Shipped</span></td>
                      </tr>
                      <tr key="MO-10426">
                        <td>MO-10426</td>
                        <td>Olivia Davis</td>
                        <td>Mar 07, 2025</td>
                        <td>$94.00</td>
                        <td><span className="badge delivered">Delivered</span></td>
                      </tr>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td><strong>{o.id}</strong></td>
                          <td>Amelia Martin (demo)</td>
                          <td>{o.createdAt}</td>
                          <td><strong>${Number(o.total || 0).toFixed(2)}</strong></td>
                          <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Right Column: Sales Overview & Analytics */}
              <div className="sales">
                <div className="panel-top">
                  <div>
                    <h2>Sales Overview</h2>
                    <p>Dynamic Analytics Trend</p>
                  </div>
                  <b>${(metrics.revenue - 20000).toLocaleString()}</b>
                </div>
                <div className="chart">
                  <i style={{ height: '32%' }} />
                  <i style={{ height: '53%' }} />
                  <i style={{ height: '39%' }} />
                  <i style={{ height: '69%' }} />
                  <i style={{ height: '48%' }} />
                  <i style={{ height: '83%' }} />
                  <i className="today" style={{ height: '64%' }} />
                </div>
                <div className="days">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>
                </div>
              </div>
            </div>

            {/* Catalog list + Low Stock Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '18px', marginTop: '18px' }} className="admin-layout">
              {/* Product Catalog List */}
              <div style={{ background: '#fff', border: '1px solid #e5e3df', padding: '22px' }}>
                <h2 style={{ font: '500 17px "Playfair Display"', margin: '0 0 15px' }}>Product Inventory Catalog</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e9e8e4' }}>
                      <th style={{ padding: '8px 5px', color: '#8b8b84' }}>Image</th>
                      <th style={{ padding: '8px 5px', color: '#8b8b84' }}>Name</th>
                      <th style={{ padding: '8px 5px', color: '#8b8b84' }}>Price</th>
                      <th style={{ padding: '8px 5px', color: '#8b8b84' }}>Stock</th>
                      <th style={{ padding: '8px 5px', color: '#8b8b84', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #efeeeb' }}>
                        <td style={{ padding: '8px 5px' }}>
                          <div style={{
                            width: '35px',
                            height: '45px',
                            backgroundImage: `url(${p.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid #efeeeb'
                          }} />
                        </td>
                        <td style={{ padding: '8px 5px' }}>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: '9px', color: '#8b8b84' }}>{p.color} · {p.category}</div>
                        </td>
                        <td style={{ padding: '8px 5px' }}>${p.price}</td>
                        <td style={{ padding: '8px 5px' }}>
                          <span style={{ color: p.stock <= 15 ? 'var(--rust)' : 'inherit', fontWeight: p.stock <= 15 ? 'bold' : 'normal' }}>
                            {p.stock} units
                          </span>
                        </td>
                        <td style={{ padding: '8px 5px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenEditForm(p)}
                            style={{ fontSize: '10px', textDecoration: 'underline', color: 'var(--green)', marginRight: '10px', padding: 0 }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            style={{ fontSize: '10px', textDecoration: 'underline', color: 'var(--rust)', padding: 0 }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Low Stock Alerts */}
              <div className="low-stock" style={{ margin: 0, alignSelf: 'start', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <h2>Low stock notifications</h2>
                  <p>Products that need urgent replenishment</p>
                </div>
                {lowStockProducts.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#777972', padding: '10px', textAlign: 'center' }}>
                    All products are fully stocked. Excellent!
                  </div>
                ) : (
                  lowStockProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                      <div>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: '9px', color: '#bd4e3b' }}>Only {p.stock} left in stock</div>
                      </div>
                      <button onClick={() => handleOpenEditForm(p)} style={{ textDecoration: 'underline', fontSize: '10px' }}>Replenish →</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, trend }) {
  return (
    <div className="metric">
      <p>{label}</p>
      <h2>{value}</h2>
      <span>
        {trend} <i>vs. last week</i>
      </span>
    </div>
  );
}
