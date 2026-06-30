/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Plus, ToggleLeft, ToggleRight, Trash2, Key, Edit2 } from 'lucide-react';

interface Admin {
  id: number;
  username: string;
  display_name: string;
  telegram_id: string;
  role: 'admin' | 'superadmin';
  permissions: string[];
  status: 'active' | 'blocked';
  created_at: string;
}

const ALL_PERMISSIONS = [
  { key: 'dashboard.view', label: 'View Dashboard Stats' },
  { key: 'customers.view', label: 'View Customer Database' },
  { key: 'customers.edit', label: 'Edit Customer Records' },
  { key: 'orders.view', label: 'Audit Purchases & Invoices' },
  { key: 'payments.view', label: 'Verify Receipt Billings' },
  { key: 'services.view', label: 'Manage Active Subscriptions' },
  { key: 'services.edit', label: 'Change Config Overrides' },
  { key: 'trials.view', label: 'Manage Disposable Trial Plans' },
  { key: 'tickets.view', label: 'Live Client Support Chat' },
  { key: 'broadcast.send', label: 'Targeted System Broadcasts' },
  { key: 'settings.general', label: 'Modify Business Settings' },
  { key: 'admins.view', label: 'Audit Admins Directory' }
];

export default function AdminsPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');
  const [permissions, setPermissions] = useState<string[]>(['dashboard.view']);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admins');
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [refreshTrigger]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = editingId !== null;
      const url = isEditing ? `/api/admins/${editingId}` : '/api/admins';
      const method = isEditing ? 'PUT' : 'POST';
      const bodyData: Record<string, any> = {
        username,
        display_name: displayName,
        telegram_id: telegramId,
        role,
        permissions
      };
      if (!isEditing) {
        bodyData.status = 'active';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setShowAdd(false);
        setEditingId(null);
        setUsername('');
        setDisplayName('');
        setTelegramId('');
        setRole('admin');
        setPermissions(['dashboard.view']);
        fetchAdmins();
      } else {
        alert("Failed to save administrator.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving administrator.");
    }
  };

  const startEdit = (a: Admin) => {
    setEditingId(a.id);
    setUsername(a.username);
    setDisplayName(a.display_name);
    setTelegramId(a.telegram_id || '');
    setRole(a.role);
    setPermissions(a.permissions);
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (id === 1) {
      alert("System Master administrator cannot be deleted.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this administrator? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admins/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAdmins();
      } else {
        alert("Failed to delete administrator.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting administrator.");
    }
  };

  const togglePermission = (key: string) => {
    setPermissions(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    try {
      await fetch(`/api/admins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus === 'active' ? 'blocked' : 'active' })
      });
      fetchAdmins();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Administrators Directory</h1>
          <p className="text-sm text-neutral-400 font-sans">Grant team roles, audit access logins, and restrict permissions per administrative user.</p>
        </div>
        <button
          onClick={() => {
            if (showAdd) {
              setShowAdd(false);
              setEditingId(null);
              setUsername('');
              setDisplayName('');
              setTelegramId('');
              setRole('admin');
              setPermissions(['dashboard.view']);
            } else {
              setShowAdd(true);
            }
          }}
          className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold py-2 px-3 rounded-lg flex items-center gap-1.5 transition shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {editingId !== null ? 'Cancel Edit' : 'Add Team Member'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3 pb-2 border-b border-neutral-800 flex justify-between items-center">
            <h3 className="font-bold text-sm text-emerald-400 font-sans">
              {editingId !== null ? `Edit Administrator Profile (${username})` : 'Register New Administrator'}
            </h3>
            {editingId !== null && (
              <span className="text-[10px] text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Editing Mode
              </span>
            )}
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Login Username *</label>
            <input
              type="text" required value={username} onChange={e => setUsername(e.target.value)}
              disabled={editingId !== null} // Disable username editing for safety if desired, or keep editable
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Display Name *</label>
            <input
              type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Telegram ID (Numerical)</label>
            <input
              type="text" value={telegramId} onChange={e => setTelegramId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">System Role</label>
            <select
              value={role} onChange={e => setRole(e.target.value as 'admin' | 'superadmin')}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="admin">Admin Auditor</option>
              <option value="superadmin">Super Administrator</option>
            </select>
          </div>

          <div className="md:col-span-3 space-y-2 border-t border-neutral-800 pt-3">
            <span className="font-bold text-white block mb-2">Assign Dashboard Permissions</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {ALL_PERMISSIONS.map(p => (
                <label key={p.key} className="flex items-center gap-2 p-2 bg-neutral-950 rounded border border-neutral-800 cursor-pointer hover:bg-neutral-850 select-none">
                  <input
                    type="checkbox" checked={permissions.includes(p.key)} onChange={() => togglePermission(p.key)}
                    className="w-4 h-4 rounded text-emerald-500 border-neutral-800 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-neutral-300 font-medium">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button" onClick={() => {
                setShowAdd(false);
                setEditingId(null);
                setUsername('');
                setDisplayName('');
                setTelegramId('');
                setRole('admin');
                setPermissions(['dashboard.view']);
              }}
              className="px-3 py-1.5 border border-neutral-800 text-neutral-300 rounded hover:bg-neutral-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 text-black rounded hover:bg-emerald-400 font-extrabold transition cursor-pointer"
            >
              {editingId !== null ? 'Save Changes' : 'Create Auditor'}
            </button>
          </div>
        </form>
      )}

      {/* Admins Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-950 border-b border-neutral-850 text-neutral-500 font-mono text-[10px]">
                <th className="p-3 font-semibold">Username Directory</th>
                <th className="p-3 font-semibold">Display Full Name</th>
                <th className="p-3 font-semibold">Telegram Numerical ID</th>
                <th className="p-3 font-semibold">Role Authority</th>
                <th className="p-3 font-semibold">Permissions Allotted</th>
                <th className="p-3 font-semibold text-center">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500 font-mono">Loading administrators...</td>
                </tr>
              ) : (
                admins.map(a => (
                  <tr key={a.id} className="hover:bg-neutral-950/40">
                    <td className="p-3 font-mono font-bold text-white">{a.username}</td>
                    <td className="p-3 font-semibold text-white">{a.display_name}</td>
                    <td className="p-3 font-mono text-neutral-400">{a.telegram_id || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                        a.role === 'superadmin'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        <Shield className="w-3 h-3" /> {a.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {a.role === 'superadmin' ? (
                        <span className="text-neutral-500 italic">Unlimited Bypass All</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {a.permissions.slice(0, 3).map((perm, i) => (
                            <span key={i} className="bg-neutral-950 text-neutral-400 text-[9px] px-1 rounded font-mono border border-neutral-850">
                              {perm}
                            </span>
                          ))}
                          {a.permissions.length > 3 && (
                            <span className="text-neutral-500 text-[9px] px-1 font-mono font-bold">
                              +{a.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {a.id === 1 ? (
                        <span className="text-[10px] text-emerald-400 font-bold font-mono">Active</span>
                      ) : (
                        <button
                          onClick={() => toggleStatus(a.id, a.status)}
                          className={`inline-flex items-center gap-1 hover:bg-neutral-800 px-2 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                            a.status === 'active' ? 'text-emerald-400' : 'text-neutral-500'
                          }`}
                        >
                          {a.status === 'active' ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-emerald-400" /> Active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-neutral-500" /> Blocked
                            </>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => startEdit(a)}
                          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {a.id !== 1 && (
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-1 hover:bg-neutral-800 rounded text-rose-500 hover:text-rose-400 transition cursor-pointer"
                            title="Remove Admin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
