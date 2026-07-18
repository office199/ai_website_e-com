'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminPageHead, EmptyState, Field, Modal, PageError, Pill, RowSpinner } from '../components/AdminUI';
import Reveal from '../../components/motion/Reveal';

const formatDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
const emptyForm = { name: '', role: 'customer' };

export default function AdminUsersPage() {
  const { user: currentUser, authFetch } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | { id }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/admin/users');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to load users.');
      setUsers(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter || (roleFilter === 'active' && u.status === 'active') || (roleFilter === 'deactivated' && u.status === 'deactivated');
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  }), [users, search, roleFilter]);

  const openEdit = (u) => { setForm({ name: u.name, role: u.role }); setFormError(''); setModal({ id: u.id, original: u }); };

  const patchUser = async (id, body) => {
    const res = await authFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to update this user.');
    return res.json();
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await patchUser(modal.id, { name: form.name, role: form.role });
      setModal(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u) => {
    const next = u.status === 'active' ? 'deactivated' : 'active';
    try {
      await patchUser(u.id, { status: next });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name}? Their cart, wishlist and reviews will also be removed.`)) return;
    try {
      const res = await authFetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(() => ({}))).error || 'Unable to delete this user.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const counts = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    admins: users.filter((u) => u.role === 'admin').length,
  }), [users]);

  return (
    <>
      <Reveal>
      <AdminPageHead eyebrow="People" title="Users" description="Manage customer and administrator accounts, roles and access.">
        <button className="admin-btn ghost" onClick={load}>Refresh ↻</button>
      </AdminPageHead>

      <div className="admin-stat-row">
        <div className="admin-stat"><span>Total users</span><b>{counts.total}</b></div>
        <div className="admin-stat"><span>Active</span><b>{counts.active}</b></div>
        <div className="admin-stat"><span>Administrators</span><b>{counts.admins}</b></div>
      </div>

      {error && <div style={{ marginTop: '20px' }}><PageError message={error} /></div>}

      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="admin-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Everyone</option>
          <option value="customer">Customers</option>
          <option value="admin">Administrators</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      <div className="admin-panel no-pad">
        {loading ? <RowSpinner /> : !filtered.length ? (
          <EmptyState icon="👥" title="No users found" message="No accounts match your current filters." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th className="ta-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong>{isSelf && <span className="pill neutral self">You</span>}<div className="admin-sub">ID {u.id.slice(-6)}</div></td>
                      <td>{u.email}</td>
                      <td><Pill tone={u.role === 'admin' ? 'admin' : 'neutral'}>{u.role}</Pill></td>
                      <td><Pill tone={u.status === 'active' ? 'success' : 'muted'}>{u.status}</Pill></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td className="ta-right">
                        <button className="admin-link edit" onClick={() => openEdit(u)}>Edit</button>
                        <button className="admin-link" onClick={() => toggleStatus(u)} disabled={isSelf} title={isSelf ? 'You cannot change your own status' : ''}>
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="admin-link danger" onClick={() => remove(u)} disabled={isSelf} title={isSelf ? 'You cannot delete your own account' : ''}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </Reveal>
      <Modal open={Boolean(modal)} title="Edit user" onClose={() => setModal(null)}>
        <form onSubmit={submit} className="admin-form">
          {formError && <div className="auth-error">{formError}</div>}
          <Field label="Full name"><input required className="admin-input" value={form.name} onChange={(e) => setForm((d) => ({ ...d, name: e.target.value }))} /></Field>
          <Field label="Email"><input className="admin-input" value={modal?.original?.email || ''} disabled /></Field>
          <Field label="Role">
            <select className="admin-select" value={form.role} onChange={(e) => setForm((d) => ({ ...d, role: e.target.value }))}>
              <option value="customer">Customer</option>
              <option value="admin">Administrator</option>
            </select>
          </Field>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button type="button" className="admin-btn ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
