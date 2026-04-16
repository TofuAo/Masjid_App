import React, { useState, useEffect } from 'react';
import { campusLifeAPI } from '../services/api';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Calendar, Clock, User, Inbox as InboxIcon, X, ChevronDown, ChevronUp } from 'lucide-react';

/** Inbox (Mailroom): Mail list + Detail with AI Summary + Approve/Reject toggle */
const Inbox = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [respon, setRespon] = useState('');
  const [filter, setFilter] = useState('pending'); // menunggu | semua

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = filter === 'semua' ? {} : { status: 'pending' };
      const res = await campusLifeAPI.list(params);
      const list = res?.data?.data ?? res?.data ?? [];
      const arr = Array.isArray(list) ? list : [];
      setItems(arr);
      if (arr.length > 0 && !selectedItem) setSelectedItem(arr[0]);
      else if (arr.length === 0) setSelectedItem(null);
    } catch (err) {
      toast.error('Gagal memuatkan senarai.');
      setItems([]);
      setSelectedItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [filter]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDecision = async (action) => {
    if (!selectedItem) return;
    const id = selectedItem.id;
    const notes = respon?.trim() || null;
    const remaining = items.filter((i) => i.id !== id);
    const nextItem = remaining[0] ?? null;

    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItem(nextItem);
    setRespon('');

    setPending(true);
    try {
      if (action === 'approve') {
        await campusLifeAPI.approve(id, { notes });
        toast.success('Rekod diluluskan.');
      } else {
        await campusLifeAPI.reject(id, { notes });
        toast.info('Rekod ditolak.');
      }
    } catch (err) {
      toast.error(err?.message || 'Gagal memproses.');
      loadItems();
    } finally {
      setPending(false);
    }
  };

  /** AI Summary placeholder - in future integrate with backend summarizer */
  const getAISummary = (item) => {
    const text = [item.title, item.details].filter(Boolean).join(' ');
    if (!text) return 'Tiada ringkasan.';
    return text.length > 150 ? text.slice(0, 150) + '...' : text;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: '#f9fafb' }}>
          Inbox
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === 'pending' ? 'bg-[#16a34a] text-white' : 'bg-[#1f2937] text-[#9ca3af]'
            }`}
          >
            Menunggu
          </button>
          <button
            type="button"
            onClick={() => setFilter('semua')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === 'semua' ? 'bg-[#16a34a] text-white' : 'bg-[#1f2937] text-[#9ca3af]'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="fm-card">
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#f9fafb' }}>
            <InboxIcon className="w-5 h-5" />
            Senarai ({items.length})
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: '#1f2937' }} />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedItem(item);
                    setExpandedId(item.id);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedItem?.id === item.id
                      ? 'bg-[#16a34a]/20 border border-[#16a34a]'
                      : 'border border-transparent hover:bg-[#1f2937]'
                  }`}
                  style={{ borderColor: selectedItem?.id === item.id ? '#16a34a' : '#1f2937' }}
                >
                  <p className="font-medium truncate" style={{ color: '#f9fafb' }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                    {item.created_by_nama || '—'} • {item.tarikh || '—'}
                  </p>
                </button>
              ))}
              {items.length === 0 && (
                <p className="text-center py-8" style={{ color: '#6b7280' }}>Tiada item.</p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 fm-card">
          {selectedItem ? (
            <div>
              <div
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleExpand(selectedItem.id)}
              >
                <h3 className="text-lg font-semibold" style={{ color: '#f9fafb' }}>
                  {selectedItem.title}
                </h3>
                {expandedId === selectedItem.id ? (
                  <ChevronUp className="w-5 h-5" style={{ color: '#9ca3af' }} />
                ) : (
                  <ChevronDown className="w-5 h-5" style={{ color: '#9ca3af' }} />
                )}
              </div>
              {expandedId === selectedItem.id && (
                <>
                  <div className="mt-4 p-3 rounded-lg" style={{ background: '#0f172a', border: '1px solid #1f2937' }}>
                    <p className="text-xs font-medium uppercase mb-1" style={{ color: '#6b7280' }}>
                      Ringkasan (AI)
                    </p>
                    <p className="text-sm" style={{ color: '#9ca3af' }}>
                      {getAISummary(selectedItem)}
                    </p>
                  </div>
                  {selectedItem.details && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase mb-1" style={{ color: '#6b7280' }}>Butiran</p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: '#9ca3af' }}>{selectedItem.details}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 mt-4 text-sm" style={{ color: '#6b7280' }}>
                    {selectedItem.tarikh && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {selectedItem.tarikh}
                      </span>
                    )}
                    {selectedItem.masa && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedItem.masa}
                      </span>
                    )}
                    {selectedItem.created_by_nama && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedItem.created_by_nama}
                      </span>
                    )}
                  </div>

                  {selectedItem.status === 'pending' && (
                    <div className="mt-6 pt-4" style={{ borderTop: '1px solid #1f2937' }}>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#9ca3af' }}>
                        Respon (pilihan)
                      </label>
                      <textarea
                        value={respon}
                        onChange={(e) => setRespon(e.target.value)}
                        placeholder="Tambah catatan..."
                        className="w-full px-3 py-2 rounded-lg text-sm mb-4"
                        style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
                        rows={2}
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleDecision('approve')}
                          disabled={pending}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#16a34a] text-white disabled:opacity-60"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Lulus
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision('reject')}
                          disabled={pending}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#ef4444] text-white disabled:opacity-60"
                        >
                          <XCircle className="w-4 h-4" />
                          Tolak
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="py-12 text-center" style={{ color: '#6b7280' }}>
              Pilih item dari senarai untuk melihat butiran dan meluluskan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
