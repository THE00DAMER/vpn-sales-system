/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Gift, Plus, ToggleLeft, ToggleRight, Sparkles, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface TrialConfig {
  id: number;
  location: string;
  validity_hours: number;
  max_usage_total: number;
  current_usage: number;
  status: string;
  requires_approval: number;
  description: string;
  decrypted_link: string;
}

export default function TrialsPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [trials, setTrials] = useState<TrialConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form Fields
  const [location, setLocation] = useState('Germany');
  const [hours, setHours] = useState(24);
  const [maxUsage, setMaxUsage] = useState(100);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');

  const fetchTrials = async () => {
    try {
      const res = await fetch('/api/trials');
      const data = await res.json();
      setTrials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrials();
  }, [refreshTrigger]);

  const handleAddTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          validity_hours: hours,
          max_usage_total: maxUsage,
          requires_approval: requiresApproval ? 1 : 0,
          link,
          description
        })
      });
      if (res.ok) {
        setShowAdd(false);
        setLink('');
        setDescription('');
        fetchTrials();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleApprovalMode = async (id: number, currentMode: number) => {
    try {
      await fetch(`/api/trials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requires_approval: currentMode === 1 ? 0 : 1 })
      });
      fetchTrials();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrial = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this trial configuration?")) return;
    try {
      const res = await fetch(`/api/trials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTrials();
      } else {
        alert("Failed to delete trial configuration.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting trial configuration.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Trial Subscriptions</h1>
          <p className="text-sm text-neutral-400">Create disposable trial nodes, track overall usage quotas, and enable anti-spam approvals.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold py-2 px-3 rounded-lg flex items-center gap-1.5 transition shadow"
        >
          <Plus className="w-4 h-4" /> Configure New Trial
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddTrial} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Location Server</label>
            <input
              type="text" required value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Germany"
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 placeholder-neutral-700"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Validity Period (Hours)</label>
            <input
              type="number" required value={hours} onChange={e => setHours(parseInt(e.target.value) || 24)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-neutral-300">Max Usage Quota (Times)</label>
            <input
              type="number" required value={maxUsage} onChange={e => setMaxUsage(parseInt(e.target.value) || 100)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="font-semibold text-neutral-300">Trial VLESS Node Link</label>
            <input
              type="text" required value={link} onChange={e => setLink(e.target.value)}
              placeholder="vless://..."
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono placeholder-neutral-700"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="font-semibold text-neutral-300">Notes / Remarks</label>
            <input
              type="text" value={description} onChange={e => setDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox" checked={requiresApproval} onChange={e => setRequiresApproval(e.target.checked)}
              id="reqApp" className="w-4 h-4 text-emerald-500 bg-neutral-950 border-neutral-800 rounded focus:ring-emerald-500"
            />
            <label htmlFor="reqApp" className="font-semibold text-neutral-300 cursor-pointer select-none">
              Requires Manual Staff Approval
            </label>
          </div>
          <div className="md:col-span-3 flex justify-end gap-2">
            <button
              type="button" onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 border border-neutral-800 text-neutral-300 rounded hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 text-black font-extrabold rounded hover:bg-emerald-400 transition"
            >
              Save Trial Node
            </button>
          </div>
        </form>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="md:col-span-2 text-center py-8 text-neutral-500 font-mono text-xs">Loading trials...</div>
        ) : trials.length === 0 ? (
          <div className="md:col-span-2 text-center py-8 text-neutral-500 font-mono text-xs">No active trials found.</div>
        ) : (
          trials.map(t => (
            <div key={t.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl flex flex-col justify-between text-xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-neutral-950 text-emerald-400 border border-neutral-800 rounded-lg">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Trial Plan {t.location}</h3>
                    <span className="text-[10px] text-neutral-500 font-mono">ID: #{t.id} | Validity: {t.validity_hours}H</span>
                  </div>
                </div>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    t.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded font-mono text-[10px] text-neutral-400 select-all overflow-x-auto">
                {t.decrypted_link || '—'}
              </div>

              <p className="text-neutral-400 leading-relaxed italic">{t.description || 'No description provided.'}</p>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <div className="text-[11px] text-neutral-400">
                  Usage: <span className="font-bold text-white font-mono">{t.current_usage}</span> / {t.max_usage_total} allocations
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleApprovalMode(t.id, t.requires_approval)}
                    className="flex items-center gap-1.5 hover:bg-neutral-800 px-2 py-1.5 rounded text-neutral-300 font-semibold transition text-[10px] cursor-pointer"
                  >
                    {t.requires_approval === 1 ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                        <span>Approval: Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-neutral-500" />
                        <span>Approval: Disabled</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteTrial(t.id)}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-neutral-800 text-rose-500 hover:text-rose-400 transition text-[10px] cursor-pointer font-semibold"
                    title="Delete Trial Config"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
