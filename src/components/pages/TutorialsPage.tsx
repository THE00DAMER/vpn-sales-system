import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Save } from 'lucide-react';
import { Tutorial } from '../../types';

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tutorial>>({});

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const res = await fetch('/api/tutorials');
      const data = await res.json();
      setTutorials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tut: Tutorial) => {
    setEditingId(tut.id);
    setEditForm(tut);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await fetch(`/api/tutorials/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        });
      } else {
        await fetch('/api/tutorials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        });
      }
      handleCancel();
      fetchTutorials();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tutorial?')) return;
    try {
      await fetch(`/api/tutorials/${id}`, { method: 'DELETE' });
      fetchTutorials();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = () => {
    setEditingId(0);
    setEditForm({
      title_en: '',
      title_fa: '',
      description_en: '',
      description_fa: '',
      category: 'General',
      active: 1
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-500" /> Support Tutorials
        </h2>
        <button
          onClick={handleAdd}
          className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Add Tutorial
        </button>
      </div>

      <p className="text-neutral-400 text-sm">
        Manage the text-based setup tutorials for different software. These will be sent to the user when they click the "Text Setup Guides" button. Note: The video tutorials link is configured in Bot Settings.
      </p>

      {editingId !== null && (
        <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 space-y-4 shadow-xl">
          <h3 className="text-white font-semibold flex items-center gap-2">
            {editingId === 0 ? 'Add New Tutorial' : 'Edit Tutorial'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-400">Title (English)</label>
              <input type="text" value={editForm.title_en || ''} onChange={e => setEditForm({ ...editForm, title_en: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Title (Farsi)</label>
              <input type="text" value={editForm.title_fa || ''} onChange={e => setEditForm({ ...editForm, title_fa: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1 text-right" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Status</label>
              <select value={editForm.active || 0} onChange={e => setEditForm({ ...editForm, active: parseInt(e.target.value) })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Category</label>
              <input type="text" value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Content (English)</label>
              <textarea value={editForm.description_en || ''} onChange={e => setEditForm({ ...editForm, description_en: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1 h-32" placeholder="Write step-by-step instructions..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400">Content (Farsi)</label>
              <textarea value={editForm.description_fa || ''} onChange={e => setEditForm({ ...editForm, description_fa: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 text-white p-2 rounded mt-1 h-32 text-right" placeholder="آموزش مرحله به مرحله..." />
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
        <div className="text-emerald-500 animate-pulse">Loading tutorials...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tutorials.map(tut => (
            <div key={tut.id} className={`p-4 border rounded-xl bg-neutral-900 relative ${tut.active ? 'border-neutral-800' : 'border-neutral-800 opacity-50'}`}>
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => handleEdit(tut)} className="text-neutral-400 hover:text-emerald-400 transition p-1"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(tut.id)} className="text-neutral-400 hover:text-red-400 transition p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
              <h3 className="text-white font-bold">{tut.title_en} / {tut.title_fa}</h3>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded mt-1 inline-block mb-3">{tut.category}</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p className="text-xs text-neutral-400 whitespace-pre-wrap bg-neutral-950 p-2 rounded">{tut.description_en}</p>
                <p className="text-xs text-neutral-400 whitespace-pre-wrap bg-neutral-950 p-2 rounded text-right">{tut.description_fa}</p>
              </div>
            </div>
          ))}
          {tutorials.length === 0 && (
            <div className="col-span-full text-center py-12 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
              No tutorials added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
