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
    // Log DELETE requests for debugging
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

    const token = localStorage.getItem('authToken');
    // Don't log successful API requests to reduce console noise
    // Only log if there's an issue (handled in response interceptor)
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log DELETE responses for debugging
    if (response.config?.method === 'delete' || response.config?.method === 'DELETE') {
      console.log(`\n${'🟢'.repeat(40)}`);
      console.log('[API INTERCEPTOR] ✅ DELETE response received');
      console.log('[API INTERCEPTOR] Status:', response.status);
      console.log('[API INTERCEPTOR] Status Text:', response.statusText);
      console.log('[API INTERCEPTOR] URL:', response.config?.url);
      console.log('[API INTERCEPTOR] Response Data:', response.data);
      console.log(`${'🟢'.repeat(40)}\n`);
    }
    // Don't log successful responses to reduce console noise
    // Only log errors (handled in error handler below)
    // Return full response.data (which may contain adminLimit for /admins endpoint)
    return response.data;
  },
  (error) => {
    // Handle canceled/duplicate request errors - these are expected and shouldn't be logged
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || 
        (error.message && error.message.includes('Duplicate request cancelled'))) {
      // Silently reject canceled requests - they're expected when duplicate requests are cancelled
      return Promise.reject({
        message: 'Request was cancelled',
        status: 0,
        isCanceled: true,
        isExpected: true
      });
    }

    // Log DELETE errors specifically
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

    // Don't log expected 404s for settings that don't exist yet (e.g., google_maps_api_key)
    // Check both params object and URL for the key
    const requestUrl = error.config?.url || '';
    const requestParams = error.config?.params || {};
    const urlHasSettings = requestUrl.includes('/settings');
    const keyMatches = requestParams.key === 'google_maps_api_key' || 
                       requestUrl.includes('key=google_maps_api_key') ||
                       requestUrl.includes('key=') && requestUrl.includes('google_maps_api_key');
    
    const isExpected404 = error.response?.status === 404 && 
      urlHasSettings && 
      keyMatches;
    
    if (isExpected404) {
      // Return a clean error object without logging - this is expected behavior
      // The browser console will still show the network error, but our code won't log it
      return Promise.reject({ 
        message: 'Setting not found',
        status: 404,
        response: error.response,
        isExpected404: true
      });
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
      // Only log server errors (500+) - skip expected 404s
      if (!isExpected404) {
        console.error('API Error:', error.config?.url, 'Status:', error.response?.status);
        console.error('Error Response Data:', error.response?.data);
      }
    } else if (error.response && error.response.status === 404 && !isExpected404) {
      // Log 404s only if they're not expected (e.g., not for missing settings)
      // Most 404s are expected (resource doesn't exist), so we don't log them
      // This reduces console noise
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
  approveRegistration: (data) => {
    // Support both old format (just user_ic string) and new format (object with user_ic and approval_notes)
    const payload = typeof data === 'string' ? { user_ic: data } : data;
    return api.post('/auth/approve-registration', payload);
  },
  rejectRegistration: (data) => {
    // Support both old format (just user_ic string) and new format (object with user_ic and rejection_notes)
    const payload = typeof data === 'string' ? { user_ic: data } : data;
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
      // Don't log canceled/duplicate request errors - they're expected
      if (!error.isCanceled && !error.isExpected) {
        console.error('Error fetching classes:', error);
      }
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
      // Don't log canceled/duplicate request errors - they're expected
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
  delete: async (id) => {
    console.log('[ATTENDANCE API] delete() called with ID:', id);
    console.log('[ATTENDANCE API] Full URL will be:', `${api.defaults.baseURL}/attendance/${id}`);
    try {
      const response = await api.delete(`/attendance/${id}`);
      console.log('[ATTENDANCE API] delete() response received:', response);
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

export const adminActionsAPI = {
  list: (params) => {
    // Add timestamp to prevent caching (query parameter, no CORS issues)
    const cacheBustingParams = {
      ...params,
      _t: Date.now() // Timestamp to bust cache
    };
    return api.get('/admin-actions', { 
      params: cacheBustingParams
      // Removed cache-busting headers to avoid CORS issues
      // The timestamp query parameter is sufficient for cache-busting
    });
  },
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
  list: async (params) => {
    try {
      const response = await api.get('/pending-pic-changes', { params });
      return response?.success ? response : { success: true, data: response?.data || response || [] };
    } catch (error) {
      // Enhanced error handling
      if (error.isNetworkError || error.status === 0) {
        throw { ...error, message: 'Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.' };
      }
      if (error.status === 403) {
        throw { ...error, message: 'Anda tidak mempunyai kebenaran untuk mengakses halaman ini. Sila log masuk sebagai pentadbir.' };
      }
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/pending-pic-changes/${id}`);
      return response?.success ? response : { success: true, data: response?.data || response };
    } catch (error) {
      if (error.status === 404) {
        throw { ...error, message: 'Permintaan tidak ditemui. Mungkin telah dipadam atau tidak wujud.' };
      }
      throw error;
    }
  },
  approve: async (id, data) => {
    try {
      return await api.post(`/pending-pic-changes/${id}/approve`, data);
    } catch (error) {
      // Preserve specific error messages from backend
      const backendMessage = error?.response?.data?.message || error?.message;
      if (backendMessage) {
        throw { ...error, message: backendMessage };
      }
      throw error;
    }
  },
  reject: async (id, data) => {
    try {
      return await api.post(`/pending-pic-changes/${id}/reject`, data);
    } catch (error) {
      // Preserve specific error messages from backend
      const backendMessage = error?.response?.data?.message || error?.message;
      if (backendMessage) {
        throw { ...error, message: backendMessage };
      }
      throw error;
    }
  },
};

export const picRecycleBinAPI = {
  list: async () => {
    try {
      const response = await api.get('/pic-recycle-bin');
      return response?.success ? response : { success: true, data: response?.data || response || [] };
    } catch (error) {
      if (error.isNetworkError || error.status === 0) {
        throw { ...error, message: 'Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.' };
      }
      if (error.status === 403) {
        throw { ...error, message: 'Anda tidak mempunyai kebenaran untuk mengakses tong sampah PIC.' };
      }
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/pic-recycle-bin/${id}`);
      return response?.success ? response : { success: true, data: response?.data || response };
    } catch (error) {
      if (error.status === 404) {
        throw { ...error, message: 'Item tidak ditemui.' };
      }
      throw error;
    }
  },
  undo: async (id) => {
    try {
      return await api.post(`/pic-recycle-bin/${id}/undo`);
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      if (backendMessage) {
        throw { ...error, message: backendMessage };
      }
      throw error;
    }
  },
  cancelPending: async (id) => {
    try {
      return await api.delete(`/pic-recycle-bin/pending/${id}`);
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      if (backendMessage) {
        throw { ...error, message: backendMessage };
      }
      throw error;
    }
  }
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
  getByIc: (ic) => api.get(`/users/${encodeURIComponent(ic)}`),
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
  exportApprovalHistory: (params) => api.get('/ib/export/history', { params })
};

// Receipt API
export const receiptAPI = {
  getByNumber: (receiptNumber) => api.get(`/receipts/${receiptNumber}`),
  getFeeReceipt: (feeId) => api.get(`/receipts/fee/${feeId}`),
  getPaymentReceipt: (paymentId) => api.get(`/receipts/payment/${paymentId}`),
  getUserReceipts: (userId) => api.get(`/receipts/user/${userId}`),
};

// Weather API
export const weatherAPI = {
  getCurrent: () => api.get('/weather/current'),
  clearCache: () => api.delete('/weather/cache'),
};

// Quran Quote API
export const quranQuoteAPI = {
  getDaily: () => api.get('/quran-quote/daily'),
  clearCache: () => api.delete('/quran-quote/cache'),
};

export default api;
