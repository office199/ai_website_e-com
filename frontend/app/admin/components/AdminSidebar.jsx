'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

const NAV = [
  { href: '/admin', label: 'Overview', icon: '▦', match: '/admin' },
  { href: '/admin/users', label: 'Users', icon: '👥', match: '/admin/users', badge: 'customers' },
  { href: '/admin/products', label: 'Products', icon: '◈', match: '/admin/products', badge: 'products' },
  { href: '/admin/categories', label: 'Categories', icon: '▣', match: '/admin/categories' },
  { href: '/admin/coupons', label: 'Coupons', icon: '✦', match: '/admin/coupons' },
  { href: '/admin/reviews', label: 'Reviews', icon: '★', match: '/admin/reviews', badge: 'pendingReviews' },
  { href: '/admin', label: 'Orders', icon: '⌗', match: '/admin#orders', badge: 'orders', hash: '#orders' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, authFetch } = useApp();
  const [counts, setCounts] = useState(null);

  const loadCounts = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/metrics');
      if (res.ok) setCounts(await res.json());
    } catch (error) {
      // Counts are decorative; ignore failures.
    }
  }, [authFetch]);

  // Refetch the lightweight metrics whenever the admin section changes so badges stay fresh.
  useEffect(() => { loadCounts(); }, [loadCounts, pathname]);

  const isActive = (item) => {
    if (item.match === '/admin') return pathname === '/admin';
    return pathname.startsWith(item.match);
  };

  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="admin-side">
      <Link href="/" className="wordmark">MODÉ<span>®</span></Link>
      <p>ADMIN CONSOLE</p>
      <nav>
        {NAV.map((item) => {
          const count = item.badge && counts ? counts[item.badge] : null;
          const showBadge = item.badge === 'pendingReviews' ? count > 0 : Number.isFinite(Number(count));
          const linkProps = item.hash ? { href: `/admin${item.hash}` } : { href: item.href };
          return (
            <Link
              key={item.label}
              {...linkProps}
              className={isActive(item) && !item.hash ? 'current' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {showBadge ? <small className={item.badge === 'pendingReviews' ? 'alert' : ''}>{count}</small> : null}
            </Link>
          );
        })}
      </nav>
      <div className="admin-user">
        <i>{initials}</i>
        <span>{user?.name}<small>Store administrator</small></span>
      </div>
    </aside>
  );
}
