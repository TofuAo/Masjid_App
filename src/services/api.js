// ============================================================
// src/services/api.js — FULL UPDATED FILE
// CHANGES (search for "MODIFICATION"):
//   1. studentsAPI.getAll()  — now forwards ?status param (Mod 2)
//   2. studentsAPI.getSelf() — new function for student profile (Mod 1)
// All other code is identical to the original.
// ============================================================

import axios from 'axios';
import resolveApiBaseUrl from '../utils/apiBaseUrl';

const TOKEN_EXPIRY_KEY = 'authTokenExpiry';

const removeStoredAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

const getStoredExpiry = () => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? Number(expiry) : null;
};

const isTokenExpired = () => {
  const expiry = getStoredExpiry();
  return typeof expiry === 'number' && !Number.isNaN(expiry) && Date.now() > expiry;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    if (config.method === 'delete' || config.method === 'DELETE') {
      console.log(`\n${'🟡'.repeat(40)}`);
      console.log('[API INTERCEPTOR] DELETE request intercepted');
      console.log('[API INTERCEPTOR] URL:', config.url);
      console.log('[API INTERCEPTOR] Method:', config.method);
      console.log('[API INTERCEPTOR] Base URL:', config.baseURL);
      console.log('[API INTERCEPTOR] Full URL:', `${config.baseURL}${config.url}`);
      console.log('[API INTERCEPTOR] Headers:', config.headers);
      console.log('[API INTERCEPTOR] Cancel Token:', config.cancelToken ? 'present' : 'absent');
      console.log('[API INTERCEPTOR] Request ID:', Date.now());
      console.log(`${'🟡'.repeat(40)}\n`);
    }

    if (isTokenExpired()) {
      console.log('[API INTERCEPTOR] Token expired, rejecting request');
      removeStoredAuth();
      return Promise.reject({
        message: 'Sesi anda telah tamat tempoh. Sila log masuk semula.',
        status: 401,
      });
    }

    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (config.method === 'delete' || config.method === 'DELETE') {
        console.log('[API INTERCEPTOR] ✅ Auth token added to DELETE request');
      }
    } else if (config.method === 'delete' || config.method === 'DELETE') {
      console.warn('[API INTERCEPTOR] ⚠️ DELETE request has no auth token!');
    }

    if (config.method === 'delete' || config.method === 'DELETE') {
      console.log('[API INTERCEPTOR] ✅ DELETE request config finalized, returning config');
      console.log('[API INTERCEPTOR] About to send DELETE request to:', `${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('[API INTERCEPTOR] ❌ Request interceptor error:', error);
    if (error.config?.method === 'delete' || error.config?.method === 'DELETE') {
      console.error('[API INTERCEPTOR] ❌ DELETE request failed in interceptor:', error);
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (response.config?.method === 'delete' || response.config?.method === 'DELETE') {
      console.log(`\n${'🟢'.repeat(40)}`);
      console.log('[API INTERCEPTOR] ✅ DELETE response received');
      console.log('[API INTERCEPTOR] Status:', response.status);
      console.log('[API INTERCEPTOR] Status Text:', response.statusText);
      console.log('[API INTERCEPTOR] URL:', response.config?.url);
      console.log('[API INTERCEPTOR] Response Data:', response.data);
      console.log(`${'🟢'.repeat(40)}\n`);
    }
    return response.data;
  },
  (error) => {
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' ||
        (error.message && error.message.includes('Duplicate request cancelled'))) {
      return Promise.reject({ message: 'Request was cancelled', status: 0, isCanceled: true, isExpected: true });
    }

    if (error.config?.method === 'delete' || error.config?.method === 'DELETE') {
      console.error(`\n${'🔴'.repeat(40)}`);
      console.error('[API INTERCEPTOR] ❌ DELETE response error');
      console.error('[API INTERCEPTOR] URL:', error.config?.url);
      console.error('[API INTERCEPTOR] Status:', error.response?.status);
      console.error('[API INTERCEPTOR] Response Data:', error.response?.data);
      console.error('[API INTERCEPTOR] Error Message:', error.message);
      console.error('[API INTERCEPTOR] Full Error:', error);
      console.error(`${'🔴'.repeat(40)}\n`);
    }

    if (error.response?.status === 429) {
      const errorMessage = error.response?.data?.message || 'Terlalu banyak permintaan. Sila cuba lagi selepas beberapa saat.';
      return Promise.reject({ message: errorMessage, status: 429, isRateLimitError: true });
    }

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.error('API Error: Request timeout -', error.config?.url);
        return Promise.reject({ message: 'Permintaan mengambil masa terlalu lama. Sila cuba lagi.', status: 408, isNetworkError: true });
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        console.error('API Error: Network connection failed -', error.config?.url);
        return Promise.reject({ message: 'Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.', status: 0, isNetworkError: true });
      } else {
        console.error('API Error (no response):', error.message, error.config?.url);
        return Promise.reject({ message: 'Ralat sambungan. Sila cuba lagi.', status: 0, isNetworkError: true });
      }
    }

    const requestUrl = error.config?.url || '';
    const requestParams = error.config?.params || {};
    const urlHasSettings = requestUrl.includes('/settings');
    const keyMatches = requestParams.key === 'google_maps_api_key' ||
                       requestUrl.includes('key=google_maps_api_key') ||
                       requestUrl.includes('key=') && requestUrl.includes('google_maps_api_key');
    const isExpected404 = error.response?.status === 404 && urlHasSettings && keyMatches;

    if (isExpected404) {
      return Promise.reject({ message: 'Setting not found', status: 404, response: error.response, isExpected404: true });
    }

    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const errorMessage = error.response?.data?.message || '';
    const isTokenError = errorMessage.includes('token') || errorMessage.includes('Token') || errorMessage.includes('expired') || errorMessage.includes('invalid');
    const isPermissionError = errorMessage.includes('permissions') || errorMessage.includes('Insufficient');

    if (isAuthError && (isTokenError || isPermissionError)) {
      if (isTokenError) removeStoredAuth();
    } else if (error.response && error.response.status >= 500) {
      if (!isExpected404) {
        console.error('API Error:', error.config?.url, 'Status:', error.response?.status);
        console.error('Error Response Data:', error.response?.data);
      }
    }

    const errorData = error.response?.data || { message: error.message || 'An error occurred' };
    if (typeof errorData === 'string') {
      return Promise.reject({ message: errorData, status: error.response?.status });
    }
    if (!errorData.message && errorData.error) {
      errorData.message = errorData.error;
    }
    return Promise.reject({ ...errorData, status: error.response?.status, response: error.response });
  }
);


// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  registerExisting: (data) => api.post('/auth/self-register', data),
  getProfile: () => api.get('/auth/profile'),
  checkProfileComplete: () => api.get('/auth/profile/complete'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  adminChangePassword: (data) => api.put('/auth/admin/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  checkResetOptions: (data) => api.post('/auth/check-reset-options', data),
  requestPasswordResetEmail: (data) => api.post('/auth/request-reset-email', data),
  requestPasswordResetPhone: (data) => api.post('/auth/request-reset-phone', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getPendingRegistrations: async () => {
    try {
      const response = await api.get('/auth/pending-registrations');
      return response?.success ? response : { success: true, data: response?.data || response || [] };
    } catch (error) {
      if (error.isNetworkError || error.status === 0) {
        throw { ...error, message: 'Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.' };
      }
      if (error.status === 403) {
        throw { ...error, message: error.message || 'Anda tidak mempunyai kebenaran untuk mengakses halaman ini. Sila log masuk sebagai pentadbir.' };
      }
      throw error;
    }
  },
  approveRegistration: (data) => {
    const payload = typeof data === 'string' ? { user_telefon: data } : data;
    return api.post('/auth/approve-registration', payload);
  },
  rejectRegistration: (data) => {
    const payload = typeof data === 'string' ? { user_telefon: data } : data;
    return api.post('/auth/reject-registration', payload);
  },
  getPreferences: () => api.get('/auth/preferences'),
  updatePreferences: (data) => api.put('/auth/preferences', data),
};

export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markNotificationRead: (id) => api.post(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post('/notifications/mark-all-read'),
};

// ── Students API ─────────────────────────────────────────────
export const studentsAPI = {
  // Inside studentsAPI:
getMyProfile: () => api.get('/students/me'),
  // MODIFICATION 2: added status param forwarding
  // Usage:
  //   studentsAPI.getAll()                    → aktif students (excludes tamat — default)
  //   studentsAPI.getAll({ status: 'tamat' }) → graduated students only
  //   studentsAPI.getAll({ status: 'all' })   → all statuses
  //   studentsAPI.getAll({ search: 'Ali' })   → search within active students
  getAll: async (params) => {
    try {
      const response = await api.get('/students', { params });
      if (Array.isArray(response)) return response;
      if (response?.success && Array.isArray(response.data)) return response.data;
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // MODIFICATION 1: student fetches their own full profile
  // Only callable with a student JWT — returns profile + class +
  // attendance summary + outstanding fees + recent results.
  getSelf: async () => {
    try {
      const response = await api.get('/students/me');
      return response;
    } catch (error) {
      console.error('Error fetching self profile:', error);
      throw error;
    }
  },

  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getStats: () => api.get('/students/stats'),
  importFromCSV: (data) => api.post('/students/import', data),
  register: (data) => api.post('/auth/register', data),
};

// Teachers API
export const teachersAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/teachers', { params });
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  register: (data) => api.post('/teachers/register', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  getStats: async () => {
    try {
      const response = await api.get('/teachers/stats');
      return response?.success ? response : { success: true, data: response };
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      throw error;
    }
  },
  getUnassigned: async () => {
    try {
      const response = await api.get('/teachers/unassigned', { params: { limit: 10000, page: 1 } });
      return response?.success ? response : { success: true, data: response?.data || [] };
    } catch (error) {
      console.error('Error fetching unassigned staff/teachers:', error);
      throw error;
    }
  },
  convertToTeacher: (data) => api.post('/teachers/convert', data),
};

// Classes API
export const classesAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/classes', { params });
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      if (!error.isCanceled && !error.isExpected) {
        console.error('Error fetching classes:', error);
      }
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal memuatkan data kelas.';
      throw { ...error, message: errorMessage };
    }
  },
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  getStats: async () => {
    try {
      const response = await api.get('/classes/stats');
      return response?.success ? response : { success: true, data: response };
    } catch (error) {
      if (!error.isCanceled && !error.isExpected) {
        console.error('Error fetching class stats:', error);
      }
      throw error;
    }
  },
};

// Attendance API
export const attendanceAPI = {
  getAll: async (params) => {
    try {
      const cleanParams = {};
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null && params[key] !== 'undefined') {
            cleanParams[key] = params[key];
          }
        });
      }
      const response = await api.get('/attendance', { params: cleanParams });
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },
  mark: (data) => api.post('/attendance', data),
  bulkMark: (data) => api.post('/attendance/bulk', data),
  bulkMarkWithProof: (formData) => api.post('/attendance/bulk-with-proof', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: async (id) => {
    console.log('[ATTENDANCE API] delete() called with ID:', id);
    try {
      const response = await api.delete(`/attendance/${id}`);
      return response;
    } catch (error) {
      console.error('[ATTENDANCE API] delete() error:', error);
      throw error;
    }
  },
  getStats: (params) => api.get('/attendance/stats', { params }),
  getStudentHistory: (id, params) => api.get(`/attendance/student/${id}`, { params }),
  confirmDocument: (id, data) => api.post(`/attendance/${id}/confirm-document`, data),
};

// Fees API
export const feesAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/fees', { params });
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
      throw error;
    }
  },
  getById: (id) => api.get(`/fees/${id}`),
  create: (data) => api.post('/fees', data),
  update: (id, data) => api.put(`/fees/${id}`, data),
  markAsPaid: (id, data) => api.put(`/fees/${id}/mark-paid`, data),
  delete: (id) => api.delete(`/fees/${id}`),
  getStats: (params) => api.get('/fees/stats', { params }),
  confirmDocument: (id, data) => api.post(`/fees/${id}/confirm-document`, data),
};

// Results API
export const resultsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/results', { params });
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Error fetching results:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal memuatkan data keputusan.';
      throw { ...error, message: errorMessage };
    }
  },
  getById: (id) => api.get(`/results/${id}`),
  create: (data) => api.post('/results', data),
  update: (id, data) => api.put(`/results/${id}`, data),
  delete: (id) => api.delete(`/results/${id}`),
  getStats: (params) => api.get('/results/stats', { params }),
  getTopPerformers: (params) => api.get('/results/top-performers', { params }),
};

// Resit API
export const resitAPI = {
  getMyEligible: async () => {
    try {
      const response = await api.get('/resit');
      if (response?.data && Array.isArray(response.data)) return response.data;
      return response?.data ?? [];
    } catch (error) {
      console.error('Error fetching resit eligible:', error);
      throw error;
    }
  },
  apply: (resultId) => api.post('/resit/apply', { result_id: resultId }),
};

// Exams API
export const examsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/exams', { params });
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Error fetching exams:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal memuatkan data peperiksaan.';
      throw { ...error, message: errorMessage };
    }
  },
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
};

// Utility functions
export const setAuthToken = (token, expiresAt) => {
  if (token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token);
    if (expiresAt) localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
  } else {
    removeStoredAuth();
  }
};

export const getAuthToken = () => {
  if (isTokenExpired()) { removeStoredAuth(); return null; }
  return localStorage.getItem('authToken') || localStorage.getItem('token');
};

export const clearAuth = () => removeStoredAuth();

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get('/settings', { params: { key } }),
  getMasjidLocation: () => api.get('/settings/masjid-location'),
  getQRCode: () => api.get('/settings/qr-code'),
  getGradeRanges: () => api.get('/settings/grade-ranges'),
  updateGradeRanges: (data) => api.put('/settings/grade-ranges', data),
  update: (key, data) => api.put(`/settings/${key}`, data),
};

// Announcements API
export const announcementsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/announcements', { params });
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

export const picUsersAPI = {
  
  getAll: (params) => api.get('/pic-users', { params }),
  create: (data) => api.post('/pic-users', data),
  update: (ic, data) => api.put(`/pic-users/${encodeURIComponent(ic)}`, data),
  delete: (ic) => api.delete(`/pic-users/${encodeURIComponent(ic)}`),
};

export const adminsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/admins', { params });
      if (response?.success && Array.isArray(response.data)) return response.data;
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  },
  getWithLimit: async (params) => {
    try {
      return await api.get('/admins', { params });
    } catch (error) {
      console.error('Error fetching admins with limit:', error);
      throw error;
    }
  },
  getById: (ic) => api.get(`/admins/${encodeURIComponent(ic)}`),
  create: (data) => api.post('/admins', data),
  update: (ic, data) => api.put(`/admins/${encodeURIComponent(ic)}`, data),
  delete: (ic) => api.delete(`/admins/${encodeURIComponent(ic)}`),
};

export const pendingPicChangesAPI = {
  list: async (params) => {
    try {
      const response = await api.get('/pending-pic-changes', { params });
      return response?.success ? response : { success: true, data: response?.data || response || [] };
    } catch (error) {
      if (error.isNetworkError || error.status === 0) throw { ...error, message: 'Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.' };
      if (error.status === 403) throw { ...error, message: 'Anda tidak mempunyai kebenaran untuk mengakses halaman ini. Sila log masuk sebagai pentadbir.' };
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/pending-pic-changes/${id}`);
      return response?.success ? response : { success: true, data: response?.data || response };
    } catch (error) {
      if (error.status === 404) throw { ...error, message: 'Permintaan tidak ditemui. Mungkin telah dipadam atau tidak wujud.' };
      throw error;
    }
  },
  approve: async (id, data) => {
    try {
      return await api.post(`/pending-pic-changes/${id}/approve`, data);
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      if (backendMessage) throw { ...error, message: backendMessage };
      throw error;
    }
  },
  reject: async (id, data) => {
    try {
      return await api.post(`/pending-pic-changes/${id}/reject`, data);
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      if (backendMessage) throw { ...error, message: backendMessage };
      throw error;
    }
  },
};

export const googleFormAPI = {
  getClassFormUrl: (classId) => api.get(`/google-form/class/${classId}`),
  setClassFormUrl: (classId, data) => api.put(`/google-form/class/${classId}`, data),
  submitWebhook: (data) => api.post('/google-form/webhook', data),
};

export const staffCheckInAPI = {
  checkIn: (data) => api.post('/staff-checkin/check-in', data),
  checkOut: (data) => api.post('/staff-checkin/check-out', data),
  getTodayStatus: () => api.get('/staff-checkin/today-status'),
  getHistory: (params) => api.get('/staff-checkin/history', { params }),
  getStaffList: () => api.get('/staff-checkin/staff'),
  autoCheckIn: (data) => api.post('/staff-checkin/auto', data || {}),
  quickCheckIn: (data) => api.post('/staff-checkin/quick-check-in', data),
  quickCheckOut: (data) => api.post('/staff-checkin/quick-check-out', data),
  quickGetLastAction: (data) => api.post('/staff-checkin/quick-last-action', data),
};

export const exportAPI = {
  triggerDatabaseBackup: (payload) => api.post('/export/database', payload),
  archiveYearData: (payload) => api.post('/export/archive-year', payload),
  getHistory: (params) => api.get('/export/history', { params }),
  download: (fileName) => api.get(`/export/download/${encodeURIComponent(fileName)}`, { responseType: 'blob' }),
};

export const paymentGatewaySettingsAPI = {
  getAll: () => api.get('/payment-gateways'),
  getActive: () => api.get('/payment-gateways/active'),
  update: (gatewayName, data) => api.put(`/payment-gateways/${gatewayName}`, data),
};

export const contactAPI = {
  submit: (data) => api.post('/contact', data),
  getSubmissions: (params) => api.get('/contact/submissions', { params }),
};

export const usersAPI = {
  
  getAll: async (params = { limit: 1000, page: 1 }) => {
    try {
      const response = await api.get('/users', { params });
      return response?.success ? response : { success: true, data: response?.data || [] };
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },
  updateRoles: (ic, data) => api.put(`/users/${encodeURIComponent(ic)}/roles`, data),

  // Fan out across role-specific endpoints since /users/:ic doesn't exist
  getByIc: async (ic) => {
      // Guard: IC must be 12 digits
  const cleanIc = ic?.replace(/-/g, '');
  if (!cleanIc || !/^\d{12}$/.test(cleanIc)) {
    throw { message: 'Format IC tidak sah.', status: 400 };
  }

    const endpoints = [
  () => studentsAPI.getById(cleanIc),
  () => teachersAPI.getById(cleanIc),
  () => adminsAPI.getById(cleanIc),
  () => api.get(`/pic-users/${encodeURIComponent(cleanIc)}`),
];

    for (const fn of endpoints) {
      try {
        const res = await fn();
        const data = res?.data || res;
        if (data && (data.ic || data.IC || data.nama)) {
          return { success: true, data };
        }
      } catch (_) {
        // 404 = not this role, try next
      }
    }
    throw { message: 'Pengguna tidak ditemui.', status: 404 };
  },
};

export const ibAPI = {
  getAvailableReports: () => api.get('/ib/reports'),
  getMonthlyReport: (params) => api.get('/ib/report', { params }),
  confirmMonthlyPayment: (data) => api.post('/ib/confirm', data),
  getClassDocuments: (params) => api.get('/ib/class-documents', { params }),
  confirmClassAttendance: (data) => api.post('/ib/confirm-class-attendance', data),
  confirmClassFees: (data) => api.post('/ib/confirm-class-fees', data),
  approvePaymentsByDate: (data) => api.post('/ib/approve-payments-by-date', data),
  getApprovalHistory: (params) => api.get('/ib/history', { params }),
  getFlaggedPayments: (params) => api.get('/ib/flagged-payments', { params }),
  flagPayment: (data) => api.post('/ib/flag-payment', data),
  exportMonthlySummary: (params) => api.get('/ib/export/summary', { params }),
  exportApprovalHistory: (params) => api.get('/ib/export/history', { params }),
};

export const receiptAPI = {
  getByNumber: (receiptNumber) => api.get(`/receipts/${receiptNumber}`),
  getFeeReceipt: (feeId) => api.get(`/receipts/fee/${feeId}`),
  getPaymentReceipt: (paymentId) => api.get(`/receipts/payment/${paymentId}`),
  getUserReceipts: (userId) => api.get(`/receipts/user/${userId}`),
};

export const weatherAPI = {
  getCurrent: () => api.get('/weather/current'),
  clearCache: () => api.delete('/weather/cache'),
};

export const quranQuoteAPI = {
  getDaily: () => api.get('/quran-quote/daily'),
  clearCache: () => api.delete('/quran-quote/cache'),
};

export default api;
