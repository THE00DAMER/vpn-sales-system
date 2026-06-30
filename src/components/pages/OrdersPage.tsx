/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, RefreshCw, PlusCircle, Trash2, Edit2 } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_username: string | null;
  customer_telegram: string | null;
  type: string;
  status: string;
  plan: string;
  location: string;
  discount_code: string | null;
  total_amount: number;
  currency: string;
  admin_notes: string;
  created_at: string;
}

export default function OrdersPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form
  const [customerId, setCustomerId] = useState('');
  const [plan, setPlan] = useState('silver_monthly');
  const [location, setLocation] = useState('Germany');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editStatus, setEditStatus] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          plan,
          location,
          total_amount: amount,
          admin_notes: notes
        })
      });
      if (res.ok) {
        setShowAddForm(false);
        setCustomerId('');
        setAmount('');
        setNotes('');
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (o: Order) => {
    setEditingId(o.id);
    setEditPlan(o.plan);
    setEditLocation(o.location);
    setEditAmount(o.total_amount);
    setEditStatus(o.status);
  };

  const handleUpdateOrder = async (id: number) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: editPlan,
          location: editLocation,
          total_amount: editAmount,
          status: editStatus
        })
      });
      if (res.ok) {
        setEditingId(null);
        fetchOrders();
      } else {
        alert("Failed to update order.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating order.");
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this order? All billing associated details will be purged.")) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchOrders();
      } else {
        alert("Failed to delete order.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting order.");
    }
  };
  const filtered = orders.filter(o => {
    const term = search.toLowerCase();
    const matchesSearch = 
      o.order_number.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      (o.customer_username && o.customer_username.toLowerCase().includes(term)) ||
      o.location.toLowerCase().includes(term) ||
      o.plan.toLowerCase().includes(term);

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && o.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Billing Purchases & Orders</h1>
          <p className="text-sm text-neutral-400">View and audit custom transaction order pipelines, create manual invoices, or set overrides.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold py-2 px-3 rounded-lg flex items-center gap-1.5 transition shadow"
        >
          <PlusCircle className="w-4 h-4" /> Create Manual Order
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddOrder} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Customer ID *</label>
            <input
              type="number" required value={customerId} onChange={e => setCustomerId(e.target.value)}
              placeholder="e.g. 1"
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Server Node Location</label>
            <select
              value={location} onChange={e => setLocation(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="Germany">Germany</option>
              <option value="Finland">Finland</option>
              <option value="Netherlands">Netherlands</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Plan</label>
            <select
              value={plan} onChange={e => setPlan(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="silver_monthly">Silver Monthly (100k)</option>
              <option value="gold_monthly">Gold 3-Month (300k)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Price Amount (IRR) *</label>
            <input
              type="number" required value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 1500000"
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
            />
          </div>
          <div className="md:col-span-4 space-y-1">
            <label className="font-semibold text-neutral-300">Internal Billing Notes</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 h-16"
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-2">
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
              Issue Invoice
            </button>
          </div>
        </form>
      )}

      {/* Filters Area */}
      <div className="flex flex-wrap gap-2 items-center justify-between text-xs">
        <div className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-neutral-800 bg-neutral-950 text-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-neutral-400 font-medium">Filter status:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-neutral-800 rounded px-2.5 py-1.5 bg-neutral-950 text-neutral-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending_payment">Pending Review</option>
            <option value="completed">Completed & Config Sent</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-950/40 border-b border-neutral-800 text-neutral-500">
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Order Number</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Buyer (Telegram)</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Server Location</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Plan Details</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Total Price</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Order Status</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Registered At</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-neutral-500 font-mono">Loading orders...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-neutral-500 font-mono">No matching orders found.</td>
                </tr>
              ) : (
                filtered.map(o => {
                  const isEditing = editingId === o.id;
                  return (
                    <tr key={o.id} className="hover:bg-neutral-800/20">
                      <td className="p-3 font-mono font-bold text-white">{o.order_number}</td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{o.customer_name}</div>
                        {o.customer_username && (
                          <div className="text-[10px] text-neutral-500">@{o.customer_username}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editLocation} onChange={e => setEditLocation(e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                          >
                            <option value="Germany">Germany</option>
                            <option value="Finland">Finland</option>
                            <option value="Netherlands">Netherlands</option>
                          </select>
                        ) : (
                          <span className="bg-neutral-950 text-neutral-300 px-2 py-0.5 rounded text-[10px] font-medium border border-neutral-800">
                            {o.location}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editPlan} onChange={e => setEditPlan(e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                          >
                            <option value="silver_monthly">Silver Monthly (100k)</option>
                            <option value="gold_monthly">Gold 3-Month (300k)</option>
                          </select>
                        ) : (
                          <span className="capitalize font-medium">{o.plan.replace('_', ' ')}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="number" value={editAmount} onChange={e => setEditAmount(parseInt(e.target.value) || 0)}
                            className="w-24 bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-mono font-bold"
                          />
                        ) : (
                          <span className="font-semibold text-white">
                            {o.total_amount.toLocaleString()} <span className="text-[10px] font-normal text-neutral-500 font-sans">IRR</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editStatus} onChange={e => setEditStatus(e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                          >
                            <option value="pending_payment">Pending Review</option>
                            <option value="completed">Completed & Config Sent</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                            o.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : o.status === 'pending_payment'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {o.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-neutral-500 font-mono">
                        {new Date(o.created_at).toLocaleDateString()} {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdateOrder(o.id)}
                                className="bg-emerald-500 text-black px-2 py-1 rounded hover:bg-emerald-400 font-extrabold transition text-[10px] cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="border border-neutral-800 text-neutral-300 px-2 py-1 rounded hover:bg-neutral-800 transition text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(o)}
                                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition cursor-pointer"
                                title="Edit Order"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(o.id)}
                                className="p-1 hover:bg-neutral-800 rounded text-rose-500 hover:text-rose-400 transition cursor-pointer"
                                title="Delete Order"
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
