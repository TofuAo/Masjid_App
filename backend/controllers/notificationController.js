import { fetchDashboardNotifications } from '../services/notificationService.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await fetchDashboardNotifications();
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] getNotifications error', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuatkan notifikasi'
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID notifikasi diperlukan'
      });
    }

    // Server currently tracks notification read state client-side.
    res.json({
      success: true,
      message: 'Notifikasi ditandakan sebagai dibaca',
      data: { id }
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] markNotificationRead error', error);
    res.status(500).json({
      success: false,
      message: 'Tidak dapat menandakan notifikasi sebagai dibaca'
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    // No persisted state yet, just acknowledge the request.
    res.json({
      success: true,
      message: 'Semua notifikasi ditandakan sebagai dibaca'
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] markAllNotificationsRead error', error);
    res.status(500).json({
      success: false,
      message: 'Tidak dapat menandakan semua notifikasi sebagai dibaca'
    });
  }
};
