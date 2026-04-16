import React, { useState, useEffect, useTransition } from 'react';
import { campusLifeAPI } from '../services/api';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Calendar, Clock, User, Inbox, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ModalPortal, useModalBodyScrollLock } from '../components/ui/ModalOverlay';

/**
 * Executive Approval Inbox - Admin views pending campus life items and approves/rejects.
 * Uses optimistic UI: item disappears immediately on Ya/Tidak click.
 */
const ExecutiveApprovals = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  useModalBodyScrollLock(modalOpen);

  const loadPending = async () => {
    try {
      const res = await campusLifeAPI.list({ status: 'pending' });
      const list = res?.data?.data ?? [];
      setItems(Array.isArray(list) ? list : []);
      if (list.length > 0 && !selectedItem) {
        setSelectedItem(list[0]);
      } else if (list.length === 0) {
        setSelectedItem(null);
      } else if (selectedItem) {
        const stillExists = list.find((i) => i.id === selectedItem.id);
        if (!stillExists) setSelectedItem(list[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuatkan senarai.');
      setItems([]);
      setSelectedItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const openDetailModal = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleDecision = (action) => {
    if (!selectedItem) return;

    const id = selectedItem.id;
    const remaining = items.filter((i) => i.id !== id);
    const nextItem = remaining[0] ?? null;

    // Optimistic: remove from list immediately, close modal
    setItems((prev) => prev.filter((i) => i.id !== id));
    setModalOpen(false);
    setSelectedItem(nextItem);
    if (nextItem) setModalOpen(true);

    startTransition(async () => {
      try {
        if (action === 'approve') {
          await campusLifeAPI.approve(id);
          toast.success('Rekod diluluskan.');
        } else {
          await campusLifeAPI.reject(id);
          toast.info('Rekod ditolak.');
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Gagal memproses.');
        loadPending();
      }
    });
  };

  const quickAction = (
    <Link to="/campus-life">
      <Button variant="secondary" size="sm">
        Kehidupan Kampus
      </Button>
    </Link>
  );

  const sidePanel = (
    <Card className="p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Aliran Kerja</h3>
      <div className="text-sm text-gray-600 space-y-2">
        <p>Inbox → Senarai → Butiran → Kelulusan</p>
        <p className="text-xs">
          Klik &quot;Ya&quot; untuk lulus atau &quot;Tidak&quot; untuk tolak. Rekod akan dikeluarkan serta-merta.
        </p>
      </div>
    </Card>
  );

  return (
    <PageLayout
      title="Kelulusan Eksekutif"
      quickAction={quickAction}
      sidePanel={sidePanel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            Senarai ({items.length})
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-gray-200 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openDetailModal(item)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedItem?.id === item.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.created_by_nama || '—'} • {item.tarikh || '—'}
                  </p>
                </button>
              ))}
              {items.length === 0 && (
                <p className="text-center text-gray-500 py-8">Tiada permintaan menunggu.</p>
              )}
            </div>
          )}
        </div>

        {/* Detail placeholder when no modal */}
        <div className="lg:col-span-2">
          {!loading && items.length > 0 && (
            <Card className="p-8 text-center text-gray-500">
              Klik item dari senarai untuk melihat butiran dan meluluskan.
            </Card>
          )}
        </div>
      </div>

      {/* Detail Modal - Approve/Reject */}
      {modalOpen && selectedItem && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Butiran</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Tajuk</p>
                  <p className="font-medium">{selectedItem.title}</p>
                </div>
                {selectedItem.details && (
                  <div>
                    <p className="text-sm text-gray-500">Butiran</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.details}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Luluskan?</p>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => handleDecision('approve')}
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ya
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDecision('reject')}
                    disabled={isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Tidak
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </PageLayout>
  );
};

export default ExecutiveApprovals;
