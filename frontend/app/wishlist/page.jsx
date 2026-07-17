'use client';

import { useApp } from '../context/AppContext';
import { Header, Footer } from '../components/HeaderFooter';
import Link from 'next/link';

function Icon({ name }) {
  const icons = {
    bag: '♧',
    heart: '♡',
    arrow: '→',
    plus: '+'
  };
  return <span className={`icon ${name}`}>{icons[name]}</span>;
}

export default function WishlistPage() {
  const { wishlist, addToCart, toggleWishlist, loading } = useApp();

  const handleMoveToBag = (productId) => {
    addToCart(productId, 1);
    // Optionally remove from wishlist after adding to bag
    toggleWishlist(productId);
  };

  return (
    <main>
      <Header />

      <section style={{ padding: '60px 4vw', minHeight: '60vh', maxWidth: '1440px', margin: '0 auto' }}>
        <p className="eyebrow" style={{ margin: '0 0 10px' }}>Your Saved Pieces</p>
        <h1 style={{ font: '500 42px "Playfair Display"', margin: '0 0 40px', letterSpacing: '-0.03em' }}>
          My Wishlist
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '14px', fontFamily: 'DM Mono' }}>
            <span>Loading saved pieces...</span>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="empty" style={{ border: '1px solid var(--line)', padding: '60px 20px', background: '#fff' }}>
            <span style={{ fontSize: '40px' }}>♡</span>
            <p style={{ fontSize: '15px', margin: '15px 0' }}>Save pieces you love for later.</p>
            <Link href="/" className="button dark" style={{ display: 'inline-flex', margin: '10px auto' }}>
              Explore New Arrivals
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {wishlist.map((product) => (
              <article className="product" key={product.id}>
                <div className="product-image" style={{ backgroundImage: `url(${product.image})` }}>
                  <button
                    className="wish active"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label="Remove from wishlist"
                  >
                    ♥
                  </button>
                  <button className="quick-add" onClick={() => handleMoveToBag(product.id)}>
                    Add to Bag <Icon name="plus" />
                  </button>
                </div>
                <div className="product-info">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.type}</p>
                  </div>
                  <strong>${product.price}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <small>{product.color}</small>
                  <button
                    onClick={() => handleMoveToBag(product.id)}
                    style={{
                      fontSize: '11px',
                      textDecoration: 'underline',
                      color: 'var(--green)',
                      fontWeight: '500',
                      padding: 0
                    }}
                    className="hide-mobile"
                  >
                    Move to Bag →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
