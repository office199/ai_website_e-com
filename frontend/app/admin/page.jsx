'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getApiUrl, useApp } from '../context/AppContext';

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

export default function AdminOverviewPage() {
  const { user, authFetch } = useApp();
  const [metrics, setMetrics] = useState({ revenue: 0, orders: 0, customers: 0, products: 0, pendingReviews: 0, averageOrderValue: 0, salesByDay: [] });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

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

  useEffect(() => { loadAdminData(); }, [loadAdminData]);

  const lowStockProducts = products.filter((product) => product.stock <= 15);
  const maxDailyRevenue = Math.max(...(metrics.salesByDay || []).map((day) => day.revenue), 1);

  return (
    <>
      <header className="admin-page-head">
        <div>
          <p className="eyebrow">Store management dashboard</p>
          <h1>Welcome, {user?.name?.split(' ')[0] || 'there'}.</h1>
        </div>
        <div className="admin-actions">
          <button onClick={loadAdminData} className="admin-btn ghost" aria-label="Refresh data">Refresh ↻</button>
          <Link href="/admin/products" className="admin-btn primary">+ Add product</Link>
        </div>
      </header>

      {pageError && <div className="auth-error" style={{ marginTop: '24px' }}>{pageError}</div>}
      {loading ? (
        <div className="admin-loading" style={{ padding: '90px 0' }}>Retrieving store data…</div>
      ) : (
        <>
          <div className="metrics">
            <Metric label="Total revenue" value={formatMoney(metrics.revenue)} />
            <Metric label="Orders" value={String(metrics.orders)} />
            <Metric label="Customers" value={String(metrics.customers)} />
            <Metric label="Average order" value={formatMoney(metrics.averageOrderValue)} />
          </div>

          <div className="admin-layout">
            <div className="orders" id="orders">
              <div className="panel-top">
                <div>
                  <h2>Recent orders</h2>
                  <p>Customer checkouts saved in MongoDB</p>
                </div>
                <Link href="#orders" className="admin-link">{orders.length} total</Link>
              </div>
              {!orders.length ? <p className="admin-hint">No orders have been placed yet.</p> : (
                <table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map((order) => (
                  <tr key={order.id}><td><strong>{order.id}</strong></td><td>{order.user?.name || 'Deleted customer'}</td><td>{formatDate(order.createdAt)}</td><td><strong>{formatMoney(order.total)}</strong></td><td><span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span></td></tr>
                ))}</tbody></table>
              )}
            </div>
            <div className="sales">
              <div className="panel-top"><div><h2>Sales overview</h2><p>Revenue over the last seven days</p></div><b>{formatMoney(metrics.revenue)}</b></div>
              <div className="chart">{(metrics.salesByDay || []).map((day, index) => <i key={`${day.label}-${index}`} className={index === (metrics.salesByDay?.length || 0) - 1 ? 'today' : ''} title={`${day.label}: ${formatMoney(day.revenue)}`} style={{ height: `${Math.max((day.revenue / maxDailyRevenue) * 100, 3)}%` }} />)}</div>
              <div className="days">{(metrics.salesByDay || []).map((day, index) => <span key={`${day.label}-${index}`}>{day.label}</span>)}</div>
            </div>
          </div>

          <div className="admin-overview-grid">
            <div className="admin-panel">
              <div className="panel-top">
                <h2>Quick links</h2>
                <p>Jump straight into store management</p>
              </div>
              <div className="quick-link-grid">
                <QuickLink href="/admin/users" icon="👥" label="Users" sub={`${metrics.customers} customers`} />
                <QuickLink href="/admin/products" icon="◈" label="Products" sub={`${metrics.products || products.length} listed`} />
                <QuickLink href="/admin/categories" icon="▣" label="Categories" sub="Manage taxonomy" />
                <QuickLink href="/admin/coupons" icon="✦" label="Coupons" sub="Discount codes" />
                <QuickLink href="/admin/reviews" icon="★" label="Reviews" sub={`${metrics.pendingReviews} pending`} alert={metrics.pendingReviews > 0} />
                <QuickLink href="/admin#orders" icon="⌗" label="Orders" sub={`${metrics.orders} placed`} />
              </div>
            </div>
            <div className="low-stock">
              <div><h2>Low stock notifications</h2><p>Products with 15 units or fewer</p></div>
              {!lowStockProducts.length ? <div className="admin-hint center">No low-stock products right now.</div> : lowStockProducts.map((product) => (
                <div key={product.id} className="low-stock-row">
                  <div><strong>{product.name}</strong><span>Only {product.stock} left in stock</span></div>
                  <Link href="/admin/products" className="admin-link">Update →</Link>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Metric({ label, value }) {
  return <div className="metric"><p>{label}</p><h2>{value}</h2><span>Live database total</span></div>;
}

function QuickLink({ href, icon, label, sub, alert }) {
  return (
    <Link href={href} className={`quick-link${alert ? ' alert' : ''}`}>
      <span className="quick-link-icon">{icon}</span>
      <span className="quick-link-copy"><strong>{label}</strong><small>{sub}</small></span>
      <span className="quick-link-arrow">→</span>
    </Link>
  );
}
