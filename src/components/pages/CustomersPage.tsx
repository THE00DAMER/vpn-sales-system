/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, Award, Tags } from 'lucide-react';
import { Customer } from '../../types';

export default function CustomersPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<'en' | 'fa'>('en');
  const [notes, setNotes] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editLoyaltyPoints, setEditLoyaltyPoints] = useState(0);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTelegramId, setEditTelegramId] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editLanguage, setEditLanguage] = useState<'en' | 'fa'>('en');
  const [editStatus, setEditStatus] = useState<'active' | 'blocked'>('active');
  const [editTagsString, setEditTagsString] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [refreshTrigger]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          username,
          first_name: firstName,
          last_name: lastName,
          phone,
          language,
          notes
        })
      });
      if (res.ok) {
        setShowAddForm(false);
        setFirstName('');
        setLastName('');
        setUsername('');
        setTelegramId('');
        setPhone('');
        setNotes('');
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this customer record?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setEditNotes(c.notes || '');
    setEditLoyaltyPoints(c.loyalty_points || 0);
    setEditFirstName(c.first_name || '');
    setEditLastName(c.last_name || '');
    setEditPhone(c.phone || '');
    setEditTelegramId(c.telegram_id || '');
    setEditUsername(c.username || '');
    setEditLanguage(c.language || 'en');
    setEditStatus(c.status || 'active');
    setEditTagsString(c.tags ? c.tags.join(', ') : '');
  };

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          phone: editPhone,
          telegram_id: editTelegramId,
          username: editUsername,
          language: editLanguage,
          status: editStatus,
          notes: editNotes,
          loyalty_points: editLoyaltyPoints,
          tags: editTagsString.split(',').map(t => t.trim()).filter(t => t !== '')
        })
      });
      if (res.ok) {
        setEditingId(null);
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = customers.filter(c => {
    const term = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(term) ||
      c.last_name.toLowerCase().includes(term) ||
      c.telegram_id.includes(term) ||
      (c.username && c.username.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Registered Customers</h1>
          <p className="text-sm text-neutral-400">Track and manage users registered with the billing bot, set tags and loyalty balances.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold py-2 px-3 rounded-lg flex items-center gap-1.5 transition shadow"
        >
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">First Name *</label>
            <input
              type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Last Name</label>
            <input
              type="text" value={lastName} onChange={e => setLastName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Telegram Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Telegram ID (Numerical)</label>
            <input
              type="text" value={telegramId} onChange={e => setTelegramId(e.target.value)}
              placeholder="e.g. 5509210"
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Phone</label>
            <input
              type="text" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +98912..."
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Language</label>
            <select
              value={language} onChange={e => setLanguage(e.target.value as 'en' | 'fa')}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="en">English (en)</option>
              <option value="fa">Persian (fa)</option>
            </select>
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="font-semibold text-neutral-300">Admin Staff Notes</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 h-16"
            />
          </div>
          <div className="md:col-span-3 flex justify-end gap-2">
            <button
              type="button" onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 border border-neutral-800 text-neutral-300 rounded hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 text-black font-extrabold rounded hover:bg-emerald-400 transition"
            >
              Save Customer
            </button>
          </div>
        </form>
      )}

      {/* Search Filter */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, username or telegram ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-800 bg-neutral-950 text-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-950/40 border-b border-neutral-800 text-neutral-500">
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">User Details</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Telegram Info</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Language / Status</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Tags & Loyalty</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Admin Notes</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 font-mono">Loading customers...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 font-mono">No matching customers found.</td>
                </tr>
              ) : (
                filtered.map(c => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className="hover:bg-neutral-800/20">
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1 w-32">
                            <input
                              type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)}
                              placeholder="First Name"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)}
                              placeholder="Last Name"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                              placeholder="Phone"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-white">
                              {c.first_name} {c.last_name}
                            </div>
                            <div className="text-[10px] text-neutral-500">{c.phone || 'No phone'}</div>
                          </>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1 w-32">
                            <input
                              type="text" value={editTelegramId} onChange={e => setEditTelegramId(e.target.value)}
                              placeholder="Telegram ID"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <input
                              type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                              placeholder="Username"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-mono text-neutral-400">{c.telegram_id}</div>
                            {c.username && (
                              <div className="text-[10px] text-emerald-400">@{c.username}</div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1 w-24">
                            <select
                              value={editLanguage} onChange={e => setEditLanguage(e.target.value as 'en' | 'fa')}
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            >
                              <option value="en">English (en)</option>
                              <option value="fa">Persian (fa)</option>
                            </select>
                            <select
                              value={editStatus} onChange={e => setEditStatus(e.target.value as 'active' | 'blocked')}
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            >
                              <option value="active">Active</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div>
                              <span className="uppercase text-[10px] bg-neutral-950 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 font-semibold font-mono">
                                {c.language}
                              </span>
                            </div>
                            <div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${
                                c.status === 'active' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1 w-36">
                            <input
                              type="text" value={editTagsString} onChange={e => setEditTagsString(e.target.value)}
                              placeholder="Tags (comma separated)"
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-emerald-500"
                            />
                            <div className="flex items-center gap-1 font-semibold text-amber-400 mt-1">
                              <Award className="w-3.5 h-3.5" /> 
                              <input
                                type="number" value={editLoyaltyPoints} onChange={e => setEditLoyaltyPoints(parseInt(e.target.value) || 0)}
                                className="w-16 border border-neutral-800 rounded px-1.5 py-0.5 bg-neutral-950 text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1">
                              {c.tags.map((tag, i) => (
                                <span key={i} className="bg-neutral-950 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 font-medium">
                                  <Tags className="w-2.5 h-2.5 text-neutral-500" /> {tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-amber-400">
                              <Award className="w-3.5 h-3.5" /> 
                              <span>{c.loyalty_points} pts</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <textarea
                            value={editNotes} onChange={e => setEditNotes(e.target.value)}
                            className="w-full border border-neutral-800 rounded p-1.5 text-xs bg-neutral-950 text-white focus:outline-none focus:border-emerald-500 h-16 min-w-[120px]"
                          />
                        ) : (
                          <p className="max-w-xs truncate text-neutral-400" title={c.notes}>
                            {c.notes || '—'}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdate(c.id)}
                                className="bg-emerald-500 text-black px-2.5 py-1 rounded hover:bg-emerald-400 font-extrabold transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="border border-neutral-800 text-neutral-300 px-2.5 py-1 rounded hover:bg-neutral-800 transition"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(c)}
                                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
                                title="Edit Loyalty/Notes"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-1 hover:bg-neutral-800 rounded text-rose-500 hover:text-rose-400 transition"
                                title="Remove Customer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
