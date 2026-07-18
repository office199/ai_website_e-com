'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ActionButton,
  AdminPageHead,
  EmptyState,
  Field,
  Modal,
  PageError,
  Pill,
  RowSpinner,
  SurfaceCard,
  TableWrap,
  formatDate,
  formatNumber,
} from '../components/AdminUI';

const emptyForm = { name: '', role: 'customer' };

export default function AdminUsersPage() {
  const { user: currentUser, authFetch } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authFetch('/api/admin/users');
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to load users.');
      setUsers(await response.json());
    } catch (loadError) {
      setError(loadError.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((entry) => {
      const matchesSearch = !query || entry.name.toLowerCase().includes(query) || entry.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'all' || entry.role === roleFilter || (roleFilter === 'active' && entry.status === 'active') || (roleFilter === 'deactivated' && entry.status === 'deactivated');
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((entry) => entry.status === 'active').length,
    admins: users.filter((entry) => entry.role === 'admin').length,
    suspended: users.filter((entry) => entry.status === 'deactivated').length,
  }), [users]);

  const patchUser = async (id, body) => {
    const response = await authFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to update this user.');
    return response.json();
  };

  const openEdit = (entry) => {
    setForm({ name: entry.name, role: entry.role });
    setFormError('');
    setModal({ id: entry.id, original: entry });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await patchUser(modal.id, { name: form.name, role: form.role });
      setModal(null);
      await loadUsers();
    } catch (submitError) {
      setFormError(submitError.message || 'Unable to update this user.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (entry) => {
    const nextStatus = entry.status === 'active' ? 'deactivated' : 'active';
    try {
      await patchUser(entry.id, { status: nextStatus });
      await loadUsers();
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update this user.');
    }
  };

  const removeUser = async (entry) => {
    if (!window.confirm(`Permanently delete ${entry.name}? Their cart, wishlist and reviews will also be removed.`)) return;
    try {
      const response = await authFetch(`/api/admin/users/${entry.id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to delete this user.');
      await loadUsers();
    } catch (removeError) {
      setError(removeError.message || 'Unable to delete this user.');
    }
  };

  return (
    <div>
      <AdminPageHead
        eyebrow="People"
        title="Users Management"
        description="Manage platform access, roles, and account statuses for all users."
      >
        <ActionButton tone="secondary" type="button">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          Filter
        </ActionButton>
        <ActionButton tone="primary" type="button" onClick={loadUsers}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh Users
        </ActionButton>
      </AdminPageHead>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SurfaceCard className="p-4">
          <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Total Users</span>
          <div className="mt-2 flex items-baseline gap-2"><span className="font-geist text-[30px] font-semibold text-[#1b1b1d]">{formatNumber(stats.total)}</span><span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Live</span></div>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Active Accounts</span>
          <div className="mt-2 flex items-baseline gap-2"><span className="font-geist text-[30px] font-semibold text-[#1b1b1d]">{formatNumber(stats.active)}</span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Admins</span>
          <div className="mt-2 flex items-baseline gap-2"><span className="font-geist text-[30px] font-semibold text-[#1b1b1d]">{formatNumber(stats.admins)}</span></div>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7280]">Suspended</span>
          <div className="mt-2 flex items-baseline gap-2"><span className="font-geist text-[30px] font-semibold text-[#1b1b1d]">{formatNumber(stats.suspended)}</span><span className="text-[11px] font-bold text-[#ba1a1a]">Restricted</span></div>
        </SurfaceCard>
      </div>

      {error ? <div className="mb-6"><PageError message={error} /></div> : null}

      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input className="max-w-md rounded-lg border border-[#c6c6cd] bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" placeholder="Search by name or email..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="rounded-lg border border-[#c6c6cd] bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="all">Everyone</option>
          <option value="customer">Customers</option>
          <option value="admin">Administrators</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      <SurfaceCard className="overflow-hidden">
        {loading ? (
          <RowSpinner label="Loading user accounts…" />
        ) : !filteredUsers.length ? (
          <EmptyState icon="group" title="No users found" message="No accounts match your current filters." />
        ) : (
          <>
            <TableWrap>
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[#f6f3f5]">
                  <tr>
                    {['User Info', 'Email Address', 'Role', 'Status', 'Joined', 'Actions'].map((heading, index) => (
                      <th key={`${heading}-${index}`} className={`px-6 py-4 font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280] ${index === 5 ? 'text-right' : ''}`}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]">
                  {filteredUsers.map((entry, index) => {
                    const isSelf = currentUser?.id === entry.id;
                    const initials = entry.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
                    const avatarTones = ['bg-[#d8e2ff] text-[#004395]', 'bg-[#e0e3e5] text-[#444749]', 'bg-[#d8e2ff] text-[#004395]', 'bg-[#dae2fd] text-[#3f465c]'];
                    return (
                      <tr key={entry.id} className="transition-colors hover:bg-[#f6f3f5]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-geist text-[10px] font-bold ${avatarTones[index % avatarTones.length]}`}>{initials}</div>
                            <div>
                              <p className="text-[14px] font-semibold text-[#1b1b1d]">{entry.name} {isSelf ? <span className="ml-1 rounded-full bg-[#f0edef] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#76777d]">You</span> : null}</p>
                              <p className="text-[11px] text-[#76777d]">Joined {formatDate(entry.createdAt)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#45464d]">{entry.email}</td>
                        <td className="px-6 py-4"><Pill tone={entry.role === 'admin' ? 'admin' : 'neutral'}>{entry.role}</Pill></td>
                        <td className="px-6 py-4"><Pill tone={entry.status === 'active' ? 'success' : 'danger'}>{entry.status}</Pill></td>
                        <td className="px-6 py-4 text-[13px] text-[#45464d]">{formatDate(entry.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#eae7e9] hover:text-[#0058be]" type="button" onClick={() => openEdit(entry)}>
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#f6f3f5] hover:text-[#1b1b1d] disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => toggleStatus(entry)} disabled={isSelf} title={isSelf ? 'You cannot change your own status' : ''}>
                              <span className="material-symbols-outlined">{entry.status === 'active' ? 'person_off' : 'person'}</span>
                            </button>
                            <button className="rounded-full p-2 text-[#45464d] transition hover:bg-[#ffdad6] hover:text-[#ba1a1a] disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => removeUser(entry)} disabled={isSelf} title={isSelf ? 'You cannot delete your own account' : ''}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
            <div className="flex flex-col gap-4 border-t border-[#c6c6cd] bg-[#f6f3f5] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-geist text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6f7280]">Showing {formatNumber(filteredUsers.length)} of {formatNumber(users.length)} users</span>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-[#c6c6cd] p-1 text-[#76777d]" type="button" disabled><span className="material-symbols-outlined">chevron_left</span></button>
                <button className="rounded-lg bg-[#0058be] px-3 py-1 font-geist text-[12px] font-semibold text-white" type="button">1</button>
                <button className="rounded-lg border border-[#c6c6cd] p-1 text-[#76777d]" type="button"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>
          </>
        )}
      </SurfaceCard>

      <div className="mt-6 rounded-xl bg-[#d8e2ff]/40 p-4 text-[13px] leading-5 text-[#004395]">
        <span className="mr-2 align-middle text-[18px]"><span className="material-symbols-outlined">info</span></span>
        <strong>Admin Tip:</strong> Role changes require double-verification for security. Any role upgrades will be logged in the system audit trail automatically.
      </div>

      <Modal open={Boolean(modal)} title="Edit user" onClose={() => setModal(null)}>
        <form className="space-y-4" onSubmit={submit}>
          {formError ? <PageError message={formError} /> : null}
          <Field label="Full name">
            <input className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </Field>
          <Field label="Email Address">
            <input className="w-full rounded-lg border border-[#c6c6cd] bg-[#f6f3f5] px-4 py-3 text-[14px] text-[#76777d]" disabled value={modal?.original?.email || ''} />
          </Field>
          <Field label="Role">
            <select className="w-full rounded-lg border border-[#c6c6cd] bg-white px-4 py-3 text-[14px] outline-none focus:border-[#2170e4] focus:ring-2 focus:ring-[#2170e4]/20" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
              <option value="customer">Customer</option>
              <option value="admin">Administrator</option>
            </select>
          </Field>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <ActionButton tone="secondary" type="button" onClick={() => setModal(null)}>Cancel</ActionButton>
            <ActionButton tone="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
