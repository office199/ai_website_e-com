'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from './context/AppContext';
import { Header, Footer } from './components/HeaderFooter';
import Reveal from './components/motion/Reveal';
import { Stagger, StaggerItem } from './components/motion/Stagger';
import Parallax from './components/motion/Parallax';
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
      <div className="py-[100px] text-center font-mono text-[14px]">
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
        <div className="col-span-full py-[50px] text-center">
          <p className="text-[15px] text-[#74746e]">No pieces found in this category.</p>
        </div>
      ) : (
        <Stagger className="product-grid">
          {filteredProducts.map((p) => {
            const isWish = wishlist.some(x => x.id === p.id);
            return (
              <StaggerItem as="article" className="product" key={p.id}>
                <div className="product-image" style={{ backgroundImage: `url(${p.image})` }}>
                  <Link href={`/products/${p.id}`} className="product-cover-link" aria-label={`View ${p.name}`} />
                  <span className="product-tag">{p.stock > 0 ? 'Available' : 'Sold out'}</span>
                  <button
                    className={`wish ${isWish ? 'active' : ''}`}
                    onClick={() => toggleWishlist(p.id)}
                    aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    ♥
                  </button>
                  <button className="quick-add" onClick={() => addToCart(p.id, 1)} disabled={p.stock < 1}>
                    {p.stock > 0 ? 'Quick add' : 'Sold out'} <Icon name="plus" />
                  </button>
                </div>
                <div className="product-info">
                  <div>
                    <h3>
                      <Link href={`/products/${p.id}`}>{p.name}</Link>
                    </h3>
                    <p>{p.type}</p>
                  </div>
                  <strong>${p.price}</strong>
                </div>
                <small>{p.color}</small>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </section>
  );
}

function HomeContent() {
  const { subscribe } = useApp();

  return (
    <main>
      <Header />
      
      <section className="hero">
        <Stagger className="hero-copy">
          <StaggerItem as="p" className="eyebrow">The latest collection</StaggerItem>
          <StaggerItem as="h1">
            Made for the
            <br />
            <em>in-between</em> moments.
          </StaggerItem>
          <StaggerItem as="p" className="hero-text">
            Thoughtfully made pieces for a life lived fully — wherever the day takes you.
          </StaggerItem>
          <StaggerItem as="div" className="hero-actions">
            <Link href="/?category=women#new" className="button dark">
              Shop women <Icon name="arrow" />
            </Link>
            <Link href="/?category=men#new" className="text-link">
              Shop men <Icon name="arrow" />
            </Link>
          </StaggerItem>
        </Stagger>
        <Parallax backgroundImage="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1300&q=85">
          <div className="image-label">
            <span>01 — The everyday edit</span>
            <span>Scroll to explore ↓</span>
          </div>
        </Parallax>
      </section>

      <Stagger className="categories">
        <StaggerItem as="div" className="category cat-one">
          <Link href="/?category=women#new" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', height: '100%' }}>
            <div>
              <span>For her</span>
              <h2>Women</h2>
              <p>
                Explore collection <Icon name="arrow" />
              </p>
            </div>
          </Link>
        </StaggerItem>
        <StaggerItem as="div" className="category cat-two">
          <Link href="/?category=men#new" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', height: '100%' }}>
            <div>
              <span>For him</span>
              <h2>Men</h2>
              <p>
                Explore collection <Icon name="arrow" />
              </p>
            </div>
          </Link>
        </StaggerItem>
        <StaggerItem as="div" className="category cat-three">
          <Link href="/?category=kids#new" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', height: '100%' }}>
            <div>
              <span>For little ones</span>
              <h2>Kids & baby</h2>
              <p>
                Explore collection <Icon name="arrow" />
              </p>
            </div>
          </Link>
        </StaggerItem>
      </Stagger>

      <ProductGrid />

      <section className="story" id="story">
        <Parallax backgroundImage="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1300&q=85" />
        <Reveal className="story-copy" amount={0.3}>
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
              <b>Considered</b>
              <span>materials chosen with care</span>
            </div>
            <div>
              <b>Enduring</b>
              <span>pieces designed to be reworn</span>
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal as="section" className="newsletter" amount={0.3}>
        <p className="eyebrow">Stay in the know</p>
        <h2>The good kind of inbox.</h2>
        <p>New pieces, fresh ideas, and 10% off your first order.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const subscribed = await subscribe(form.elements.email.value);
            if (subscribed) form.reset();
          }}
        >
          <input type="email" name="email" required placeholder="Your email address" />
          <button type="submit">
            Join us <Icon name="arrow" />
          </button>
        </form>
      </Reveal>

      <Footer />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="py-[100px] text-center font-mono text-[14px]">
        <span>Loading MODÉ...</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
