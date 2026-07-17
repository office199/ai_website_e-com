'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminPageHead, EmptyState, Field, Modal, PageError, Pill, RowSpinner } from '../components/AdminUI';

const emptyForm = { code: '', description: '', type: 'percent', value: '', minOrder: '', expiresAt: '', active: true };
const formatDate = (value) => (value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—');
const isExpired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();
const describe = (c) => (c.type === 'percent' ? `${c.value}% off` : `$${Number(c.value).toFixed(2)} off`);

export default function AdminCouponsPage() {
  const { authFetch } = useApp();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | { mode, id? }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/admin/coupons');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to load coupons.');
      setCoupons(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(emptyForm); setFormError(''); setModal({ mode: 'add' }); };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      description: form.description,
      minOrder: form.minOrder === '' ? 0 : Number(form.minOrder),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      active: form.active,
    };
    const editingId = modal?.id;
    try {
      const res = await authFetch(editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to save this coupon.');
      setModal(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      const res = await authFetch(`/api/admin/coupons/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to update this coupon.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the "${c.code}" coupon?`)) return;
    try {
      const res = await authFetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to delete this coupon.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <AdminPageHead eyebrow="Promotions" title="Coupons" description="Create discount codes and control whether they are redeemable.">
        <button className="admin-btn primary" onClick={openAdd}>+ Add coupon</button>
      </AdminPageHead>

      {error && <div style={{ marginTop: '20px' }}><PageError message={error} /></div>}

      <div className="admin-panel no-pad">
        {loading ? <RowSpinner /> : !coupons.length ? (
          <EmptyState icon="✦" title="No coupons yet" message="Create a discount code to reward your customers." action={<button className="admin-btn primary" onClick={openAdd}>+ Add coupon</button>} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Expires</th><th>Status</th><th>Used</th><th className="ta-right">Actions</th></tr></thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = isExpired(c);
                  const live = c.active && !expired;
                  return (
                    <tr key={c.id}>
                      <td><strong className="coupon-code">{c.code}</strong>{c.description && <div className="admin-sub">{c.description}</div>}</td>
                      <td>{describe(c)}</td>
                      <td>{c.minOrder ? `$${Number(c.minOrder).toFixed(2)}` : '—'}</td>
                      <td>{formatDate(c.expiresAt)}</td>
                      <td><Pill tone={live ? 'success' : expired ? 'muted' : 'warn'}>{expired ? 'Expired' : c.active ? 'Active' : 'Paused'}</Pill></td>
                      <td>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                      <td className="ta-right">
                        <button className="admin-link" onClick={() => toggleActive(c)} disabled={expired}>{c.active ? 'Pause' : 'Activate'}</button>
                        <button className="admin-link danger" onClick={() => remove(c)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={Boolean(modal)} title={modal?.mode === 'edit' ? 'Edit coupon' : 'Add coupon'} onClose={() => setModal(null)}>
        <form onSubmit={submit} className="admin-form">
          {formError && <div className="auth-error">{formError}</div>}
          <Field label="Coupon code" hint="letters, numbers or dashes"><input required className="admin-input" value={form.code} onChange={(e) => setForm((d) => ({ ...d, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" /></Field>
          <Field label="Description" hint="optional"><input className="admin-input" value={form.description} onChange={(e) => setForm((d) => ({ ...d, description: e.target.value }))} placeholder="Summer sale — 20% off" /></Field>
          <div className="admin-form-row">
            <Field label="Type" style={{ width: '160px' }}>
              <select className="admin-select" value={form.type} onChange={(e) => setForm((d) => ({ ...d, type: e.target.value }))}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </select>
            </Field>
            <Field label={form.type === 'percent' ? 'Value (%)' : 'Value ($)'} style={{ flex: 1 }}><input required type="number" min="0" step="0.01" className="admin-input" value={form.value} onChange={(e) => setForm((d) => ({ ...d, value: e.target.value }))} /></Field>
          </div>
          <div className="admin-form-row">
            <Field label="Minimum order ($)" hint="optional" style={{ flex: 1 }}><input type="number" min="0" step="0.01" className="admin-input" value={form.minOrder} onChange={(e) => setForm((d) => ({ ...d, minOrder: e.target.value }))} /></Field>
            <Field label="Expiry date" hint="optional" style={{ flex: 1 }}><input type="date" className="admin-input" value={form.expiresAt} onChange={(e) => setForm((d) => ({ ...d, expiresAt: e.target.value }))} /></Field>
          </div>
          <label className="admin-checkbox"><input type="checkbox" checked={form.active} onChange={(e) => setForm((d) => ({ ...d, active: e.target.checked }))} /> Active and redeemable immediately</label>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn primary" disabled={saving}>{saving ? 'Saving…' : modal?.mode === 'edit' ? 'Save changes' : 'Create coupon'}</button>
            <button type="button" className="admin-btn ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
