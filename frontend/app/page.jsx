'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from './context/AppContext';
import { Header, Footer } from './components/HeaderFooter';
import Link from 'next/link';

function Icon({ name }) {
  const icons = {
    bag: '♧',
    heart: '♡',
    user: '◯',
    search: '⌕',
    arrow: '→',
    plus: '+'
  };
  return <span className={`icon ${name}`}>{icons[name]}</span>;
}

function ProductGrid() {
  const { products, wishlist, addToCart, toggleWishlist, loading } = useApp();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '14px', fontFamily: 'DM Mono' }}>
        <span>Loading curated pieces...</span>
      </div>
    );
  }

  // Filter products by category if selected
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory.toLowerCase())
    : products;

  return (
    <section className="products" id="new">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {selectedCategory ? `${selectedCategory} Collection` : 'Just landed'}
          </p>
          <h2>{selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}` : 'New, now.'}</h2>
        </div>
        {selectedCategory && (
          <Link href="/" className="text-link">
            Shop all arrivals <Icon name="arrow" />
          </Link>
        )}
      </div>
      
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', gridColumn: '1/-1' }}>
          <p style={{ fontSize: '15px', color: '#74746e' }}>No pieces found in this category.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((p, i) => {
            const isWish = wishlist.some(x => x.id === p.id);
            return (
              <article className="product" key={p.id}>
                <div className="product-image" style={{ backgroundImage: `url(${p.image})` }}>
                  <span className="product-tag">{i === 0 ? 'Bestseller' : 'New'}</span>
                  <button
                    className={`wish ${isWish ? 'active' : ''}`}
                    onClick={() => toggleWishlist(p.id)}
                    aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    ♥
                  </button>
                  <button className="quick-add" onClick={() => addToCart(p.id, 1)}>
                    Quick add <Icon name="plus" />
                  </button>
                </div>
                <div className="product-info">
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.type}</p>
                  </div>
                  <strong>${p.price}</strong>
                </div>
                <small>{p.color}</small>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HomeContent() {
  const { showToast } = useApp();

  return (
    <main>
      <Header />
      
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Spring / Summer 2025</p>
          <h1>
            Made for the
            <br />
            <em>in-between</em> moments.
          </h1>
          <p className="hero-text">
            Thoughtfully made pieces for a life lived fully — wherever the day takes you.
          </p>
          <div className="hero-actions">
            <Link href="/?category=women#new" className="button dark">
              Shop women <Icon name="arrow" />
            </Link>
            <Link href="/?category=men#new" className="text-link">
              Shop men <Icon name="arrow" />
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-label">
            <span>01 — The everyday edit</span>
            <span>Scroll to explore ↓</span>
          </div>
        </div>
      </section>

      <section className="categories">
        <Link href="/?category=women#new" className="category cat-one">
          <div>
            <span>For her</span>
            <h2>Women</h2>
            <p>
              Explore collection <Icon name="arrow" />
            </p>
          </div>
        </Link>
        <Link href="/?category=men#new" className="category cat-two">
          <div>
            <span>For him</span>
            <h2>Men</h2>
            <p>
              Explore collection <Icon name="arrow" />
            </p>
          </div>
        </Link>
        <Link href="/?category=kids#new" className="category cat-three">
          <div>
            <span>For little ones</span>
            <h2>Kids & baby</h2>
            <p>
              Explore collection <Icon name="arrow" />
            </p>
          </div>
        </Link>
      </section>

      <ProductGrid />

      <section className="story">
        <div className="story-image"></div>
        <div className="story-copy">
          <p className="eyebrow">Our point of view</p>
          <h2>
            Less, but
            <br />
            <em>better.</em>
          </h2>
          <p>
            We make versatile, enduring clothes with a lighter footprint. Because the best things
            in your wardrobe should feel as good as they look.
          </p>
          <a className="text-link">Our approach <Icon name="arrow" /></a>
          <div className="numbers">
            <div>
              <b>72%</b>
              <span>lower impact materials</span>
            </div>
            <div>
              <b>100%</b>
              <span>made to be reworn</span>
            </div>
          </div>
        </div>
      </section>

      <section className="newsletter">
        <p className="eyebrow">Stay in the know</p>
        <h2>The good kind of inbox.</h2>
        <p>New pieces, fresh ideas, and 10% off your first order.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            showToast('✓ Welcome to MODÉ. Your 10% code is on its way!');
          }}
        >
          <input type="email" required placeholder="Your email address" />
          <button type="submit">
            Join us <Icon name="arrow" />
          </button>
        </form>
      </section>

      <Footer />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '14px', fontFamily: 'DM Mono' }}>
        <span>Loading MODÉ...</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
