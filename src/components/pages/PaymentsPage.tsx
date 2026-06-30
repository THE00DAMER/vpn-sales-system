/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Check, X, Eye, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface Payment {
  id: number;
  order_id: number;
  order_number: string;
  plan: string;
  amount: number;
  customer_name: string;
  payment_method_id: string;
  receipt_file_path: string | null;
  tracking_ref: string;
  admin_id: number | null;
  status: string;
  rejection_reason: string | null;
  notes: string;
  created_at: string;
  reviewed_at: string | null;
}

export default function PaymentsPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customLinks, setCustomLinks] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [refreshTrigger]);

  const handleApprove = async (id: number) => {
    try {
      const customLink = customLinks[id] || '';
      const res = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: id, notes: 'Approved and manual VPN link dispatched.', custom_link: customLink })
      });
      if (res.ok) fetchPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Enter billing rejection reason (will be messaged to user via bot):");
    if (reason === null) return;
    try {
      const res = await fetch('/api/payments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: id, reason })
      });
      if (res.ok) fetchPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this payment receipt? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPayments();
      } else {
        alert("Failed to delete payment receipt.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting payment receipt.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Payment Auditing & Verification</h1>
        <p className="text-sm text-neutral-400">Cross-reference incoming customer transfers, approve verified receipts, and trigger automated service links.</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-950/40 border-b border-neutral-800 text-neutral-500">
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Payment Details</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Customer</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Transfer Method</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Verification Proof</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px]">Status & Auditor</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 font-mono">Loading payment submissions...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 font-mono">No payment transaction records found.</td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-800/20">
                    <td className="p-3">
                      <div className="font-semibold text-white">Order: {p.order_number}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">ID: #{p.id}</div>
                      <div className="text-neutral-300 capitalize font-medium mt-1">{p.plan.replace('_', ' ')}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-white">{p.customer_name}</span>
                    </td>
                    <td className="p-3">
                      <span className="uppercase text-[10px] bg-neutral-950 text-neutral-300 px-2 py-0.5 rounded font-bold border border-neutral-800">
                        {p.payment_method_id}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-emerald-400 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Receipt proof submitted
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">Ref: {p.tracking_ref}</span>
                      </div>
                    </td>
                    <td className="p-3 space-y-1">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                          p.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : p.status === 'submitted'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {p.status === 'approved' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : p.status === 'rejected' ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : null}
                          {p.status}
                        </span>
                      </div>
                      {p.admin_id && (
                        <div className="text-[10px] text-neutral-500 font-mono">Audited by Admin #{p.admin_id}</div>
                      )}
                      {p.rejection_reason && (
                        <div className="text-[10px] text-rose-400 bg-rose-950 border border-rose-900/40 p-1.5 rounded max-w-xs">{p.rejection_reason}</div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {p.status === 'submitted' ? (
                          <div className="flex flex-col gap-1.5 items-end justify-end">
                            <input
                              type="text"
                              placeholder="VLESS / Config Link (Optional)"
                              value={customLinks[p.id] || ''}
                              onChange={e => setCustomLinks(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-emerald-400 placeholder-neutral-700 w-44 font-mono focus:outline-none focus:border-emerald-500"
                            />
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => handleApprove(p.id)}
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-semibold transition flex items-center gap-0.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(p.id)}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2 py-1 rounded font-semibold transition flex items-center gap-0.5 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-500 font-mono">—</span>
                        )}
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1.5 hover:bg-neutral-800 rounded text-rose-500 hover:text-rose-400 transition cursor-pointer"
                          title="Delete Receipt Proof"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
