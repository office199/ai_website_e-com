'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiUrl, useApp } from '../context/AppContext';
import {
  ActionButton,
  AdminPageHead,
  EmptyState,
  MiniBar,
  PageError,
  Pill,
  RowSpinner,
  StatCard,
  SurfaceCard,
  TableWrap,
  TrendBadge,
  formatCompactMoney,
  formatDate,
  formatMoney,
  formatNumber,
} from './components/AdminUI';

function createLinePath(values, width, height, padding = 18) {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  const step = values.length === 1 ? width - padding * 2 : (width - padding * 2) / (values.length - 1);
  return values
    .map((value, index) => {
      const x = padding + index * step;
      const y = height - padding - (value / max) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

function createAreaPath(values, width, height, padding = 18) {
  if (!values.length) return '';
  const line = createLinePath(values, width, height, padding);
  return `${line} L${width - padding},${height - padding} L${padding},${height - padding} Z`;
}

function tinySparkColor(index) {
  return [
    'from-[#0058be]/40',
    'from-[#131b2e]/40',
    'from-[#004395]/40',
    'from-[#818486]/40',
  ][index % 4];
}

export default function AdminOverviewPage() {
  const { authFetch, user } = useApp();
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsRes, ordersRes, productsRes, usersRes] = await Promise.all([
        authFetch('/api/admin/metrics'),
        authFetch('/api/admin/orders'),
        fetch(`${getApiUrl()}/api/products`),
        authFetch('/api/admin/users'),
      ]);

      if (!metricsRes.ok || !ordersRes.ok || !productsRes.ok || !usersRes.ok) {
        throw new Error('Unable to load the executive dashboard.');
      }

      const [metricsData, ordersData, productsData, usersData] = await Promise.all([
        metricsRes.json(),
        ordersRes.json(),
        productsRes.json(),
        usersRes.json(),
      ]);

      setMetrics(metricsData);
      setOrders(ordersData);
      setProducts(productsData);
      setUsers(usersData);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the executive dashboard.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const customerCount = useMemo(() => users.filter((entry) => entry.role === 'customer').length, [users]);
  const salesValues = metrics?.salesByDay?.map((day) => day.revenue) || [];
  const revenueTrendDirection = salesValues.length > 1 && salesValues[salesValues.length - 1] < salesValues[salesValues.length - 2] ? 'down' : 'up';
  const latestRevenue = salesValues[salesValues.length - 1] || 0;
  const previousRevenue = salesValues[salesValues.length - 2] || 0;
  const revenueDelta = previousRevenue > 0 ? ((latestRevenue - previousRevenue) / previousRevenue) * 100 : latestRevenue > 0 ? 100 : 0;

  const categoryBreakdown = useMemo(() => {
    const counts = new Map();
    products.forEach((product) => {
      const key = product.category || 'uncategorized';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const total = products.length || 1;
    return [...counts.entries()]
      .map(([name, count]) => ({
        name,
        count,
        share: Math.round((count / total) * 100),
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 4);
  }, [products]);

  const latestOrders = orders.slice(0, 4);
  const chartLine = createLinePath(salesValues, 1000, 320);
  const chartArea = createAreaPath(salesValues, 1000, 320);
  const recentNewCustomers = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return users.filter((entry) => entry.role === 'customer' && now - new Date(entry.createdAt).getTime() <= sevenDays).length;
  }, [users]);
  const lowStockCount = useMemo(() => products.filter((product) => product.stock <= 15).length, [products]);
  const leadCategory = categoryBreakdown[0];

  const metricCards = [
    {
      icon: 'payments',
      label: 'Total Sales',
      value: loading ? '—' : formatCompactMoney(metrics?.revenue),
      badge: <TrendBadge value={`${revenueDelta >= 0 ? '+' : ''}${revenueDelta.toFixed(1)}%`} direction={revenueTrendDirection} />,
      tone: 'secondary',
    },
    {
      icon: 'shopping_bag',
      label: 'Total Orders',
      value: loading ? '—' : formatNumber(metrics?.orders),
      badge: <TrendBadge value={`${formatNumber(latestOrders.length)} recent`} direction="up" />,
      tone: 'primary',
    },
    {
      icon: 'person_add',
      label: 'Customers',
      value: loading ? '—' : formatNumber(customerCount),
      badge: <TrendBadge value={`${formatNumber(recentNewCustomers)} new / 7d`} direction={recentNewCustomers ? 'up' : 'warn'} />,
      tone: 'info',
    },
    {
      icon: 'avg_pace',
      label: 'Avg Order Value',
      value: loading ? '—' : formatMoney(metrics?.averageOrderValue),
      badge: <TrendBadge value={`${formatNumber(lowStockCount)} low stock`} direction={lowStockCount ? 'warn' : 'up'} />,
      tone: 'neutral',
    },
  ];

  return (
    <div>
      <AdminPageHead
        eyebrow="Dashboard"
        title={`Executive Overview${user?.name ? ` · Welcome ${user.name.split(' ')[0]}` : ''}`}
        description="Real-time performance tracking for your store ecosystem."
      >
        <ActionButton tone="subtle" type="button">
          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          Last 30 Days
        </ActionButton>
        <ActionButton tone="primary" type="button" onClick={loadDashboard}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh Dashboard
        </ActionButton>
      </AdminPageHead>

      {error ? <div className="mb-6"><PageError message={error} /></div> : null}

      {loading ? (
        <SurfaceCard><RowSpinner label="Loading executive insights…" /></SurfaceCard>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card, index) => (
              <StatCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                iconTone={card.tone}
                badge={card.badge}
                spark={<div className={`h-full rounded bg-gradient-to-t ${tinySparkColor(index)} to-transparent`} style={{ clipPath: 'polygon(0 100%, 8% 78%, 16% 84%, 24% 61%, 32% 67%, 40% 44%, 52% 51%, 64% 29%, 76% 39%, 88% 14%, 100% 22%, 100% 100%)' }} />}
              />
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <SurfaceCard className="xl:col-span-2 p-6">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-geist text-[18px] font-semibold leading-7 text-[#1b1b1d]">Sales Overview</h3>
                  <p className="text-[13px] text-[#45464d]">Daily transaction volume for the current period</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[12px] font-medium text-[#45464d]">
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#0058be]" />Net Sales</span>
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#adc6ff]" />Orders</span>
                </div>
              </div>

              {salesValues.length ? (
                <>
                  <div className="relative rounded-xl bg-[#f6f3f5] p-4">
                    <svg className="h-72 w-full" viewBox="0 0 1000 320" preserveAspectRatio="none" aria-label="Sales chart">
                      {[80, 160, 240].map((y) => <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="#d8d7dd" strokeWidth="1" />)}
                      <path d={chartArea} fill="url(#salesFill)" opacity="0.16" />
                      <path d={chartLine} fill="none" stroke="#0058be" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                      <defs>
                        <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#0058be" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="pointer-events-none absolute right-[12%] top-6 rounded-lg bg-[#1b1b1d] px-3 py-2 text-[11px] text-white shadow-lg">
                      <p className="font-semibold">Latest day: {formatMoney(latestRevenue)}</p>
                      <p>{salesValues.length} plotted points</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-[#76777d]">
                    {(metrics?.salesByDay || []).map((day) => <span key={day.label}>{day.label}</span>)}
                  </div>
                </>
              ) : (
                <EmptyState icon="monitoring" title="No sales activity yet" message="Daily revenue will appear here after your first successful orders." />
              )}
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <h3 className="font-geist text-[18px] font-semibold leading-7 text-[#1b1b1d]">Top Categories</h3>
              <p className="mt-1 text-[13px] text-[#45464d]">Catalogue share across your best-performing groups.</p>
              <div className="mt-6 space-y-5">
                {categoryBreakdown.length ? categoryBreakdown.map((category, index) => (
                  <div key={category.name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-[13px]">
                      <span className="font-medium text-[#1b1b1d]">{category.name}</span>
                      <span className="font-geist font-semibold text-[#1b1b1d]">{category.share}%</span>
                    </div>
                    <MiniBar value={category.share} tone={['secondary', 'info', 'neutral', 'muted'][index] || 'secondary'} />
                  </div>
                )) : <EmptyState icon="category" title="No categories to analyse" message="Add products to start building category insights." />}
              </div>
              <div className="mt-8 rounded-lg border border-dashed border-[#76777d] bg-[#f6f3f5] p-4 text-center text-[13px] leading-5 text-[#45464d]">
                {leadCategory ? (
                  <>“<span className="font-semibold text-emerald-700">{leadCategory.name}</span> leads your catalogue at <span className="font-semibold">{leadCategory.share}%</span>. Consider boosting stock for this segment.”</>
                ) : (
                  'Category guidance will appear here once products are assigned.'
                )}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[#c6c6cd] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-geist text-[18px] font-semibold leading-7 text-[#1b1b1d]">Recent Orders</h3>
                <p className="text-[13px] text-[#45464d]">The latest transactions completed across the storefront.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-[#76777d]">filter_list</span>
                  <select className="rounded-lg border border-[#c6c6cd] bg-white py-2 pl-8 pr-4 text-[12px] font-medium text-[#1b1b1d] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20">
                    <option>All Status</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                <Link href="/admin/orders" className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0058be] hover:underline">View All</Link>
              </div>
            </div>

            {!latestOrders.length ? (
              <EmptyState icon="shopping_cart" title="No orders recorded" message="Completed checkouts will appear here once customers start shopping." />
            ) : (
              <>
                <TableWrap>
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[#f6f3f5]">
                      <tr>
                        {['Order ID', 'Customer', 'Date', 'Total', 'Status', ''].map((heading, index) => (
                          <th key={`${heading}-${index}`} className={`px-6 py-4 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280] ${index === 3 ? 'text-right' : ''} ${index === 5 ? 'text-right' : ''}`}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c6c6cd]">
                      {latestOrders.map((order) => {
                        const initials = order.user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'GU';
                        const tone = order.status === 'Delivered' ? 'success' : order.status === 'Shipped' ? 'info' : order.status === 'Cancelled' ? 'danger' : 'warn';
                        return (
                          <tr key={order.id} className="transition-colors hover:bg-[#f6f3f5]">
                            <td className="px-6 py-4 font-geist text-[13px] font-medium text-[#1b1b1d]">#{order.id}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8e2ff] font-geist text-[10px] font-bold text-[#004395]">{initials}</div>
                                <div>
                                  <p className="text-[14px] font-medium text-[#1b1b1d]">{order.user?.name || 'Guest Customer'}</p>
                                  <p className="text-[11px] text-[#76777d]">{order.user?.email || 'No email available'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[13px] text-[#45464d]">{formatDate(order.createdAt)}</td>
                            <td className="px-6 py-4 text-right font-geist text-[13px] font-bold text-[#1b1b1d]">{formatMoney(order.total)}</td>
                            <td className="px-6 py-4"><Pill tone={tone}>{order.status}</Pill></td>
                            <td className="px-6 py-4 text-right">
                              <button className="rounded-full p-1 text-[#45464d] transition hover:bg-[#eae7e9]" type="button" aria-label="Open order menu">
                                <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableWrap>
                <div className="flex flex-col gap-4 border-t border-[#c6c6cd] bg-[#f6f3f5] px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Showing {latestOrders.length} of {formatNumber(metrics?.orders)} orders</p>
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg border border-[#c6c6cd] p-1 text-[#76777d]" type="button" disabled>
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button className="rounded-lg border border-[#c6c6cd] p-1 text-[#1b1b1d]" type="button">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </SurfaceCard>
        </>
      )}
    </div>
  );
}
