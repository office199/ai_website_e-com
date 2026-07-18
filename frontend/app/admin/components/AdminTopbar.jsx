'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

const SEARCH_HINTS = {
  '/admin': 'Search analytics, orders, or users...',
  '/admin/users': 'Search users, roles or activity...',
  '/admin/products': 'Search products, SKUs...',
  '/admin/categories': 'Search categories...',
  '/admin/reviews': 'Search reviews...',
  '/admin/coupons': 'Search orders, coupons...',
  '/admin/orders': 'Search orders, coupons...',
};

function getSearchHint(pathname) {
  if (pathname in SEARCH_HINTS) return SEARCH_HINTS[pathname];
  return 'Search admin data...';
}

export function AdminTopbar() {
  const pathname = usePathname();
  const { user } = useApp();

  const name = user?.name || 'Admin User';
  const role = user?.role === 'admin' ? 'Dashboard Manager' : 'Store Manager';
  const initials = useMemo(
    () => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    [name],
  );

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#c6c6cd] bg-[#fcf8fa]/95 px-6 backdrop-blur lg:px-6">
      <div className="flex flex-1 items-center gap-4">
        <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#f0edef] lg:hidden" type="button" aria-label="Open navigation menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="relative hidden w-full max-w-md md:block">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#76777d]">search</span>
          <input
            className="w-full rounded-full border border-transparent bg-[#f6f3f5] py-2 pl-10 pr-4 text-[14px] text-[#1b1b1d] outline-none transition placeholder:text-[#76777d] focus:border-[#2170e4] focus:bg-white focus:ring-2 focus:ring-[#2170e4]/20"
            placeholder={getSearchHint(pathname)}
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-[#45464d] transition hover:bg-[#f0edef]" type="button" aria-label="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ba1a1a]" />
        </button>

        <div className="hidden h-8 w-px bg-[#c6c6cd] sm:block" />

        <Link href="/account" className="flex items-center gap-3 rounded-full p-1 transition hover:bg-[#f0edef]">
          <div className="hidden text-right sm:block">
            <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.06em] text-[#1b1b1d]">{name}</p>
            <p className="text-[11px] text-[#6f7280]">{role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c6c6cd] bg-white font-geist text-[12px] font-bold text-[#0058be]">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  const items = [
    { href: '/admin', label: 'Home', icon: 'dashboard' },
    { href: '/admin/orders', label: 'Orders', icon: 'shopping_cart' },
    { href: '/admin/users', label: 'Users', icon: 'group' },
    { href: '/admin/products', label: 'Products', icon: 'inventory_2' },
    { href: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-[#c6c6cd] bg-[#fcf8fa] lg:hidden">
      {items.map((item) => {
        const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? 'flex flex-col items-center gap-1 text-[#0058be]' : 'flex flex-col items-center gap-1 text-[#76777d]'}>
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="font-geist text-[10px] font-semibold uppercase tracking-[0.08em]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
