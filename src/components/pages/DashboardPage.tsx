/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, ShieldAlert, Users, Ticket, Check, X, Eye, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  activeCustomers: number;
  pendingOrders: number;
  activeServices: number;
  openTickets: number;
  totalSales: number;
  salesChartData: Array<{ date: string; amount: number }>;
  recentLogs: Array<{ id: number; admin_id: number; action: string; entity_type: string; details: string; created_at: string }>;
  recentPayments: Array<{ id: number; order_number: string; amount: number; customer_name: string; status: string; created_at: string; receipt_file_path: string }>;
}

export default function DashboardPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handleApprove = async (paymentId: number) => {
    try {
      await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, notes: 'Approved via dashboard quick-action' })
      });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (paymentId: number) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await fetch('/api/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, reason })
      });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500 font-mono text-sm">Loading system statistics...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center text-red-500 font-semibold font-mono">Failed to load system dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Dashboard</h1>
          <p className="text-sm text-neutral-400">Real-time overview of Atlas VPN sales, active users, and billing receipts.</p>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-mono text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Sync Active
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Total Revenue</span>
            <span className="text-lg font-bold text-white">
              {(stats.totalSales ?? 0).toLocaleString()} <span className="text-xs text-neutral-500">IRR</span>
            </span>
          </div>
        </div>

        <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Active Services</span>
            <span className="text-lg font-bold text-white">{stats.activeServices}</span>
          </div>
        </div>

        <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Pending Payments</span>
            <span className="text-lg font-bold text-white">{stats.pendingOrders}</span>
          </div>
        </div>

        <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Open Tickets</span>
            <span className="text-lg font-bold text-white">{stats.openTickets}</span>
          </div>
        </div>
      </div>

      {/* Analytics & Invoices Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-white">Sales Analytics (7 Days)</h3>
            <span className="text-xs text-neutral-500">Calculated in IRR</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a' }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '10px' }}
                  itemStyle={{ color: '#10b981', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Audits List */}
        <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-xl space-y-4">
          <h3 className="font-semibold text-sm text-white">Security Audit Logs</h3>
          <div className="space-y-3.5 max-h-[17rem] overflow-y-auto pr-1">
            {stats.recentLogs.map((log) => (
              <div key={log.id} className="text-xs flex flex-col gap-1 border-b border-neutral-800 pb-2.5 last:border-none">
                <div className="flex justify-between items-center">
                  <span className="font-mono bg-neutral-950 text-neutral-300 border border-neutral-800 px-1.5 py-0.5 rounded text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-neutral-300 leading-normal">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Reviews Queue */}
      <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-sm text-white">Pending Receipt Submissions</h3>
            <p className="text-xs text-neutral-400">Verify client screenshots uploaded via Telegram Bot to approve subscription delivery.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500">
                <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px]">Order Number</th>
                <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px]">Customer</th>
                <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px]">Receipt Screenshot</th>
                <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {stats.recentPayments.filter(p => p.status === 'submitted').length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 font-mono">
                    All clear! No pending billing receipt reviews.
                  </td>
                </tr>
              ) : (
                stats.recentPayments
                  .filter(p => p.status === 'submitted')
                  .map(p => (
                    <tr key={p.id}>
                      <td className="py-3 font-semibold text-white">{p.order_number}</td>
                      <td className="py-3">{p.customer_name}</td>
                      <td className="py-3 font-semibold text-white">{(p.amount ?? 0).toLocaleString()} IRR</td>
                      <td className="py-3 flex items-center gap-1.5 text-emerald-400 font-medium">
                        <FileText className="w-4 h-4" />
                        <span className="bg-neutral-950 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded text-[10px] font-mono">
                          Simulated Receipt
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-medium flex items-center gap-1 transition"
                            title="Approve & Auto-Provision VPN Config"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded font-medium flex items-center gap-1 transition"
                            title="Reject Payment & Message Customer"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
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
