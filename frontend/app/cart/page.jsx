'use client';

import { useApp } from '../context/AppContext';
import { Header, Footer } from '../components/HeaderFooter';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, checkout } = useApp();
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const router = useRouter();

  const subtotal = cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shippingThreshold = 100;
  const shippingCost = subtotal >= shippingThreshold || subtotal === 0 ? 0 : 12;
  const total = subtotal + shippingCost;

  const handleQtyChange = (productId, currentQty, delta) => {
    updateCartQuantity(productId, currentQty + delta);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    const order = await checkout(total);
    setCheckingOut(false);
    if (order) {
      setOrderSuccess(order);
    }
  };

  return (
    <main>
      <Header />
      
      <section style={{ padding: '60px 4vw', minHeight: '60vh', maxWidth: '1440px', margin: '0 auto' }}>
        <p className="eyebrow" style={{ margin: '0 0 10px' }}>Your shopping bag</p>
        <h1 style={{ font: '500 42px "Playfair Display"', margin: '0 0 40px', letterSpacing: '-0.03em' }}>
          Shopping Bag
        </h1>

        {orderSuccess ? (
          <div style={{
            background: 'var(--green)',
            color: '#fff',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '40px auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}>✓</span>
            <h2 style={{ font: '500 28px "Playfair Display"', margin: '0 0 10px' }}>Order Confirmed!</h2>
            <p style={{ fontSize: '14px', color: '#c9d2c9', margin: '0 0 24px', lineHeight: '1.6' }}>
              Thank you for shopping with MODÉ. Your order <strong>{orderSuccess.id}</strong> has been successfully placed. We have sent a confirmation email.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <Link href="/account" className="button dark" style={{ background: '#fff', color: 'var(--ink)' }}>
                View Orders →
              </Link>
              <Link href="/" className="button" style={{ border: '1px solid #fff', color: '#fff' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="empty" style={{ border: '1px solid var(--line)', padding: '60px 20px', background: '#fff' }}>
            <span>♧</span>
            <p style={{ fontSize: '15px', margin: '15px 0' }}>Your shopping bag is currently empty.</p>
            <Link href="/" className="button dark" style={{ display: 'inline-flex', margin: '10px auto' }}>
              Explore New Arrivals
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '40px' }} className="admin-layout">
            {/* Cart Items List */}
            <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                    <th style={{ padding: '12px 8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#777972' }}>Product</th>
                    <th style={{ padding: '12px 8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#777972', textAlign: 'center' }}>Quantity</th>
                    <th style={{ padding: '12px 8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#777972', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => {
                    const product = item.product || {};
                    return (
                      <tr key={item.productId} style={{ borderBottom: '1px solid #efeeeb' }}>
                        <td style={{ padding: '20px 8px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '100px',
                            backgroundImage: `url(${product.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid #efeeeb'
                          }} />
                          <div>
                            <h3 style={{ fontSize: '14px', margin: '0 0 4px', fontWeight: '500' }}>{product.name}</h3>
                            <p style={{ fontSize: '11px', color: '#74746e', margin: '0 0 8px' }}>
                              {product.color} · {product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              style={{ fontSize: '11px', textDecoration: 'underline', color: 'var(--rust)', padding: 0 }}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '20px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--line)', background: 'var(--paper)' }}>
                            <button
                              onClick={() => handleQtyChange(item.productId, item.quantity, -1)}
                              style={{ padding: '6px 12px', fontSize: '14px', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <span style={{ padding: '0 12px', fontSize: '13px', minWidth: '30px', display: 'inline-block' }}>{item.quantity}</span>
                            <button
                              onClick={() => handleQtyChange(item.productId, item.quantity, 1)}
                              style={{ padding: '6px 12px', fontSize: '14px', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '20px 8px', textAlign: 'right', fontWeight: '500', fontSize: '14px' }}>
                          ${(product.price || 0) * item.quantity}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '20px' }}>
                <Link href="/" style={{ fontSize: '12px', borderBottom: '1px solid var(--ink)', paddingBottom: '3px' }}>
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div style={{ alignSelf: 'start' }}>
              <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', padding: '30px' }}>
                <h2 style={{ font: '500 20px "Playfair Display"', margin: '0 0 20px' }}>Order Summary</h2>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '15px 0', borderBottom: '1px solid #e4e1d8', paddingBottom: '12px' }}>
                  <span style={{ color: '#595a54' }}>Subtotal</span>
                  <span style={{ fontWeight: '500' }}>${subtotal}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '15px 0', borderBottom: '1px solid #e4e1d8', paddingBottom: '12px' }}>
                  <span style={{ color: '#595a54' }}>Shipping</span>
                  <span>{shippingCost === 0 ? 'Complimentary' : `$${shippingCost}`}</span>
                </div>
                
                {shippingCost > 0 && (
                  <p style={{ fontSize: '10px', color: 'var(--rust)', margin: '-8px 0 15px', fontStyle: 'italic' }}>
                    Add ${shippingThreshold - subtotal} more for complimentary shipping.
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '600', margin: '25px 0 30px' }}>
                  <span>Total (USD)</span>
                  <span style={{ fontSize: '18px' }}>${total}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="button dark"
                  style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '13px', fontWeight: '500', letterSpacing: '0.05em' }}
                >
                  {checkingOut ? 'Processing Checkout...' : 'Proceed to Checkout'}
                </button>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#595a54', margin: 0, lineHeight: '1.5' }}>
                    Security and privacy guaranteed. Easy 30-day returns of unworn items.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
