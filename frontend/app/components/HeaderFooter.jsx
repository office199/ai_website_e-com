'use client';

import Link from 'next/link';
import { useApp } from '../context/AppContext';

function Icon({ name }) {
  const icons = {
    bag: '♧',
    heart: '♡',
    user: '◯',
    search: '⌕',
  };
  return <span className={`icon ${name}`}>{icons[name]}</span>;
}

export function Header() {
  const { cart, wishlist, user, authLoading, logout } = useApp();
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
          {user && <Link href="/account">My account</Link>}
          {user?.role === 'admin' && <Link href="/admin">Admin</Link>}
        </div>
        <div className="actions">
          <button aria-label="Search"><Icon name="search" /></button>
          <Link href={user ? '/wishlist' : '/login?next=/wishlist'} aria-label="Wishlist" style={{ position: 'relative', display: 'inline-block', padding: '4px' }}>
            <Icon name="heart" />
            {user && wishlist.length > 0 && <i>{wishlist.length}</i>}
          </Link>
          {authLoading ? null : user ? (
            <Link href="/account" aria-label="Account" style={{ display: 'inline-block', padding: '4px' }}><Icon name="user" /></Link>
          ) : (
            <Link href="/login" className="auth-nav-link">Sign in</Link>
          )}
          {user && <button className="signout-link hide-mobile" onClick={logout}>Sign out</button>}
          <Link href={user ? '/cart' : '/login?next=/cart'} className="bag-button" aria-label="Bag">
            <Icon name="bag" />
            <b>Bag ({user ? cartCount : 0})</b>
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
        <Link href="/" className="wordmark">MODÉ<span>®</span></Link>
        <p>Better everyday things,<br />for every kind of day.</p>
      </div>
      <div className="footer-links">
        <div>
          <b>Shop</b>
          <Link href="/?category=women#new">Women</Link>
          <Link href="/?category=men#new">Men</Link>
          <Link href="/?category=kids#new">Kids & baby</Link>
        </div>
        <div>
          <b>About</b>
          <a href="#story">Our story</a>
          <a href="#">Materials</a>
          <a href="#">Journal</a>
        </div>
        <div>
          <b>Account</b>
          <Link href={"/account"}>My account</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/login">Sign in</Link>
        </div>
      </div>
      <small>© {new Date().getFullYear()} MODÉ. All rights reserved.</small>
    </footer>
  );
}
