import axios from 'axios';
import resolveApiBaseUrl from '../utils/apiBaseUrl';

const TOKEN_EXPIRY_KEY = 'authTokenExpiry';

const removeStoredAuth = () => {
  localStorage.removeItem('authToken');
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

// Create axios instance with base configuration
const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Don't send cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (isTokenExpired()) {
      removeStoredAuth();
      return Promise.reject({
        message: 'Sesi anda telah tamat tempoh. Sila log masuk semula.',
        status: 401,
      });
    }

    const token = localStorage.getItem('authToken');
    // Don't log successful API requests to reduce console noise
    // Only log if there's an issue (handled in response interceptor)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Don't log successful responses to reduce console noise
    // Only log errors (handled in error handler below)
    // Return full response.data (which may contain adminLimit for /admins endpoint)
    return response.data;
  },
  (error) => {
    // Handle rate limiting (429) - don't spam console
    if (error.response?.status === 429) {
      // Silently handle rate limit errors - don't log to reduce noise
      const errorMessage = error.response?.data?.message || 'Terlalu banyak permintaan. Sila cuba lagi selepas beberapa saat.';
      return Promise.reject({ 
        message: errorMessage,
        status: 429,
        isRateLimitError: true
      });
    }

    // Handle network errors (connection issues)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.error('API Error: Request timeout -', error.config?.url);
        return Promise.reject({ 
          message: 'Permintaan mengambil masa terlalu lama. Sila cuba lagi.',
          status: 408,
          isNetworkError: true
        });
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        console.error('API Error: Network connection failed -', error.config?.url);
        return Promise.reject({ 
          message: 'Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.',
          status: 0,
          isNetworkError: true
        });
      } else {
        console.error('API Error (no response):', error.message, error.config?.url);
        return Promise.reject({ 
          message: 'Ralat sambungan. Sila cuba lagi.',
          status: 0,
          isNetworkError: true
        });
      }
    }

    // Don't log auth/permission errors to reduce console noise
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const errorMessage = error.response?.data?.message || '';
    const isTokenError = errorMessage.includes('token') || errorMessage.includes('Token') || errorMessage.includes('expired') || errorMessage.includes('invalid');
    const isPermissionError = errorMessage.includes('permissions') || errorMessage.includes('Insufficient');
    
    if (isAuthError && (isTokenError || isPermissionError)) {
      // Silently handle token and permission errors - don't spam console
      // These are expected when user doesn't have access to certain endpoints
      if (isTokenError) {
        removeStoredAuth();
      }
      // Don't log permission errors - they're handled by the UI
    } else if (error.response && error.response.status >= 500) {
      // Only log server errors (500+)
      console.error('API Error:', error.config?.url, 'Status:', error.response?.status);
      console.error('Error Response Data:', error.response?.data);
    }
    
    // Return error with proper message structure
    const errorData = error.response?.data || { message: error.message || 'An error occurred' };
    
    // If errorData is a string, wrap it in an object
    if (typeof errorData === 'string') {
      return Promise.reject({ message: errorData, status: error.response?.status });
    }
    
    // If errorData doesn't have message, try to extract it
    if (!errorData.message && errorData.error) {
      errorData.message = errorData.error;
    }
    
    // Ensure we preserve the full error response structure
    return Promise.reject({
      ...errorData,
      status: error.response?.status,
      response: error.response
    });
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
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
      // Enhanced error handling with connection recovery
      if (error.isNetworkError || error.status === 0) {
        throw { ...error, message: 'Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.' };
      }
      if (error.status === 403) {
        throw { ...error, message: error.message || 'Anda tidak mempunyai kebenaran untuk mengakses halaman ini. Sila log masuk sebagai pentadbir.' };
      }
      throw error;
    }
  },
  approveRegistration: (user_ic) => api.post('/auth/approve-registration', { user_ic }),
  rejectRegistration: (user_ic) => api.post('/auth/reject-registration', { user_ic }),
  getPreferences: () => api.get('/auth/preferences'),
  updatePreferences: (data) => api.put('/auth/preferences', data),
};

// Students API
export const studentsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/students', { params });
      // Handle both array responses and object responses with data property
      if (Array.isArray(response)) {
        return response;
      }
      // If response has success and data properties, return the data array
      if (response?.success && Array.isArray(response.data)) {
        return response.data;
      }
      // Fallback to data property or empty array
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching students:', error);
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
      // Handle both array responses and object responses with data property
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  register: (data) => api.post('/teachers/register', data), // Public registration endpoint
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
      // Request with very high limit to get all users (10,000 should be enough)
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
      // The interceptor already returns response.data, so response is the data object
      // Backend returns: { success: true, data: [...], pagination: {...} }
      // After interceptor: { success: true, data: [...], pagination: {...} }
      if (Array.isArray(response)) {
        return response;
      }
      // If it's an object with data property, return the data array
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      // If it's an object but no data property, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Ensure error is properly formatted
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
      console.error('Error fetching class stats:', error);
      throw error;
    }
  },
};

// Attendance API
export const attendanceAPI = {
  getAll: async (params) => {
    try {
      // Filter out undefined/null values from params to avoid sending them as query strings
      const cleanParams = {};
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null && params[key] !== 'undefined') {
            cleanParams[key] = params[key];
          }
        });
      }
      // Removed console.log to reduce console noise
      const response = await api.get('/attendance', { params: cleanParams });
      // The interceptor already returns response.data, so response is the data object
      // Backend returns: { success: true, data: [...], pagination: {...} }
      // After interceptor: { success: true, data: [...], pagination: {...} }
      if (Array.isArray(response)) {
        return response;
      }
      // If it's an object with data property, return the data array
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      // If it's an object but no data property, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },
  mark: (data) => api.post('/attendance', data),
  bulkMark: (data) => api.post('/attendance/bulk', data),
  bulkMarkWithProof: (formData) => {
    return api.post('/attendance/bulk-with-proof', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getStats: (params) => api.get('/attendance/stats', { params }),
  getStudentHistory: (id, params) => api.get(`/attendance/student/${id}`, { params }),
  confirmDocument: (id, data) => api.post(`/attendance/${id}/confirm-document`, data),
};

// Fees API
export const feesAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/fees', { params });
      // Handle both array responses and object responses with data property
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
      // Handle both array responses and object responses with data property
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
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

// Exams API
export const examsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/exams', { params });
      // Handle both array responses and object responses with data property
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
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
    if (expiresAt) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
    }
  } else {
    removeStoredAuth();
  }
};

export const getAuthToken = () => {
  if (isTokenExpired()) {
    removeStoredAuth();
    return null;
  }
  return localStorage.getItem('authToken');
};

export const clearAuth = () => {
  removeStoredAuth();
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get(`/settings?key=${key}`),
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

export const adminActionsAPI = {
  list: (params) => api.get('/admin-actions', { params }),
  undo: (snapshotId) => api.post(`/admin-actions/${snapshotId}/undo`)
};

export const picUsersAPI = {
  getAll: (params) => api.get('/pic-users', { params }),
  create: (data) => api.post('/pic-users', data),
  update: (ic, data) => api.put(`/pic-users/${encodeURIComponent(ic)}`, data),
  delete: (ic) => api.delete(`/pic-users/${encodeURIComponent(ic)}`)
};

export const adminsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/admins', { params });
      // Backend returns { success: true, data: [...], adminLimit: {...} }
      if (response?.success && Array.isArray(response.data)) {
        return response.data;
      }
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  },
  getWithLimit: async (params) => {
    try {
      const response = await api.get('/admins', { params });
      // Return full response including adminLimit
      return response;
    } catch (error) {
      console.error('Error fetching admins with limit:', error);
      throw error;
    }
  },
  getById: (ic) => api.get(`/admins/${encodeURIComponent(ic)}`),
  create: (data) => api.post('/admins', data),
  update: (ic, data) => api.put(`/admins/${encodeURIComponent(ic)}`, data),
  delete: (ic) => api.delete(`/admins/${encodeURIComponent(ic)}`)
};

export const pendingPicChangesAPI = {
  list: (params) => api.get('/pending-pic-changes', { params }),
  getById: (id) => api.get(`/pending-pic-changes/${id}`),
  approve: (id, data) => api.post(`/pending-pic-changes/${id}/approve`, data),
  reject: (id, data) => api.post(`/pending-pic-changes/${id}/reject`, data),
};

// Google Form API
export const googleFormAPI = {
  getClassFormUrl: (classId) => api.get(`/google-form/class/${classId}`),
  setClassFormUrl: (classId, data) => api.put(`/google-form/class/${classId}`, data),
  submitWebhook: (data) => api.post('/google-form/webhook', data),
};

// Staff Check-In API
export const staffCheckInAPI = {
  checkIn: (data) => api.post('/staff-checkin/check-in', data),
  checkOut: (data) => api.post('/staff-checkin/check-out', data),
  getTodayStatus: () => api.get('/staff-checkin/today-status'),
  getHistory: (params) => api.get('/staff-checkin/history', { params }),
  getStaffList: () => api.get('/staff-checkin/staff'),
  quickCheckIn: (data) => api.post('/staff-checkin/quick-check-in', data),
  quickCheckOut: (data) => api.post('/staff-checkin/quick-check-out', data),
  quickGetLastAction: (data) => api.post('/staff-checkin/quick-last-action', data),
};

export const exportAPI = {
  triggerDatabaseBackup: (payload) => api.post('/export/database', payload),
  archiveYearData: (payload) => api.post('/export/archive-year', payload),
  getHistory: (params) => api.get('/export/history', { params }),
  download: (fileName) =>
    api.get(`/export/download/${encodeURIComponent(fileName)}`, {
      responseType: 'blob',
    }),
};

// Payment Method Settings API
export const paymentMethodSettingsAPI = {
  getAll: () => api.get('/payment-methods'),
  getEnabled: () => api.get('/payment-methods/enabled'),
  update: (methodCode, data) => api.put(`/payment-methods/${methodCode}`, data),
  bulkUpdate: (methods) => api.put('/payment-methods/bulk', { methods }),
};

// Payment Gateway Settings API
export const paymentGatewaySettingsAPI = {
  getAll: () => api.get('/payment-gateways'),
  getActive: () => api.get('/payment-gateways/active'),
  update: (gatewayName, data) => api.put(`/payment-gateways/${gatewayName}`, data),
};

// Contact API
export const contactAPI = {
  submit: (data) => api.post('/contact', data),
  getSubmissions: (params) => api.get('/contact/submissions', { params }),
};

// IB (Internal Auditor) API
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
};

export const ibAPI = {
  getAvailableReports: () => api.get('/ib/reports'),
  getMonthlyReport: (params) => api.get('/ib/report', { params }),
  confirmMonthlyPayment: (data) => api.post('/ib/confirm', data),
  getClassDocuments: (params) => api.get('/ib/class-documents', { params }),
  confirmClassAttendance: (data) => api.post('/ib/confirm-class-attendance', data),
  confirmClassFees: (data) => api.post('/ib/confirm-class-fees', data),
  approvePaymentsByDate: (data) => api.post('/ib/approve-payments-by-date', data),
};

export default api;
