/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Archive, Download, Trash2, ShieldCheck, HardDrive, RefreshCw } from 'lucide-react';

interface BackupRecord {
  id: number;
  file_path: string;
  size: number;
  type: string;
  created_at: string;
}

export default function BackupPage({ refreshTrigger }: { refreshTrigger: number }) {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      setBackups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [refreshTrigger]);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/backups', { method: 'POST' });
      if (res.ok) fetchBackups();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this backup archive?")) return;
    try {
      const res = await fetch(`/api/backups/${id}`, { method: 'DELETE' });
      if (res.ok) fetchBackups();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Database Backups</h1>
          <p className="text-sm text-neutral-400 font-sans">Backup or restore SQLite system database states, download encrypted archives, or setup automated cron targets.</p>
        </div>
        <button
          onClick={handleCreate} disabled={isCreating}
          className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold py-2 px-4 rounded-lg flex items-center gap-1.5 transition shadow disabled:opacity-50"
        >
          <Archive className="w-4 h-4" /> {isCreating ? 'Archiving State...' : 'Create Backup Archive'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Table Panel */}
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 font-bold text-neutral-200">
            Available ZIP Backups Directory
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-850 text-neutral-500 font-semibold font-mono text-[10px]">
                  <th className="p-3">Backup File Path</th>
                  <th className="p-3">Archive Size</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850 text-neutral-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-neutral-500 font-mono">Loading backup catalog...</td>
                  </tr>
                ) : backups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-neutral-500 font-mono">No backup logs registered yet.</td>
                  </tr>
                ) : (
                  backups.map(b => (
                    <tr key={b.id} className="hover:bg-neutral-950/40">
                      <td className="p-3 font-mono font-bold text-white truncate max-w-[12rem]" title={b.file_path}>
                        {b.file_path.split('/').pop()}
                      </td>
                      <td className="p-3 font-medium font-mono">{(b.size / 1024).toFixed(2)} KB</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          b.type === 'manual' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}>
                          {b.type}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-400 font-mono">
                        {new Date(b.created_at).toLocaleDateString()} {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-1.5">
                          {/* Simulated download click triggers alert of security backup */}
                          <button
                            onClick={() => alert(`Simulated secure file download initiated for backup: ${b.file_path}`)}
                            className="p-1 hover:bg-neutral-850 rounded text-neutral-400 hover:text-white transition"
                            title="Download ZIP Archive"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1 hover:bg-neutral-850 rounded text-rose-400 hover:text-rose-300 transition"
                            title="Delete Archive"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Right Info Panels */}
        <div className="space-y-6">
          {/* Recovery Panel */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-xl space-y-4">
            <h3 className="font-semibold text-sm text-white flex items-center gap-1.5 font-sans">
              <HardDrive className="w-4 h-4 text-emerald-400" /> Storage Capacity Audit
            </h3>
            <div className="space-y-2 text-neutral-300">
              <div className="flex justify-between py-1 border-b border-neutral-850 font-medium">
                <span>Database Engine:</span>
                <span className="font-mono text-white font-bold">SQLiteWAL (Emu)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-850 font-medium">
                <span>Backup Directory:</span>
                <span className="font-mono text-emerald-400 font-bold">Writable</span>
              </div>
              <div className="flex justify-between py-1 font-medium">
                <span>Disks Encryption:</span>
                <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> AES-255 ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
