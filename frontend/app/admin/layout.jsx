'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import AdminSidebar from './components/AdminSidebar';

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
    <main className="admin">
      <AdminSidebar />
      <section className="admin-main">{children}</section>
    </main>
  );
}
