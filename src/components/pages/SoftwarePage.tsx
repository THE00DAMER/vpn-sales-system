import React, { useState, useEffect } from 'react';
import { Download, Plus, Edit, Trash2, CheckCircle2, Save, X } from 'lucide-react';
import { SoftwareDownload } from '../../types';

export default function SoftwarePage() {
  const [software, setSoftware] = useState<SoftwareDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SoftwareDownload>>({});

  useEffect(() => {
    fetchSoftware();
  }, []);

  const fetchSoftware = async () => {
    try {
      const res = await fetch('/api/software');
      const data = await res.json();
      setSoftware(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sw: SoftwareDownload) => {
    setEditingId(sw.id);
    setEditForm(sw);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await fetch(`/api/software/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        });
      } else {
        await fetch('/api/software', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        });
      }
      handleCancel();
      fetchSoftware();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this software download?')) return;
    try {
      await fetch(`/api/software/${id}`, { method: 'DELETE' });
      fetchSoftware();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = () => {
    setEditingId(0); // 0 means new
    setEditForm({
      name: '',
      os: 'Android',
      description_en: '',
      description_fa: '',
      direct_link: '',
      alt_link: '',
      version: '1.0.0',
      active: 1
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Download className="w-6 h-6 text-emerald-500" /> Software Downloads
        </h2>
        <button
          onClick={handleAdd}
          className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Add Software
        </button>
      </div>

      <p className="text-neutral-400 text-sm">
        Manage the applications available for users to download. These appear when users click the "Download Software" button in the bot.
      </p>

      {editingId !== null && (
        <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 space-y-4 shadow-xl">
          <h3 className="text-white font-semibold flex items-center gap-2">
            {editingId === 0 ? 'Add New Software' : 'Edit Software'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400">Software Name</label>
              <input type="text" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Operating System (OS)</label>
              <input type="text" value={editForm.os || ''} onChange={e => setEditForm({ ...editForm, os: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Version</label>
              <input type="text" value={editForm.version || ''} onChange={e => setEditForm({ ...editForm, version: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Status</label>
              <select value={editForm.active || 0} onChange={e => setEditForm({ ...editForm, active: parseInt(e.target.value) })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-neutral-400">Direct Link</label>
              <input type="text" value={editForm.direct_link || ''} onChange={e => setEditForm({ ...editForm, direct_link: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1 font-mono text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-neutral-400">Alternative / Store Link</label>
              <input type="text" value={editForm.alt_link || ''} onChange={e => setEditForm({ ...editForm, alt_link: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1 font-mono text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Description (English)</label>
              <textarea value={editForm.description_en || ''} onChange={e => setEditForm({ ...editForm, description_en: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1 h-20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Description (Farsi)</label>
              <textarea value={editForm.description_fa || ''} onChange={e => setEditForm({ ...editForm, description_fa: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1 h-20 text-right" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={handleCancel} className="text-neutral-400 hover:text-white px-4 py-2 font-medium">Cancel</button>
            <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2 rounded font-bold flex items-center gap-2">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-emerald-500 animate-pulse">Loading software...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {software.map(sw => (
            <div key={sw.id} className={`p-4 border rounded-xl bg-neutral-900 relative ${sw.active ? 'border-neutral-800' : 'border-neutral-800 opacity-50'}`}>
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => handleEdit(sw)} className="text-neutral-400 hover:text-emerald-400 transition p-1"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(sw.id)} className="text-neutral-400 hover:text-red-400 transition p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${sw.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                  {sw.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-bold">{sw.name} <span className="text-xs text-neutral-500 font-normal">v{sw.version}</span></h3>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">{sw.os}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mb-3 line-clamp-2">{sw.description_en}</p>
              <div className="space-y-1.5 text-xs font-mono">
                {sw.direct_link && <div className="text-blue-400 truncate">Dir: {sw.direct_link}</div>}
                {sw.alt_link && <div className="text-orange-400 truncate">Alt: {sw.alt_link}</div>}
              </div>
            </div>
          ))}
          {software.length === 0 && (
            <div className="col-span-full text-center py-12 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
              No software downloads added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
