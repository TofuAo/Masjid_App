import React, { useState, useEffect } from 'react';
import useCrud from '../hooks/useCrud';
import { announcementsAPI } from '../services/api';
import AnnouncementList from '../components/announcements/AnnouncementList';
import AnnouncementForm from '../components/announcements/AnnouncementForm';
import Card from '../components/ui/Card';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import { Megaphone, AlertCircle } from 'lucide-react';
import useErrorHandler from '../hooks/useErrorHandler';

const Announcements = ({ user }) => {
  const {
    items: announcements,
    currentItem: selectedAnnouncement,
    view: currentView,
    loading,
    error: crudError,
    handlers,
    fetchItems,
    DeleteModal,
  } = useCrud(announcementsAPI, 'announcement');

  const {
    add: handleAdd,
    edit: handleEdit,
    view: handleView,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel,
  } = handlers;

  const { handleError } = useErrorHandler({ 
    pageName: 'Announcements' 
  });

  useEffect(() => {
    fetchItems({ limit: 100 });
  }, [fetchItems]);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">Memuatkan pengumuman...</div>;
    }

    if (crudError) {
      return (
        <ErrorDisplay
          error={{
            message: crudError.message || 'Gagal memuatkan data pengumuman.',
            originalError: crudError
          }}
          title="Ralat Memuatkan Pengumuman"
          onRetry={() => fetchItems({ limit: 100 })}
        />
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
          </div>
        );
    }
  };

  return (
    <div>
      {renderContent()}
      <DeleteModal />
    </div>
  );
};

export default Announcements;

