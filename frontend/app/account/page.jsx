'use client';

import Link from 'next/link';
import { useApp, getApiUrl } from '../context/AppContext';
import { useState, useEffect } from 'react';

export default function AccountPage() {
  const { wishlist, userId } = useApp();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(`${getApiUrl()}/api/orders/${userId}`);
        if (res.ok) {
          const data = await res.json();
          // Sort by ID descending or date descending
          setOrders(data.sort((a, b) => b.id.localeCompare(a.id)));
        }
      } catch (err) {
        console.error('Error fetching account orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [userId]);

  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <main className="dash">
      <header>
        <Link href="/" className="wordmark">
          MODÉ<span>®</span>
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '12px', textDecoration: 'underline' }}>Back to Shop</Link>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            Help & support　 <b>AM</b>
          </div>
        </div>
      </header>
      
      <div className="dash-body">
        <aside>
          <p className="eyebrow">My account</p>
          <h2>
            Welcome back,
            <br />
            <em>Amelia.</em>
          </h2>
          <nav className="side-nav">
            <button
              onClick={() => setActiveTab('Overview')}
              className={activeTab === 'Overview' ? 'selected' : ''}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 0 }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('Orders')}
              className={activeTab === 'Orders' ? 'selected' : ''}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 0 }}
            >
              Orders <small>{orders.length}</small>
            </button>
            <Link
              href="/wishlist"
              className={activeTab === 'Wishlist' ? 'selected' : ''}
              style={{ display: 'block' }}
            >
              Wishlist <small>{wishlist.length}</small>
            </Link>
            <a onClick={() => alert('Feature coming soon')} style={{ display: 'block' }}>Addresses</a>
            <a onClick={() => alert('Feature coming soon')} style={{ display: 'block' }}>Profile</a>
            <Link href="/" style={{ display: 'block' }}>Sign out</Link>
          </nav>
        </aside>

        <section className="dashboard-content">
          {activeTab === 'Overview' && (
            <>
              <div className="dash-title">
                <div>
                  <p className="eyebrow">Account overview</p>
                  <h1>Good morning, Amelia.</h1>
                </div>
                <button className="outline" onClick={() => alert('Profile editing coming soon')}>Edit profile</button>
              </div>

              {/* Dynamic Latest Order */}
              {loadingOrders ? (
                <div style={{ padding: '30px', background: '#fff', border: '1px solid var(--line)', marginBottom: '25px', textAlign: 'center' }}>
                  <span>Loading latest order details...</span>
                </div>
              ) : latestOrder ? (
                <div className="status-card" style={{ marginBottom: '25px' }}>
                  <div>
                    <span className="eyebrow">Your latest order</span>
                    <h3>Order #{latestOrder.id}</h3>
                    <p>
                      Placed {latestOrder.createdAt} · {latestOrder.items?.reduce((s, i) => s + i.quantity, 0) || 1} items · ${latestOrder.total?.toFixed(2)}
                    </p>
                  </div>
                  <div className="shipping">
                    <span>{latestOrder.status}</span>
                    <div className="progress">
                      <i style={{ width: latestOrder.status === 'Processing' ? '30%' : '100%' }}></i>
                    </div>
                    <small>
                      {latestOrder.status === 'Processing'
                        ? 'Estimated delivery: 5 business days'
                        : 'Shipped! Tracking details sent to email'}
                    </small>
                  </div>
                  <button className="arrow-btn" onClick={() => setActiveTab('Orders')}>→</button>
                </div>
              ) : (
                <div style={{ padding: '40px', background: 'var(--cream)', border: '1px solid var(--line)', marginBottom: '25px', textAlign: 'center' }}>
                  <h3 style={{ font: '500 18px "Playfair Display"', margin: '0 0 8px' }}>No orders yet</h3>
                  <p style={{ fontSize: '12px', color: '#595a54', margin: '0 0 15px' }}>Explore MODÉ products and make your first order.</p>
                  <Link href="/" className="button dark" style={{ display: 'inline-flex', padding: '10px 14px' }}>Shop Collection</Link>
                </div>
              )}

              <div className="dash-grid">
                {/* Recently Viewed Panel */}
                <div className="panel">
                  <div className="panel-top">
                    <h3>Recently viewed</h3>
                    <Link href="/">View all →</Link>
                  </div>
                  <div className="mini-products">
                    <div>
                      <div className="mini-img one"></div>
                      <b>Essential Blazer</b>
                      <span>$148</span>
                    </div>
                    <div>
                      <div className="mini-img two"></div>
                      <b>Studio Shirt</b>
                      <span>$82</span>
                    </div>
                  </div>
                </div>

                {/* Wishlist Panel */}
                <div className="panel">
                  <div className="panel-top">
                    <h3>Your wishlist</h3>
                    <Link href="/wishlist">View wishlist →</Link>
                  </div>
                  {wishlist.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px', overflowX: 'auto', paddingBottom: '10px' }}>
                      {wishlist.slice(0, 2).map(p => (
                        <div key={p.id} style={{ minWidth: '110px', fontSize: '11px' }}>
                          <div style={{
                            height: '120px',
                            backgroundImage: `url(${p.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            marginBottom: '6px'
                          }} />
                          <b style={{ display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{p.name}</b>
                          <span style={{ color: '#75756d' }}>${p.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">
                      <span>♡</span>
                      <p>
                        Save pieces you love
                        <br />
                        for later.
                      </p>
                      <Link href="/" className="outline" style={{ fontSize: '10px', padding: '8px' }}>
                        Explore new arrivals
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'Orders' && (
            <div>
              <div className="dash-title">
                <div>
                  <p className="eyebrow">My History</p>
                  <h1>Order History</h1>
                </div>
                <button className="outline" onClick={() => setActiveTab('Overview')}>Back to Overview</button>
              </div>

              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Loading historical transactions...</div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', border: '1px solid var(--line)', background: '#fff' }}>
                  <p style={{ fontSize: '14px', color: '#595a54' }}>You have not placed any orders yet.</p>
                  <Link href="/" className="button dark" style={{ display: 'inline-flex', marginTop: '15px' }}>Start Shopping</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {orders.map((o) => (
                    <div key={o.id} style={{ background: '#fff', border: '1px solid var(--line)', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #efeeeb', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777972' }}>Order Number</span>
                          <h3 style={{ font: '500 18px "Playfair Display"', margin: '2px 0 0' }}>#{o.id}</h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#777972' }}>Placed On</span>
                          <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '500' }}>{o.createdAt}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {o.items && o.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{
                              width: '50px',
                              height: '60px',
                              backgroundImage: `url(${item.product?.image || 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=500&q=85'})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              border: '1px solid #efeeeb'
                            }} />
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '13px', margin: '0 0 3px', fontWeight: '500' }}>{item.product?.name || 'Curated Item'}</h4>
                              <p style={{ fontSize: '11px', color: '#74746e', margin: 0 }}>
                                Qty: {item.quantity} · Price: ${item.product?.price || 0}
                              </p>
                            </div>
                            <span style={{ fontWeight: '500', fontSize: '13px' }}>${(item.product?.price || 0) * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #efeeeb', marginTop: '16px', paddingTop: '12px' }}>
                        <span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span>
                        <div>
                          <span style={{ fontSize: '12px', color: '#777972', marginRight: '10px' }}>Total Amount:</span>
                          <strong style={{ fontSize: '15px' }}>${o.total?.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
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
