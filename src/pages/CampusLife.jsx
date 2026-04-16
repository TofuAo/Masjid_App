import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campusLifeAPI } from '../services/api';
import { getEffectiveRole } from '../utils/userRoles';
import { toast } from 'react-toastify';
import {
  Plus,
  Calendar,
  Clock,
  User,
  Tag,
  FileText,
  BarChart3,
  Activity,
  RefreshCw,
  Inbox,
} from 'lucide-react';

const statusLabels = {
  pending: { label: 'Menunggu Kelulusan', icon: '⏳' },
  approved: { label: 'Diluluskan', icon: '✓' },
  rejected: { label: 'Ditolak', icon: '✗' },
};

const CampusLife = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    details: '',
    tarikh: '',
    hari: '',
    masa: '',
    target_role: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const effectiveRole = getEffectiveRole(JSON.parse(localStorage.getItem('user') || '{}'));
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'pic';

  const loadItems = async () => {
    setLoading(true);
    try {
      const [resAll, resPending, resApproved, resRejected] = await Promise.all([
        campusLifeAPI.list({}).catch(() => ({ data: { data: [] } })),
        campusLifeAPI.list({ status: 'pending' }).catch(() => ({ data: { data: [] } })),
        campusLifeAPI.list({ status: 'approved' }).catch(() => ({ data: { data: [] } })),
        campusLifeAPI.list({ status: 'rejected' }).catch(() => ({ data: { data: [] } })),
      ]);
      const all = resAll?.data?.data ?? resAll?.data ?? [];
      const pending = resPending?.data?.data ?? resPending?.data ?? [];
      const approved = resApproved?.data?.data ?? resApproved?.data ?? [];
      const rejected = resRejected?.data?.data ?? resRejected?.data ?? [];
      setCounts({
        total: Array.isArray(all) ? all.length : 0,
        pending: Array.isArray(pending) ? pending.length : 0,
        approved: Array.isArray(approved) ? approved.length : 0,
        rejected: Array.isArray(rejected) ? rejected.length : 0,
      });

      const res = await campusLifeAPI.list({ status: statusFilter || undefined });
      const list = res?.data?.data ?? res?.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuatkan senarai.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.warning('Sila masukkan tajuk.');
      return;
    }
    setSubmitting(true);
    try {
      await campusLifeAPI.create(formData);
      toast.success('Rekod berjaya ditambah. Menunggu kelulusan.');
      setFormData({ title: '', details: '', tarikh: '', hari: '', masa: '', target_role: '' });
      setShowForm(false);
      loadItems();
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  const filters = [
    { id: '', label: 'Semua', icon: FileText },
    { id: 'pending', label: 'Menunggu Kelulusan', icon: Clock },
    { id: 'approved', label: 'Diluluskan', icon: FileText },
    { id: 'rejected', label: 'Ditolak', icon: FileText },
  ];

  return (
    <div className="flex min-h-0 flex-1">
      {/* Main Content - 8 columns */}
      <div className="flex-1 min-w-0 p-6 lg:p-8 flex flex-col gap-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#f9fafb' }}>
              Kehidupan Kampus
            </h1>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Urus aktiviti dan rekod kehidupan kampus. Rekod baru menunggu kelulusan pentadbir.
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Link
                to="/portal/inbox"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{ border: '1px solid #374151', color: '#9ca3af' }}
              >
                <Inbox className="w-4 h-4" />
                Inbox Kelulusan
              </Link>
            )}
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{ background: '#16a34a', color: 'white' }}
            >
              <Plus className="w-4 h-4" />
              Tambah Rekod
            </button>
          </div>
        </div>

        {/* Status Overview Cards (4 tiles) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'total', label: 'Jumlah Rekod', value: counts.total },
            { key: 'pending', label: 'Menunggu', value: counts.pending },
            { key: 'approved', label: 'Diluluskan', value: counts.approved },
            { key: 'rejected', label: 'Ditolak', value: counts.rejected },
          ].map(({ key, label, value }) => (
            <div key={key} className="fm-status-tile" data-indicator={key}>
              <div className="text-xs font-semibold uppercase mb-1" style={{ color: '#9ca3af' }}>
                {label}
              </div>
              <div className="text-2xl font-extrabold" style={{ color: '#f9fafb' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-3">
          {filters.map(({ id, label }) => (
            <button
              key={id || 'all'}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`fm-chip ${statusFilter === id ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Main Records Area */}
        <div className="flex-1 min-h-0">
          {showForm && (
            <div className="fm-card mb-6">
              <h3 className="font-semibold mb-4" style={{ color: '#f9fafb' }}>Tambah Rekod Baru</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>Tajuk *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a]"
                    style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                    placeholder="Tajuk"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>Butiran</label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => setFormData((p) => ({ ...p, details: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a]"
                    style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                    rows={3}
                    placeholder="Butiran"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>Tarikh</label>
                    <input
                      type="date"
                      value={formData.tarikh}
                      onChange={(e) => setFormData((p) => ({ ...p, tarikh: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a]"
                      style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>Hari</label>
                    <input
                      type="text"
                      value={formData.hari}
                      onChange={(e) => setFormData((p) => ({ ...p, hari: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a]"
                      style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                      placeholder="e.g. Isnin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>Masa</label>
                    <input
                      type="text"
                      value={formData.masa}
                      onChange={(e) => setFormData((p) => ({ ...p, masa: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a]"
                      style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                      placeholder="e.g. 09:00 - 10:00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: '#9ca3af' }}>
                    <Tag className="w-4 h-4" />
                    Tag (Keterlihatan)
                  </label>
                  <select
                    value={formData.target_role || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, target_role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#16a34a]"
                    style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                  >
                    <option value="">All</option>
                    <option value="pelajar">Pelajar</option>
                    <option value="guru">Guru</option>
                    <option value="pilihan">Pilihan</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-all duration-150"
                    style={{ background: '#16a34a', color: 'white' }}
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                    style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af' }}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="fm-card h-20 animate-pulse" />
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="fm-card group">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold" style={{ color: '#f9fafb' }}>{item.title}</h4>
                      {item.details && (
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: '#9ca3af' }}>{item.details}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: '#6b7280' }}>
                        {item.tarikh && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {item.tarikh}
                          </span>
                        )}
                        {item.masa && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {item.masa}
                          </span>
                        )}
                        {item.created_by_nama && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {item.created_by_nama}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                      style={{
                        background: item.status === 'approved' ? 'rgba(22,163,74,0.2)' : item.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: item.status === 'approved' ? '#16a34a' : item.status === 'rejected' ? '#ef4444' : '#f59e0b',
                      }}
                    >
                      {statusLabels[item.status]?.label || item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="fm-empty-state">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#1f2937' }}>
                <FileText className="w-8 h-8" style={{ color: '#6b7280' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#f9fafb' }}>Tiada Rekod Dijumpai</h3>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
                Mulakan dengan menambah rekod kehidupan kampus. Rekod baru akan menunggu kelulusan pentadbir.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-150"
                  style={{ background: '#16a34a', color: 'white' }}
                >
                  <Plus className="w-4 h-4" />
                  Tambah Rekod
                </button>
                <button
                  type="button"
                  onClick={loadItems}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-150"
                  style={{ border: '1px solid #374151', color: '#9ca3af' }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Muat Semula
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Insight Panel - 300px */}
      <aside className="fm-insight-panel hidden xl:flex flex-col">
        <section>
          <h3 className="text-xs font-bold uppercase mb-3 flex items-center gap-2" style={{ color: '#9ca3af' }}>
            <Plus className="w-4 h-4" />
            Tindakan Pantas
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-[#1e293b]"
              style={{ color: '#f9fafb' }}
            >
              + Tambah Rekod
            </button>
            {isAdmin && (
              <Link
                to="/portal/inbox"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-[#1e293b]"
                style={{ color: '#f9fafb' }}
              >
                <Inbox className="w-4 h-4" />
                Inbox Kelulusan
              </Link>
            )}
          </div>
        </section>
        <div className="border-t" style={{ borderColor: '#1f2937' }} />
        <section>
          <h3 className="text-xs font-bold uppercase mb-3 flex items-center gap-2" style={{ color: '#9ca3af' }}>
            <BarChart3 className="w-4 h-4" />
            Statistik Ringkas
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: '#9ca3af' }}>Jumlah</span>
              <span style={{ color: '#f9fafb' }}>{counts.total}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9ca3af' }}>Menunggu</span>
              <span style={{ color: '#f59e0b' }}>{counts.pending}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9ca3af' }}>Diluluskan</span>
              <span style={{ color: '#16a34a' }}>{counts.approved}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9ca3af' }}>Ditolak</span>
              <span style={{ color: '#ef4444' }}>{counts.rejected}</span>
            </div>
          </div>
        </section>
        <div className="border-t" style={{ borderColor: '#1f2937' }} />
        <section>
          <h3 className="text-xs font-bold uppercase mb-3 flex items-center gap-2" style={{ color: '#9ca3af' }}>
            <Activity className="w-4 h-4" />
            Aktiviti Terkini
          </h3>
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.slice(0, 3).map((item) => (
                <div key={item.id} className="text-sm py-2 border-b border-[#1f2937] last:border-0">
                  <p className="font-medium truncate" style={{ color: '#f9fafb' }}>{item.title}</p>
                  <p className="text-xs truncate" style={{ color: '#6b7280' }}>{item.tarikh || item.created_by_nama}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#6b7280' }}>Tiada aktiviti terkini.</p>
          )}
        </section>
      </aside>
    </div>
  );
};

export default CampusLife;
