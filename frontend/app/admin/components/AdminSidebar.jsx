'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { cx } from './AdminUI';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard', match: '/admin', exact: true },
  { href: '/admin/users', label: 'Users', icon: 'group', match: '/admin/users', badge: 'customers' },
  { href: '/admin/products', label: 'Products', icon: 'inventory_2', match: '/admin/products', badge: 'products' },
  { href: '/admin/categories', label: 'Category', icon: 'category', match: '/admin/categories' },
  { href: '/admin/reviews', label: 'Review', icon: 'reviews', match: '/admin/reviews', badge: 'pendingReviews' },
  { href: '/admin/coupons', label: 'Coupon', icon: 'confirmation_number', match: '/admin/coupons' },
  { href: '/admin/orders', label: 'Orders', icon: 'shopping_cart', match: '/admin/orders', badge: 'orders' },
];

function badgeContent(item, metrics) {
  if (!item.badge || !metrics) return null;
  const value = metrics[item.badge];
  if (item.badge === 'pendingReviews') return value > 0 ? value : null;
  return Number.isFinite(Number(value)) ? value : null;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, authFetch, logout } = useApp();
  const [metrics, setMetrics] = useState(null);

  const loadMetrics = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/metrics');
      if (response.ok) setMetrics(await response.json());
    } catch {
      // Decorative counts only.
    }
  }, [authFetch]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics, pathname]);

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.match);
  };

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-50 h-screen w-[260px] flex-col border-r border-[#c6c6cd] bg-[#f6f3f5]">
      <div className="px-6 py-8">
        <Link href="/admin" className="block">
          <h1 className="font-geist text-[24px] font-bold leading-8 tracking-[-0.01em] text-[#1b1b1d]">StoreAdmin</h1>
          <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Management Portal</p>
        </Link>
      </div>

      <nav className="admin-scrollbar flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((item) => {
          const active = isActive(item);
          const badge = badgeContent(item, metrics);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                'group relative flex items-center gap-3 rounded-r-lg px-4 py-3 transition-colors',
                active
                  ? 'border-l-4 border-[#0058be] bg-[#2170e4]/10 pl-3 text-[#0058be]'
                  : 'text-[#45464d] hover:bg-[#eae7e9] hover:text-[#1b1b1d]'
              )}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em]">{item.label}</span>
              {badge !== null ? (
                <span className={cx(
                  'ml-auto rounded-full px-2 py-0.5 font-geist text-[11px] font-semibold',
                  item.badge === 'pendingReviews' ? 'bg-red-50 text-red-700' : 'bg-[#e4e2e4] text-[#45464d]'
                )}>
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#c6c6cd] px-3 py-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[#45464d] transition-colors hover:bg-[#eae7e9] hover:text-[#1b1b1d]">
          <span className="material-symbols-outlined text-[22px]">settings</span>
          <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em]">Settings</span>
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]"
          onClick={logout}
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em]">Logout</span>
        </button>

        <div className="mt-4 flex items-center gap-3 px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c6c6cd] bg-white font-geist text-[12px] font-bold text-[#0058be]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-geist text-[12px] font-semibold uppercase tracking-[0.06em] text-[#1b1b1d]">{user?.name || 'Admin User'}</p>
            <p className="truncate text-[11px] text-[#6f7280]">{user?.role === 'admin' ? 'Super Admin' : 'Store Manager'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
