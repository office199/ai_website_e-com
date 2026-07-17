'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp, getApiUrl } from '../../context/AppContext';
import { Header, Footer } from '../../components/HeaderFooter';

function Icon({ name }) {
  const icons = {
    heart: '♡',
    arrow: '→',
    plus: '+',
    minus: '–',
  };
  return <span className={`icon ${name}`}>{icons[name]}</span>;
}

const capitalise = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

function RelatedCard({ product }) {
  const { wishlist, addToCart, toggleWishlist } = useApp();
  const isWish = wishlist.some((x) => x.id === product.id);

  return (
    <article className="product" key={product.id}>
      <div className="product-image" style={{ backgroundImage: `url(${product.image})` }}>
        <Link href={`/products/${product.id}`} className="product-cover-link" aria-label={`View ${product.name}`} />
        <span className="product-tag">{product.stock > 0 ? 'Available' : 'Sold out'}</span>
        <button
          className={`wish ${isWish ? 'active' : ''}`}
          onClick={() => toggleWishlist(product.id)}
          aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          ♥
        </button>
        <button className="quick-add" onClick={() => addToCart(product.id, 1)} disabled={product.stock < 1}>
          {product.stock > 0 ? 'Quick add' : 'Sold out'} <Icon name="plus" />
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
      <small>{product.color}</small>
    </article>
  );
}

function ProductDetails() {
  const { id } = useParams();
  const { products, wishlist, addToCart, toggleWishlist } = useApp();

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const loadProduct = async () => {
      setStatus('loading');
      setProduct(null);
      setQuantity(1);
      try {
        const response = await fetch(`${getApiUrl()}/api/products/${id}`);
        if (response.status === 404) {
          if (!cancelled) setStatus('missing');
          return;
        }
        if (!response.ok) throw new Error('Unable to load product');
        const data = await response.json();
        if (!cancelled) {
          setProduct(data);
          setStatus('ready');
        }
      } catch (error) {
        console.error('Unable to load product:', error);
        if (!cancelled) setStatus('error');
      }
    };

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const related = useMemo(() => {
    if (!product) return [];
    return products
      .filter((item) => item.id !== product.id && item.category === product.category)
      .concat(products.filter((item) => item.id !== product.id && item.category !== product.category))
      .slice(0, 4);
  }, [products, product]);

  const isWish = product ? wishlist.some((item) => item.id === product.id) : false;
  const maxQuantity = product ? Math.max(product.stock, 1) : 1;
  const soldOut = !product || product.stock < 1;
  const lowStock = product && product.stock > 0 && product.stock <= 5;

  const handleAddToBag = async () => {
    if (!product || soldOut || adding) return;
    setAdding(true);
    await addToCart(product.id, quantity);
    setAdding(false);
  };

  return (
    <main>
      <Header />

      {status === 'loading' && (
        <div className="pdp-loading">
          <span>Loading piece…</span>
        </div>
      )}

      {status === 'missing' && (
        <div className="pdp-missing">
          <p className="eyebrow" style={{ marginBottom: '14px' }}>Out of view</p>
          <h1 style={{ font: '500 42px "Playfair Display"', letterSpacing: '-0.03em', margin: '0 0 14px' }}>
            We could not find that piece.
          </h1>
          <p style={{ fontSize: '14px', color: '#74746e', margin: '0 0 26px' }}>
            It may have sold out or been retired from the collection.
          </p>
          <Link href="/#new" className="button dark">
            Browse new arrivals <Icon name="arrow" />
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="pdp-missing">
          <p className="eyebrow" style={{ marginBottom: '14px' }}>Connection issue</p>
          <h1 style={{ font: '500 42px "Playfair Display"', letterSpacing: '-0.03em', margin: '0 0 14px' }}>
            We could not load this piece right now.
          </h1>
          <p style={{ fontSize: '14px', color: '#74746e', margin: '0 0 26px' }}>
            Please check your connection and try again.
          </p>
          <button className="button dark" onClick={() => window.location.reload()}>
            Try again <Icon name="arrow" />
          </button>
        </div>
      )}

      {status === 'ready' && product && (
        <>
          <section className="pdp">
            <nav className="pdp-crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href={`/?category=${product.category}#new`}>{capitalise(product.category)}</Link>
              <span>/</span>
              <span aria-current="page">{product.name}</span>
            </nav>

            <div className="pdp-grid">
              <div
                className="pdp-media"
                style={{ backgroundImage: `url(${product.image})` }}
                role="img"
                aria-label={product.name}
              >
                <span className="product-tag">{soldOut ? 'Sold out' : 'Available'}</span>
                <button
                  className={`pdp-wish ${isWish ? 'active' : ''}`}
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  ♥
                </button>
                <span className="pdp-image-label">
                  {capitalise(product.category)} — {product.color}
                </span>
              </div>

              <div className="pdp-info">
                <p className="eyebrow">{capitalise(product.category)} collection</p>
                <h1>{product.name}</h1>
                <p className="pdp-type">{product.type}</p>

                <div className="pdp-price">
                  ${product.price}
                  <small>USD</small>
                </div>

                <hr className="pdp-divider" />

                <p className="pdp-desc">
                  A considered take on the everyday {product.type.toLowerCase()}, rendered in {product.color.toLowerCase()}.
                  Thoughtfully made from materials chosen with care — designed to be worn on repeat and to last,
                  season after season.
                </p>

                <ul className="pdp-attrs">
                  <li>
                    <b>Colour</b>
                    <span>{product.color}</span>
                  </li>
                  <li>
                    <b>Category</b>
                    <span>{capitalise(product.category)}</span>
                  </li>
                  <li>
                    <b>Style</b>
                    <span>{product.type}</span>
                  </li>
                  <li>
                    <b>Reference</b>
                    <span>MO-{product.id.slice(-6).toUpperCase()}</span>
                  </li>
                </ul>

                <p className={`pdp-stock ${soldOut ? 'out' : lowStock ? 'low' : ''}`}>
                  <i />
                  {soldOut
                    ? 'Currently sold out'
                    : lowStock
                      ? `Low stock — only ${product.stock} left`
                      : 'In stock and ready to ship'}
                </p>

                <div className="pdp-buy">
                  <div className="pdp-qty" aria-label="Quantity">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={soldOut || quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Icon name="minus" />
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                      disabled={soldOut || quantity >= maxQuantity}
                      aria-label="Increase quantity"
                    >
                      <Icon name="plus" />
                    </button>
                  </div>
                  <button className="button dark pdp-add" onClick={handleAddToBag} disabled={soldOut || adding}>
                    {soldOut ? 'Sold out' : adding ? 'Adding…' : 'Add to bag'}
                  </button>
                </div>

                <button className={`outline pdp-save ${isWish ? 'saved' : ''}`} onClick={() => toggleWishlist(product.id)}>
                  {isWish ? '♥ Saved to your wishlist' : '♡ Save to wishlist'}
                </button>

                <details className="pdp-acc" open>
                  <summary>Materials & care</summary>
                  <p>
                    Made with considered materials selected for softness, durability and a lighter footprint.
                    Machine wash cold with like colours, line dry and iron on low heat if needed. Do not bleach.
                  </p>
                </details>
                <details className="pdp-acc">
                  <summary>Shipping & returns</summary>
                  <p>
                    Complimentary shipping on orders over $100 — a flat $12 otherwise. Easy 30-day returns on
                    unworn items with tags attached. Orders placed before 2pm ship the same business day.
                  </p>
                </details>

                <div className="pdp-perks">
                  <span>Free shipping over $100</span>
                  <span>Easy 30-day returns</span>
                  <span>Made to last</span>
                </div>
              </div>
            </div>
          </section>

          {related.length > 0 && (
            <section className="pdp-related">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Complete the look</p>
                  <h2>You may also like.</h2>
                </div>
                <Link href={`/?category=${product.category}#new`} className="text-link">
                  Shop {product.category} <Icon name="arrow" />
                </Link>
              </div>
              <div className="product-grid">
                {related.map((item) => (
                  <RelatedCard product={item} key={item.id} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Footer />
    </main>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <main>
          <div className="pdp-loading">
            <span>Loading piece…</span>
          </div>
        </main>
      }
    >
      <ProductDetails />
    </Suspense>
  );
}
