'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

const formatDate = (value) => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
}).format(new Date(value));

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function AccountPage() {
  const { user, authLoading, wishlist, authFetch, logout } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/account');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        const response = await authFetch('/api/orders');
        if (response.ok) setOrders(await response.json());
      } catch (error) {
        console.error('Unable to load orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };
    loadOrders();
  }, [user, authFetch]);

  if (authLoading || !user) {
    return <main className="auth-loading">Loading your account…</main>;
  }

  const latestOrder = orders[0];
  const firstName = user.name.split(' ')[0];

  return (
    <main className="dash">
      <header>
        <Link href="/" className="wordmark">MODÉ<span>®</span></Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '12px', textDecoration: 'underline' }}>Back to shop</Link>
          <button onClick={() => { logout(); router.push('/'); }} style={{ fontSize: '12px', textDecoration: 'underline' }}>Sign out</button>
        </div>
      </header>

      <div className="dash-body">
        <aside>
          <p className="eyebrow">My account</p>
          <h2>Welcome back,<br /><em>{firstName}.</em></h2>
          <nav className="side-nav">
            <button onClick={() => setActiveTab('Overview')} className={activeTab === 'Overview' ? 'selected' : ''}>Overview</button>
            <button onClick={() => setActiveTab('Orders')} className={activeTab === 'Orders' ? 'selected' : ''}>Orders <small>{orders.length}</small></button>
            <Link href="/wishlist">Wishlist <small>{wishlist.length}</small></Link>
          </nav>
        </aside>

        <section className="dashboard-content">
          {activeTab === 'Overview' && (
            <>
              <div className="dash-title">
                <div>
                  <p className="eyebrow">Account overview</p>
                  <h1>Good to see you, {firstName}.</h1>
                </div>
              </div>

              {loadingOrders ? (
                <div className="panel" style={{ marginBottom: '25px', textAlign: 'center', padding: '34px' }}>Loading your order details…</div>
              ) : latestOrder ? (
                <div className="status-card" style={{ marginBottom: '25px' }}>
                  <div>
                    <span className="eyebrow">Your latest order</span>
                    <h3>Order #{latestOrder.id}</h3>
                    <p>Placed {formatDate(latestOrder.createdAt)} · {latestOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items · {formatMoney(latestOrder.total)}</p>
                  </div>
                  <div className="shipping">
                    <span>{latestOrder.status}</span>
                    <div className="progress"><i style={{ width: latestOrder.status === 'Processing' ? '30%' : latestOrder.status === 'Shipped' ? '70%' : '100%' }} /></div>
                    <small>{latestOrder.status === 'Processing' ? 'We are preparing your order.' : 'Order progress is up to date.'}</small>
                  </div>
                  <button className="arrow-btn" onClick={() => setActiveTab('Orders')} aria-label="View orders">→</button>
                </div>
              ) : (
                <div className="panel" style={{ marginBottom: '25px', textAlign: 'center', padding: '40px' }}>
                  <h3 style={{ font: '500 20px "Playfair Display"', margin: '0 0 8px' }}>No orders yet</h3>
                  <p style={{ fontSize: '12px', color: '#595a54', margin: '0 0 18px' }}>When you check out, your order history will appear here.</p>
                  <Link href="/" className="button dark">Shop the collection</Link>
                </div>
              )}

              <div className="dash-grid">
                <div className="panel">
                  <div className="panel-top"><h3>Your details</h3></div>
                  <div style={{ marginTop: '24px', fontSize: '13px', lineHeight: '1.8' }}>
                    <strong style={{ display: 'block' }}>{user.name}</strong>
                    <span style={{ color: '#75756d' }}>{user.email}</span>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-top"><h3>Your wishlist</h3><Link href="/wishlist">View wishlist →</Link></div>
                  {wishlist.length ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px', overflowX: 'auto', paddingBottom: '5px' }}>
                      {wishlist.slice(0, 2).map((product) => (
                        <div key={product.id} style={{ minWidth: '110px', fontSize: '11px' }}>
                          <div style={{ height: '115px', backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '6px' }} />
                          <b style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</b>
                          <span style={{ color: '#75756d' }}>{formatMoney(product.price)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty"><span>♡</span><p>Save pieces you love<br />for later.</p><Link href="/" className="outline">Explore arrivals</Link></div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'Orders' && (
            <div>
              <div className="dash-title">
                <div><p className="eyebrow">My history</p><h1>Order history</h1></div>
                <button className="outline" onClick={() => setActiveTab('Overview')}>Back to overview</button>
              </div>
              {loadingOrders ? (
                <div className="panel" style={{ textAlign: 'center', padding: '45px' }}>Loading your orders…</div>
              ) : !orders.length ? (
                <div className="panel" style={{ textAlign: 'center', padding: '55px' }}><p style={{ fontSize: '14px', color: '#595a54' }}>You have not placed any orders yet.</p><Link href="/" className="button dark" style={{ marginTop: '15px' }}>Start shopping</Link></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {orders.map((order) => (
                    <article key={order.id} className="panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #efeeeb', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div><span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.05em', color: '#777972' }}>Order number</span><h3 style={{ font: '500 18px "Playfair Display"', margin: '2px 0 0' }}>#{order.id}</h3></div>
                        <div style={{ textAlign: 'right' }}><span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.05em', color: '#777972' }}>Placed on</span><p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '500' }}>{formatDate(order.createdAt)}</p></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.productId}`} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ width: '50px', height: '60px', backgroundImage: `url(${item.product.image})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #efeeeb' }} />
                            <div style={{ flex: 1 }}><h4 style={{ fontSize: '13px', margin: '0 0 3px', fontWeight: '500' }}>{item.product.name}</h4><p style={{ fontSize: '11px', color: '#74746e', margin: 0 }}>Qty: {item.quantity} · {formatMoney(item.product.price)}</p></div>
                            <span style={{ fontWeight: '500', fontSize: '13px' }}>{formatMoney(item.product.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #efeeeb', marginTop: '16px', paddingTop: '12px' }}><span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span><strong style={{ fontSize: '15px' }}>{formatMoney(order.total)}</strong></div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
