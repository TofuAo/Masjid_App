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
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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
    // Only log token status for debugging, skip for public endpoints
    if (config.url && !config.url.includes('/auth/register') && !config.url.includes('/auth/self-register') && !config.url.includes('/auth/login') && !config.url.includes('/auth/forgot-password') && !config.url.includes('/auth/reset-password') && !config.url.includes('/settings/masjid-location')) {
      console.log('API Request:', config.url, 'Token:', token ? 'Present' : 'Missing');
    }
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
    // Only log for non-public endpoints
    if (response.config.url && !response.config.url.includes('/auth/register') && !response.config.url.includes('/auth/self-register') && !response.config.url.includes('/auth/login')) {
      console.log('API Response:', response.config.url, 'Status:', response.status);
    }
    return response.data;
  },
  (error) => {
    // Don't log auth errors to reduce console noise
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const errorMessage = error.response?.data?.message || '';
    const isTokenError = errorMessage.includes('token') || errorMessage.includes('Token') || errorMessage.includes('expired') || errorMessage.includes('invalid');
    
    if (isAuthError && isTokenError) {
      // Silently handle token errors - don't spam console
      removeStoredAuth();
    } else {
      // Log other errors for debugging
    if (error.response) {
      console.error('API Error:', error.config?.url, 'Status:', error.response?.status);
      console.error('Error Response Data:', error.response?.data);
    } else {
      console.error('API Error (no response):', error.message);
    }
    }
    
    // Return error with proper message structure
    const errorData = error.response?.data || { message: error.message || 'An error occurred' };
    
    // If errorData is a string, wrap it in an object
    if (typeof errorData === 'string') {
      return Promise.reject({ message: errorData });
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
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getPendingRegistrations: () => api.get('/auth/pending-registrations'),
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
};

// Classes API
export const classesAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/classes', { params });
      console.log('classesAPI.getAll - response type:', typeof response);
      console.log('classesAPI.getAll - is array:', Array.isArray(response));
      
      // Handle different response structures:
      // 1. Direct array: [...]
      // 2. Object with data: { success: true, data: [...] }
      // 3. Object with nested data: { data: [...] }
      if (Array.isArray(response)) {
        console.log('Returning array directly, length:', response.length);
        return response;
      } else if (response?.data && Array.isArray(response.data)) {
        console.log('Returning response.data, length:', response.data.length);
        return response.data;
      } else if (response?.success && Array.isArray(response.data)) {
        console.log('Returning response.data (with success flag), length:', response.data.length);
        return response.data;
      } else {
        console.warn('Unexpected response format, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
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
      const response = await api.get('/attendance', { params });
      // Handle both array responses and object responses with data property
      return Array.isArray(response) ? response : (response?.data || []);
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
  getStats: (params) => api.get('/attendance/stats', { params }),
  getStudentHistory: (id, params) => api.get(`/attendance/student/${id}`, { params }),
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
};

// Results API
export const resultsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/results', { params });
      // Handle both array responses and object responses with data property
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      throw error;
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
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw error;
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
  getHistory: (params) => api.get('/export/history', { params }),
  download: (fileName) =>
    api.get(`/export/download/${encodeURIComponent(fileName)}`, {
      responseType: 'blob',
    }),
};


export default api;
