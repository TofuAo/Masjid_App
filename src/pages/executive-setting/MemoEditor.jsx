import React, { useState, useEffect } from 'react';
import { memoAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { StickyNote, Plus, Trash2 } from 'lucide-react';

const MemoEditor = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      const res = await memoAPI.list({
        start_date: today.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      });
      setEntries(res?.data ?? []);
    } catch (err) {
      toast.error('Gagal memuatkan memo.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      toast.warning('Tarikh mula dan tamat diperlukan.');
      return;
    }
    setSubmitting(true);
    try {
      await memoAPI.create(formData);
      toast.success('Memo berjaya ditambah.');
      setFormData({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        content: '',
      });
      setShowForm(false);
      loadEntries();
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Padam memo ini?')) return;
    try {
      await memoAPI.delete(id);
      toast.success('Memo dipadam.');
      loadEntries();
    } catch (err) {
      toast.error(err?.message || 'Gagal memadam.');
    }
  };

  return (
    <div className="fm-card">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#f9fafb' }}>
          <StickyNote className="w-5 h-5" />
          Memo/Nota Editor
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#16a34a', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          Tambah Memo
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
        Entri dipaparkan pada ribbon 14 hari di header. Tiada muat naik fail - teks sahaja.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg space-y-4" style={{ background: '#0f172a', border: '1px solid #1f2937' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>Tarikh Mula</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>Tarikh Tamat</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>Kandungan</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((f) => ({ ...f, content: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
              rows={3}
              placeholder="Teks memo..."
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#16a34a] text-white">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1px solid #374151', color: '#9ca3af' }}>
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: '#1f2937' }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-start justify-between p-4 rounded-lg"
              style={{ background: '#1f2937', border: '1px solid #374151' }}
            >
              <div>
                <span className="text-xs font-medium" style={{ color: '#6b7280' }}>
                  {e.start_date} → {e.end_date}
                </span>
                <p className="mt-1 text-sm" style={{ color: '#f9fafb' }}>{e.content || '—'}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(e.id)}
                className="p-1.5 rounded hover:bg-red-500/20"
                style={{ color: '#ef4444' }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="py-8 text-center" style={{ color: '#6b7280' }}>Tiada memo.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoEditor;
