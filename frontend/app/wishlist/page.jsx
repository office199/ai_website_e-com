'use client';

import { useApp } from '../context/AppContext';
import { Header, Footer } from '../components/HeaderFooter';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const { wishlist, addToCart, toggleWishlist, loading, isAuthenticated, authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login?next=/wishlist');
  }, [authLoading, isAuthenticated, router]);

  const handleMoveToBag = async (productId) => {
    const added = await addToCart(productId, 1);
    if (added) await toggleWishlist(productId);
  };

  if (authLoading || !isAuthenticated) {
    return <main className="auth-loading">Loading your wishlist…</main>;
  }

  return (
    <main>
      <Header />

      <section className="mx-auto min-h-[60vh] max-w-[1440px] px-[4vw] py-[60px]">
        <p className="eyebrow mb-[10px]">Your Saved Pieces</p>
        <h1 className="mb-[40px] font-display text-[42px] font-medium tracking-[-0.03em]">
          My Wishlist
        </h1>

        {loading ? (
          <div className="py-[100px] text-center font-mono text-[14px]">
            <span>Loading saved pieces...</span>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="empty border border-line bg-white px-[20px] py-[60px]">
            <span className="text-[40px]">♡</span>
            <p className="my-[15px] text-[15px]">Save pieces you love for later.</p>
            <Link href="/" className="button dark mx-auto my-[10px] inline-flex">
              Explore New Arrivals
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {wishlist.map((product) => (
              <article className="product" key={product.id}>
                <div className="product-image" style={{ backgroundImage: `url(${product.image})` }}>
                  <Link href={`/products/${product.id}`} className="product-cover-link" aria-label={`View ${product.name}`} />
                  <button
                    className="wish active"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label="Remove from wishlist"
                  >
                    ♥
                  </button>
                  <button className="quick-add" onClick={() => handleMoveToBag(product.id)} disabled={product.stock < 1}>
                    {product.stock > 0 ? 'Add to Bag' : 'Sold out'} <Icon name="plus" />
                  </button>
                </div>
                <div className="product-info">
                  <div>
                    <h3>
                      <Link href={`/products/${product.id}`}>{product.name}</Link>
                    </h3>
                    <p>{product.type}</p>
                  </div>
                  <strong>${product.price}</strong>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <small>{product.color}</small>
                  <button
                    onClick={() => handleMoveToBag(product.id)}
                    disabled={product.stock < 1}
                    className="hide-mobile p-0 text-[11px] font-medium text-green underline"
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
