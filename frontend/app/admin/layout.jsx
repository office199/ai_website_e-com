'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import AdminSidebar from './components/AdminSidebar';
import { AdminMobileNav, AdminTopbar } from './components/AdminTopbar';

export default function AdminLayout({ children }) {
  const { user, authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/admin');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/account');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || user.role !== 'admin') {
    return <main className="auth-loading">Checking account access…</main>;
  }

  return (
    <div className="admin-portal min-h-screen bg-[#fcf8fa] text-[#1b1b1d]">
      <AdminSidebar />
      <div className="min-h-screen lg:ml-[260px]">
        <AdminTopbar />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-6 sm:px-6 lg:px-6">{children}</main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
