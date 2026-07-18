'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ActionButton,
  AdminPageHead,
  EmptyState,
  Field,
  MiniBar,
  Modal,
  PageError,
  Pill,
  RowSpinner,
  StatCard,
  SurfaceCard,
  TableWrap,
  TrendBadge,
  cx,
  formatCompactMoney,
  formatDate,
  formatMoney,
  formatNumber,
} from './AdminUI';

const paymentLabels = ['Visa Ending 4412', 'PayPal', 'Mastercard', 'Apple Pay'];
const paymentIcons = ['credit_card', 'account_balance_wallet', 'credit_card', 'wallet'];
const emptyCoupon = { code: '', description: '', type: 'percent', value: '', minOrder: '', expiresAt: '', active: true };

function isExpired(coupon) {
  return Boolean(coupon.expiresAt) && new Date(coupon.expiresAt) < new Date();
}

function discountLabel(coupon) {
  return coupon.type === 'percent' ? `${coupon.value}% Percent Discount` : `${formatMoney(coupon.value)} Fixed Amount`;
}

export default function OrdersPromotionsPage({ defaultTab = 'orders' }) {
  const { authFetch } = useApp();
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState(defaultTab);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyCoupon);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsRes, ordersRes, couponsRes] = await Promise.all([
        authFetch('/api/admin/metrics'),
        authFetch('/api/admin/orders'),
        authFetch('/api/admin/coupons'),
      ]);
      if (!metricsRes.ok || !ordersRes.ok || !couponsRes.ok) {
        throw new Error('Unable to load orders and promotions.');
      }
      const [metricsData, ordersData, couponsData] = await Promise.all([metricsRes.json(), ordersRes.json(), couponsRes.json()]);
      setMetrics(metricsData);
      setOrders(ordersData);
      setCoupons(couponsData);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load orders and promotions.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    setView(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCoupons = useMemo(() => coupons.filter((coupon) => coupon.active && !isExpired(coupon)), [coupons]);
  const couponMaxUses = Math.max(...coupons.map((coupon) => coupon.usedCount || 0), 1);
  const totalCouponUses = coupons.reduce((sum, coupon) => sum + (coupon.usedCount || 0), 0);
  const couponTrend = activeCoupons.length ? `${activeCoupons.length} active` : 'No active coupons';
  const recentOrders = orders.slice(0, 8);

  const revenueTrendDirection = metrics?.salesByDay?.length > 1 && metrics.salesByDay[metrics.salesByDay.length - 1].revenue < metrics.salesByDay[metrics.salesByDay.length - 2].revenue ? 'down' : 'up';
  const orderTrendDirection = recentOrders.length >= 2 && recentOrders[0]?.total < recentOrders[1]?.total ? 'down' : 'up';

  const openCouponModal = () => {
    setForm(emptyCoupon);
    setFormError('');
    setModal(true);
  };

  const submitCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const response = await authFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          type: form.type,
          value: Number(form.value),
          minOrder: form.minOrder === '' ? 0 : Number(form.minOrder),
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          active: form.active,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to create this coupon.');
      }
      setModal(false);
      await load();
    } catch (submitError) {
      setFormError(submitError.message || 'Unable to create this coupon.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (coupon) => {
    try {
      const response = await authFetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to update this coupon.');
      }
      await load();
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update this coupon.');
    }
  };

  const removeCoupon = async (coupon) => {
    if (!window.confirm(`Delete the "${coupon.code}" coupon?`)) return;
    try {
      const response = await authFetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to delete this coupon.');
      }
      await load();
    } catch (removeError) {
      setError(removeError.message || 'Unable to delete this coupon.');
    }
  };

  return (
    <>
      <AdminPageHead
        eyebrow="Transactions"
        title="Orders & Promotions"
        description="Manage global orders and promotional campaigns from a single interface."
      >
        <div className="inline-flex rounded-xl bg-[#eae7e9] p-1">
          <button
            className={cx(
              'rounded-lg px-6 py-2 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors',
              view === 'orders' ? 'bg-white text-[#1b1b1d] shadow-sm' : 'text-[#76777d] hover:text-[#1b1b1d]'
            )}
            onClick={() => setView('orders')}
            type="button"
          >
            Orders
          </button>
          <button
            className={cx(
              'rounded-lg px-6 py-2 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors',
              view === 'coupons' ? 'bg-white text-[#1b1b1d] shadow-sm' : 'text-[#76777d] hover:text-[#1b1b1d]'
            )}
            onClick={() => setView('coupons')}
            type="button"
          >
            Coupons
          </button>
        </div>
      </AdminPageHead>

      {error ? <div className="mb-6"><PageError message={error} /></div> : null}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="shopping_bag"
          label="Total Orders"
          value={loading ? '—' : formatNumber(metrics?.orders)}
          iconTone="secondary"
          badge={<TrendBadge value={`${recentOrders.length} recent`} direction={orderTrendDirection} />}
        />
        <StatCard
          icon="payments"
          label="Revenue"
          value={loading ? '—' : formatCompactMoney(metrics?.revenue)}
          iconTone="primary"
          badge={<TrendBadge value="Store total" direction={revenueTrendDirection} />}
        />
        <StatCard
          icon="confirmation_number"
          label="Active Coupons"
          value={loading ? '—' : formatNumber(activeCoupons.length)}
          iconTone="info"
          badge={<TrendBadge value={couponTrend} direction={activeCoupons.length ? 'up' : 'warn'} />}
        />
        <StatCard
          icon="trending_up"
          label="Avg. Value"
          value={loading ? '—' : formatMoney(metrics?.averageOrderValue)}
          iconTone="neutral"
          badge={<TrendBadge value="Per order" direction="up" />}
        />
      </div>

      {loading ? (
        <SurfaceCard><RowSpinner label="Loading orders and coupons…" /></SurfaceCard>
      ) : (
        <div className="space-y-6">
          {view === 'orders' ? (
            <SurfaceCard className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-[#c6c6cd] bg-[#f6f3f5]/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-geist text-[18px] font-semibold leading-7 text-[#1b1b1d]">Recent Orders</h3>
                  <p className="text-[13px] text-[#45464d]">Live transaction activity across the store.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton tone="secondary" type="button"><span className="material-symbols-outlined text-[18px]">filter_list</span>Filter</ActionButton>
                  <ActionButton tone="secondary" type="button"><span className="material-symbols-outlined text-[18px]">download</span>Export</ActionButton>
                </div>
              </div>

              {!orders.length ? (
                <EmptyState icon="shopping_cart" title="No orders yet" message="Customer purchases will appear here once checkout activity starts." />
              ) : (
                <>
                  <TableWrap>
                    <table className="min-w-full border-collapse text-left">
                      <thead className="bg-[#f6f3f5]">
                        <tr>
                          {['Order ID', 'Date', 'Customer Name', 'Payment Method', 'Total Amount', 'Order Status', 'Actions'].map((heading, index) => (
                            <th key={heading} className={cx('px-6 py-4 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]', index >= 5 && 'text-center', index === 6 && 'text-right')}>
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c6c6cd]">
                        {recentOrders.map((order, index) => {
                          const paymentLabel = paymentLabels[index % paymentLabels.length];
                          const paymentIcon = paymentIcons[index % paymentIcons.length];
                          const statusTone = order.status === 'Delivered' ? 'success' : order.status === 'Shipped' ? 'info' : order.status === 'Cancelled' ? 'danger' : 'warn';
                          return (
                            <tr key={order.id} className="transition-colors hover:bg-[#f6f3f5]">
                              <td className="px-6 py-4 font-geist text-[13px]">#{order.id}</td>
                              <td className="px-6 py-4 text-[13px] text-[#45464d]">{formatDate(order.createdAt)}</td>
                              <td className="px-6 py-4 text-[14px] font-medium text-[#1b1b1d]">{order.user?.name || 'Guest customer'}</td>
                              <td className="px-6 py-4 text-[13px] text-[#45464d]">
                                <span className="inline-flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[18px] text-[#76777d]">{paymentIcon}</span>
                                  {paymentLabel}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-geist text-[13px] font-bold text-[#1b1b1d]">{formatMoney(order.total)}</td>
                              <td className="px-6 py-4 text-center"><Pill tone={statusTone}>{order.status}</Pill></td>
                              <td className="px-6 py-4 text-right">
                                <button className="rounded-full p-1 text-[#0058be] transition hover:bg-[#2170e4]/10" type="button" aria-label="View order details">
                                  <span className="material-symbols-outlined">visibility</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableWrap>
                  <div className="flex flex-col gap-4 border-t border-[#c6c6cd] bg-[#f6f3f5] px-4 py-3 text-[13px] text-[#45464d] sm:flex-row sm:items-center sm:justify-between">
                    <span>Showing {recentOrders.length} of {formatNumber(metrics?.orders)} results</span>
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg border border-[#c6c6cd] px-3 py-1.5 text-[#76777d]" disabled type="button">Previous</button>
                      <button className="rounded-lg border border-[#c6c6cd] px-3 py-1.5 text-[#1b1b1d]" type="button">Next</button>
                    </div>
                  </div>
                </>
              )}
            </SurfaceCard>
          ) : (
            <SurfaceCard className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-[#c6c6cd] bg-[#f6f3f5]/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-geist text-[18px] font-semibold leading-7 text-[#1b1b1d]">Active Promotional Coupons</h3>
                  <p className="text-[13px] text-[#45464d]">Track discount availability, usage and expiry windows.</p>
                </div>
                <ActionButton tone="primary" type="button" onClick={openCouponModal}><span className="material-symbols-outlined text-[18px]">add</span>Create Coupon</ActionButton>
              </div>

              {!coupons.length ? (
                <EmptyState icon="confirmation_number" title="No coupons created" message="Launch your first promotion to start rewarding customers." action={<ActionButton tone="primary" type="button" onClick={openCouponModal}>Create Coupon</ActionButton>} />
              ) : (
                <TableWrap>
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[#f6f3f5]">
                      <tr>
                        {['Coupon Code', 'Discount Type', 'Usage Limit', 'Expiry Date', 'Status', 'Actions'].map((heading, index) => (
                          <th key={heading} className={cx('px-6 py-4 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]', index >= 4 && 'text-center', index === 5 && 'text-right')}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c6c6cd]">
                      {coupons.map((coupon) => {
                        const expired = isExpired(coupon);
                        const tone = expired ? 'muted' : coupon.active ? 'success' : 'warn';
                        return (
                          <tr key={coupon.id} className={cx('transition-colors hover:bg-[#f6f3f5]', expired && 'opacity-70')}>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-md border border-[#d8d7dd] bg-[#f6f3f5] px-2 py-1 font-geist text-[13px] font-bold uppercase tracking-[0.08em] text-[#1b1b1d]">{coupon.code}</span>
                            </td>
                            <td className="px-6 py-4 text-[13px] text-[#45464d]">{discountLabel(coupon)}</td>
                            <td className="px-6 py-4 text-[13px] text-[#1b1b1d]">{coupon.usageLimit ? `${coupon.usedCount} / ${coupon.usageLimit}` : `${coupon.usedCount} / Unlimited`}</td>
                            <td className="px-6 py-4 text-[13px] text-[#45464d]">{coupon.expiresAt ? formatDate(coupon.expiresAt) : 'No Expiry'}</td>
                            <td className="px-6 py-4 text-center"><Pill tone={tone}>{expired ? 'Expired' : coupon.active ? 'Active' : 'Paused'}</Pill></td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#f0edef] disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => toggleCoupon(coupon)} disabled={expired}>
                                  <span className="material-symbols-outlined text-[20px]">{coupon.active ? 'pause_circle' : 'play_circle'}</span>
                                </button>
                                <button className="rounded-full p-2 text-[#ba1a1a] transition hover:bg-[#ffdad6]" type="button" onClick={() => removeCoupon(coupon)}>
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </SurfaceCard>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <SurfaceCard className="md:col-span-2 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-geist text-[18px] font-semibold text-[#1b1b1d]">Regional Sales Heatmap</h4>
                  <p className="text-[13px] text-[#45464d]">Visual placeholder aligned with the design reference.</p>
                </div>
                <span className="material-symbols-outlined text-[#76777d]">public</span>
              </div>
              <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl bg-[#f6f3f5]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(0,88,190,0.18),transparent_28%),radial-gradient(circle_at_68%_42%,rgba(33,112,228,0.18),transparent_24%),radial-gradient(circle_at_45%_70%,rgba(0,88,190,0.14),transparent_24%)]" />
                <span className="relative rounded-full border border-[#c6c6cd] bg-white/90 px-4 py-2 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#45464d]">
                  Interactive Map Loading...
                </span>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-4">
              <div className="mb-5">
                <h4 className="font-geist text-[18px] font-semibold text-[#1b1b1d]">Top Coupon Performance</h4>
                <p className="mt-1 text-[13px] text-[#45464d]">Usage distribution across live and historical coupon codes.</p>
              </div>
              <div className="space-y-4">
                {(coupons.slice(0, 3).length ? coupons.slice(0, 3) : [{ code: '—', usedCount: 0 }]).map((coupon) => (
                  <div key={coupon.code}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">{coupon.code}</span>
                      <span className="text-[13px] font-semibold text-[#1b1b1d]">{formatNumber(coupon.usedCount || 0)} uses</span>
                    </div>
                    <MiniBar value={((coupon.usedCount || 0) / couponMaxUses) * 100} tone="secondary" />
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-dashed border-[#c6c6cd] bg-[#f6f3f5] p-4 text-center">
                <p className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Total coupon uses</p>
                <p className="mt-2 text-[20px] font-semibold text-[#1b1b1d]">{formatNumber(totalCouponUses)}</p>
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}

      <Modal open={modal} title="Create coupon" onClose={() => setModal(false)}>
        <form className="space-y-4" onSubmit={submitCoupon}>
          {formError ? <PageError message={formError} /> : null}
          <Field label="Coupon code" hint="letters, numbers or dashes">
            <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="SUMMER20" />
          </Field>
          <Field label="Description" hint="optional">
            <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Summer campaign" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </select>
            </Field>
            <Field label={form.type === 'percent' ? 'Value (%)' : 'Value ($)'}>
              <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required min="0" step="0.01" type="number" value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Minimum order ($)" hint="optional">
              <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" min="0" step="0.01" type="number" value={form.minOrder} onChange={(event) => setForm((current) => ({ ...current, minOrder: event.target.value }))} />
            </Field>
            <Field label="Expiry date" hint="optional">
              <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" type="date" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} />
            </Field>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-[#c6c6cd] bg-[#f6f3f5] px-4 py-3 text-[14px] text-[#45464d]">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
            Active and redeemable immediately
          </label>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <ActionButton type="button" tone="secondary" onClick={() => setModal(false)}>Cancel</ActionButton>
            <ActionButton type="submit" tone="primary" disabled={saving}>{saving ? 'Saving…' : 'Create Coupon'}</ActionButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
