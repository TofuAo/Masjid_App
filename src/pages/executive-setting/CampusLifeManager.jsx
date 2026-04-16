import React, { useState, useEffect } from 'react';
import { campusLifeAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Plus, FileText, Calendar, BookOpen, Building2, Trash2, Edit2 } from 'lucide-react';
import FileDropZone from '../../components/ui/FileDropZone';

const CATEGORIES = [
  { id: 'takwim', label: 'Takwim', icon: Calendar },
  { id: 'garis_panduan', label: 'Garis Panduan', icon: FileText },
  { id: 'modul', label: 'Modul', icon: BookOpen },
  { id: 'fasiliti', label: 'Fasiliti', icon: Building2 },
];

const CampusLifeManager = () => {
  const [activeTab, setActiveTab] = useState('takwim');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    details: '',
    category: 'takwim',
    target_role: '',
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await campusLifeAPI.list({ status: 'approved', category: activeTab });
      const list = res?.data?.data ?? res?.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Gagal memuatkan.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.warning('Tajuk diperlukan.');
      return;
    }
    setSubmitting(true);
    try {
      await campusLifeAPI.create({
        ...formData,
        category: activeTab,
      });
      toast.success('Rekod berjaya ditambah.');
      setFormData({ title: '', details: '', category: activeTab, target_role: '' });
      setFiles([]);
      setShowForm(false);
      loadItems();
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fm-card">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold" style={{ color: '#f9fafb' }}>
          Campus Life Manager
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#16a34a', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveTab(cat.id);
                setFormData((f) => ({ ...f, category: cat.id }));
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === cat.id
                  ? 'bg-[#16a34a] text-white'
                  : 'bg-[#1f2937] text-[#9ca3af] hover:text-[#f9fafb]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg" style={{ background: '#0f172a', border: '1px solid #1f2937' }}>
          <h3 className="font-medium mb-4" style={{ color: '#f9fafb' }}>
            Tambah {CATEGORIES.find((c) => c.id === activeTab)?.label}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                Tajuk *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                placeholder="Tajuk"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                Butiran
              </label>
              <textarea
                value={formData.details}
                onChange={(e) => setFormData((f) => ({ ...f, details: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                rows={3}
                placeholder="Butiran"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                Muat Naik Fail (pilihan)
              </label>
              <FileDropZone
                accept=".pdf,image/*"
                maxSize={5 * 1024 * 1024}
                onFiles={setFiles}
                hint="Seret fail ke sini. Maks 5MB."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#16a34a', color: 'white' }}
              >
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ border: '1px solid #374151', color: '#9ca3af' }}
              >
                Batal
              </button>
            </div>
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
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-4 rounded-lg"
              style={{ background: '#1f2937', border: '1px solid #374151' }}
            >
              <div>
                <h4 className="font-medium" style={{ color: '#f9fafb' }}>
                  {item.title}
                </h4>
                {item.details && (
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: '#9ca3af' }}>
                    {item.details}
                  </p>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="py-8 text-center" style={{ color: '#6b7280' }}>
              Tiada rekod dalam {CATEGORIES.find((c) => c.id === activeTab)?.label}.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CampusLifeManager;
