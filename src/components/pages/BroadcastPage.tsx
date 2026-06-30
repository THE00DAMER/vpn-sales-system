/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Sparkles, Filter, Trash, Zap } from 'lucide-react';

interface Broadcast {
  id: number;
  message_en: string;
  message_fa: string;
  status: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export default function BroadcastPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Compose Form
  const [messageEn, setMessageEn] = useState('');
  const [messageFa, setMessageFa] = useState('');
  const [filter, setFilter] = useState('all');
  const [isSending, setIsSending] = useState(false);

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch('/api/broadcast');
      const data = await res.json();
      setBroadcasts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, [refreshTrigger]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageEn.trim() || !messageFa.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_en: messageEn,
          message_fa: messageFa,
          filter
        })
      });
      if (res.ok) {
        setMessageEn('');
        setMessageFa('');
        fetchBroadcasts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Broadcast Dispatcher</h1>
        <p className="text-sm text-neutral-400">Dispatch system updates or targeted alerts to all registered Telegram bot subscribers instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
          <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" /> Compose New Targeted Message
          </h3>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-300 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-neutral-500" /> Target Audience Target
              </label>
              <select
                value={filter} onChange={e => setFilter(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="all">Broadcast to All Users</option>
                <option value="active">Active Service Customers Only</option>
                <option value="expiring">Subscribers Expiring in 3 Days</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Message Text (English 🇺🇸)</label>
                <textarea
                  required value={messageEn} onChange={e => setMessageEn(e.target.value)}
                  placeholder="Type English broadcast update..."
                  className="w-full h-36 bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg p-3 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans placeholder-neutral-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Message Text (Farsi/Persian 🇮🇷)</label>
                <textarea
                  required value={messageFa} onChange={e => setMessageFa(e.target.value)}
                  placeholder="متن پیام فارسی را وارد کنید..."
                  className="w-full h-36 bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg p-3 focus:outline-none focus:border-emerald-500 leading-relaxed text-right font-sans placeholder-neutral-700"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                type="submit" disabled={isSending}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2 px-4 rounded-lg shadow-xl flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> 
                {isSending ? 'Sending Broadcast...' : 'Dispatch Broadcast'}
              </button>
            </div>
          </form>
        </div>

        {/* History Panel */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
          <h3 className="font-semibold text-sm text-white">Dispatch History</h3>
          <div className="space-y-3.5 overflow-y-auto max-h-[22rem] text-xs">
            {loading ? (
              <div className="text-center py-8 text-neutral-500 font-mono">Loading history...</div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 font-mono">No previous broadcasts found.</div>
            ) : (
              broadcasts.map(b => (
                <div key={b.id} className="border-b border-neutral-800/60 pb-3 last:border-none space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                      {b.status}
                    </span>
                    <span className="text-neutral-500 font-mono">
                      {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white leading-relaxed font-medium line-clamp-2" title={b.message_en}>
                    {b.message_en}
                  </p>
                  <p className="text-neutral-400 text-[10px] text-right truncate italic leading-relaxed" title={b.message_fa}>
                    {b.message_fa}
                  </p>
                  <div className="text-[10px] text-neutral-500 pt-1 flex justify-between font-mono">
                    <span>Sent: {b.sent_count} accounts</span>
                    {b.failed_count > 0 && <span className="text-rose-400">Failed: {b.failed_count}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
