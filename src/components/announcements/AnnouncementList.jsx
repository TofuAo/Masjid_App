import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Plus, Edit, Eye, Trash2, AlertCircle, Calendar, User } from 'lucide-react';

const AnnouncementList = ({ announcements = [], onEdit, onView, onDelete, onAdd, user }) => {
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      urgent: { variant: 'danger', label: 'Urgent', icon: <AlertCircle className="w-3 h-3" /> },
      high: { variant: 'warning', label: 'High', icon: null },
      normal: { variant: 'success', label: 'Normal', icon: null },
      low: { variant: 'default', label: 'Low', icon: null }
    };
    const config = priorityConfig[priority] || { variant: 'default', label: priority };
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { variant: 'success', label: 'Published' },
      draft: { variant: 'warning', label: 'Draft' },
      archived: { variant: 'secondary', label: 'Archived' }
    };
    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTargetAudienceLabel = (audience) => {
    const labels = {
      all: 'Semua Pengguna',
      students: 'Pelajar Sahaja',
      teachers: 'Guru Sahaja',
      admin: 'Admin Sahaja'
    };
    return labels[audience] || audience;
  };

  return (
    <Card>
      <Card.Header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <Card.Title>Senarai Pengumuman ({announcements.length})</Card.Title>
          {user?.role === 'admin' && (
            <Button onClick={onAdd} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Buat Pengumuman
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Tiada pengumuman ditemui</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      {getPriorityBadge(announcement.priority)}
                      {user?.role === 'admin' && getStatusBadge(announcement.status)}
                    </div>
                    
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{announcement.author_nama || 'Admin'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(announcement.created_at)}</span>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {getTargetAudienceLabel(announcement.target_audience)}
                      </span>
                      {announcement.start_date && (
                        <span className="text-xs">Mula: {formatDate(announcement.start_date)}</span>
                      )}
                      {announcement.end_date && (
                        <span className="text-xs">Tamat: {formatDate(announcement.end_date)}</span>
                      )}
                    </div>
                  </div>
                  
                  {user?.role === 'admin' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => onView(announcement)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(announcement)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(announcement.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Padam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card.Content>
    </Card>
  );
};

export default AnnouncementList;

