import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationAPI } from '../services/api';

const NotificationContext = createContext(null);

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return ctx;
}

/**
 * Optional hook for components that may render outside NotificationProvider
 * (e.g. public routes). Returns null if not in provider.
 */
export function useNotificationContextOptional() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async (filter = 'all') => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getNotifications({ filter });
      const payload = Array.isArray(response)
        ? response
        : response?.data || [];
      setNotifications(payload);
    } catch (err) {
      setError(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimistic update: decrement unreadCount immediately, refetch on API failure
  const markAsRead = useCallback(async (id) => {
    const wasRead = notifications.find((n) => n.id === id)?.read;
    if (wasRead) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await notificationAPI.markNotificationRead(id);
    } catch (err) {
      fetchNotifications();
      throw err;
    }
  }, [notifications, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    const hadUnread = notifications.some((n) => !n.read);
    if (!hadUnread) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await notificationAPI.markAllNotificationsRead();
    } catch (err) {
      // Refetch on failure to restore correct state
      fetchNotifications();
      throw err;
    }
  }, [notifications, fetchNotifications]);

  const clearError = useCallback(() => setError(null), []);

  // Fetch on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
