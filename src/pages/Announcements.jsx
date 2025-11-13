import React, { useState, useEffect } from 'react';
import useCrud from '../hooks/useCrud';
import { announcementsAPI, adminActionsAPI } from '../services/api';
import AnnouncementList from '../components/announcements/AnnouncementList';
import AnnouncementForm from '../components/announcements/AnnouncementForm';
import Card from '../components/ui/Card';
import { toast } from 'react-toastify';
import { Megaphone, AlertCircle, RotateCcw, Clock } from 'lucide-react';

const Announcements = ({ user }) => {
  const {
    items: announcements,
    currentItem: selectedAnnouncement,
    view: currentView,
    loading,
    error,
    handlers,
    fetchItems,
  } = useCrud(announcementsAPI, 'announcement');

  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  const [undoableActions, setUndoableActions] = useState([]);
  const [undoLoading, setUndoLoading] = useState(false);
  const [undoError, setUndoError] = useState(null);

  const loadUndoableActions = React.useCallback(async () => {
    if (user?.role !== 'admin') {
      return;
    }
    setUndoLoading(true);
    setUndoError(null);
    try {
      const response = await adminActionsAPI.list({ entityType: 'announcement' });
      setUndoableActions(response?.data || []);
    } catch (err) {
      console.error('Failed to load undoable actions:', err);
      setUndoError(err);
    } finally {
      setUndoLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchItems({ limit: 100 });
  }, [fetchItems]);

  useEffect(() => {
    loadUndoableActions();
  }, [loadUndoableActions, announcements]);

  const handleUndoAction = async (snapshotId) => {
    try {
      await adminActionsAPI.undo(snapshotId);
      toast.success('Tindakan berjaya diundur.');
      fetchItems({ limit: 100 });
      loadUndoableActions();
    } catch (err) {
      console.error('Failed to undo action:', err);
      toast.error('Gagal mengundur tindakan. Sila cuba lagi.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Memuatkan pengumuman...</div>;
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-600">
          Ralat: {error.message || 'Gagal memuatkan data.'}
        </div>
      );
    }

    switch (currentView) {
      case 'form':
        return (
          <AnnouncementForm
            announcement={selectedAnnouncement}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        );
      default:
        return (
          <div className="space-y-6">
            {(user?.role === 'admin' || user?.role === 'pic') && (
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center">
                    <Megaphone className="w-5 h-5 mr-2 text-emerald-600" />
                    Pengurusan Pengumuman
                  </Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800">
                          <strong>Petua:</strong> Gunakan pengumuman untuk menyampaikan maklumat penting kepada semua pengguna sistem. 
                          Anda boleh menyasarkan pengumuman kepada kumpulan tertentu atau semua pengguna.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            )}

            <AnnouncementList
              announcements={announcements}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
              onAdd={handleAdd}
              user={user}
            />

            {user?.role === 'admin' && (
              <Card>
                <Card.Header>
                  <Card.Title className="flex items-center justify-between">
                    <span className="flex items-center">
                      <RotateCcw className="w-5 h-5 mr-2 text-amber-600" />
                      Tindakan Terbaru (25 Jam)
                    </span>
                    <button
                      type="button"
                      onClick={loadUndoableActions}
                      disabled={undoLoading}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Segar Semula
                    </button>
                  </Card.Title>
                </Card.Header>
                <Card.Content>
                  {undoLoading ? (
                    <div className="text-sm text-gray-600">Memuatkan tindakan boleh diundur...</div>
                  ) : undoError ? (
                    <div className="text-sm text-red-600">
                      Gagal memuatkan tindakan. Sila cuba lagi kemudian.
                    </div>
                  ) : undoableActions.length === 0 ? (
                    <div className="text-sm text-gray-600">Tiada tindakan untuk diundur dalam 25 jam terakhir.</div>
                  ) : (
                    <div className="space-y-3">
                      {undoableActions.map((action) => {
                        const createdAt = action.created_at ? new Date(action.created_at) : null;
                        const expiresAt = action.expires_at ? new Date(action.expires_at) : null;
                        const title = action.metadata?.title || action.data?.title || `ID ${action.entity_id}`;
                        const operationLabel = action.metadata?.operationLabel || action.operation;
                        return (
                          <div
                            key={action.id}
                            className="border border-gray-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{title}</p>
                              <p className="text-xs text-gray-500 capitalize">
                                {operationLabel} • ID #{action.entity_id}
                              </p>
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>
                                  {createdAt
                                    ? `Dilakukan pada ${createdAt.toLocaleString('ms-MY')}`
                                    : 'Masa tindakan tidak tersedia'}
                                </span>
                              </div>
                              {expiresAt && (
                                <div className="text-xs text-amber-600 mt-1">
                                  Boleh diundur sehingga {expiresAt.toLocaleString('ms-MY')}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUndoAction(action.id)}
                              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                            >
                              Undo
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card.Content>
              </Card>
            )}
          </div>
        );
    }
  };

  return <div>{renderContent()}</div>;
};

export default Announcements;

