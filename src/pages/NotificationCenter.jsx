import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Bell, CheckCircle, XCircle, AlertCircle, Clock, Filter, Check } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { notificationAPI } from '../services/api';
import useErrorHandler from '../hooks/useErrorHandler';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, pending, errors
  const { handleError, error: pageError, clearError } = useErrorHandler({ 
    pageName: 'NotificationCenter' 
  });
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const response = await notificationAPI.getNotifications({ filter });
      const payload = Array.isArray(response)
        ? response
        : response?.data || [];
      setNotifications(payload);
    } catch (error) {
      handleError(error, { 
        action: 'fetchNotifications',
        defaultMessage: 'Gagal memuatkan notifikasi. Sila cuba lagi.'
      });
    } finally {
      setLoading(false);
    }
  }, [filter, clearError, handleError]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const navigateToActionUrl = (url) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.location.href = url;
    } else {
      navigate(url);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      handleError(error, { 
        action: 'markAsRead',
        defaultMessage: 'Gagal menandakan notifikasi sebagai dibaca.',
        silent: true // Don't show toast for this minor action
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Semua notifikasi ditandakan sebagai dibaca');
    } catch (error) {
      handleError(error, { 
        action: 'markAllAsRead',
        defaultMessage: 'Gagal menandakan semua notifikasi sebagai dibaca.'
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pending_approval':
      case 'pending_pic':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      urgent: 'danger',
      high: 'warning',
      normal: 'default',
      low: 'secondary'
    };
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru sahaja';
    if (minutes < 60) return `${minutes} minit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'pending') return n.type.includes('pending');
    if (filter === 'errors') return n.type === 'error';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  // Show error state if there's a critical error
  if (pageError && !notifications.length) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ralat Memuatkan Notifikasi
          </h3>
          <p className="text-red-600 mb-4">{pageError.message}</p>
          {pageError.adminDetails && (
            <details className="mb-4 text-left max-w-2xl mx-auto">
              <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                Butiran Ralat (Pentadbir)
              </summary>
              <div className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(pageError.adminDetails, null, 2)}
                </pre>
              </div>
            </details>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                clearError();
                fetchNotifications();
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              Cuba Lagi
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Muat Semula Halaman
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Bell className="w-6 h-6 mr-2 text-emerald-600" />
            Pusat Notifikasi
          </h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Tiada notifikasi baru'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Tandakan Semua Dibaca</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <Filter className="w-5 h-5 text-gray-600" />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'unread' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Belum Dibaca ({notifications.filter(n => !n.read).length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'pending' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Menunggu Kelulusan
        </button>
        <button
          onClick={() => setFilter('errors')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'errors' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Ralat
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tiada Notifikasi
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Tiada notifikasi pada masa ini.'
              : `Tiada notifikasi untuk penapis "${filter}".`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => {
                if (!notification.read) markAsRead(notification.id);
                navigateToActionUrl(notification.action_url);
              }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        {getPriorityBadge(notification.priority)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
