'use client';

import Link from 'next/link';
import { useApp } from '../context/AppContext';

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

export function Header() {
  const { cart, wishlist } = useApp();

  // Sum of quantities of items in cart
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header style={{ width: '100%' }}>
      <div className="announcement">
        <span>Complimentary shipping on orders over $100</span>
        <span className="hide-mobile">Easy 30-day returns · Made to last</span>
        <span>USD / EN⌄</span>
      </div>
      <nav>
        <Link href="/" className="wordmark">
          MODÉ<span>®</span>
        </Link>
        <div className="desktop-links">
          <Link href="/#new">New arrivals</Link>
          <Link href="/?category=women#new">Women</Link>
          <Link href="/?category=men#new">Men</Link>
          <Link href="/?category=kids#new">Kids & baby</Link>
          <Link href="/account">My Orders</Link>
          <Link href="/admin">Admin Console</Link>
        </div>
        <div className="actions">
          <button aria-label="Search">
            <Icon name="search" />
          </button>
          
          <Link href="/wishlist" aria-label="Wishlist" style={{ position: 'relative', display: 'inline-block', padding: '4px' }}>
            <Icon name="heart" />
            {wishlist.length > 0 && <i>{wishlist.length}</i>}
          </Link>
          
          <Link href="/account" aria-label="Account" style={{ display: 'inline-block', padding: '4px' }}>
            <Icon name="user" />
          </Link>
          
          <Link href="/cart" className="bag-button" aria-label="Bag">
            <Icon name="bag" />
            <b>Bag ({cartCount})</b>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div>
        <Link href="/" className="wordmark">
          MODÉ<span>®</span>
        </Link>
        <p>
          Better everyday things,
          <br />
          for every kind of day.
        </p>
      </div>
      <div className="footer-links">
        <div>
          <b>Shop</b>
          <Link href="/?category=women#new">Women</Link>
          <Link href="/?category=men#new">Men</Link>
          <Link href="/?category=kids#new">Kids & baby</Link>
          <a href="#">Gift cards</a>
        </div>
        <div>
          <b>About</b>
          <a href="#">Our story</a>
          <a href="#">Materials</a>
          <a href="#">Journal</a>
          <a href="#">Careers</a>
        </div>
        <div>
          <b>Help</b>
          <a href="#">Shipping & returns</a>
          <a href="#">Contact</a>
          <a href="#">Size guide</a>
          <a href="#">FAQ</a>
        </div>
      </div>
      <small>© 2025 MODÉ. All rights reserved.</small>
    </footer>
  );
}
