import api from './api.js';

/**
 * Payment API Service
 * Handles all payment-related API calls
 */

export const paymentAPI = {
  // Create payment intent
  create: async (paymentData) => {
    return api.post('/payments/create', paymentData);
  },

  // Get payment by ID
  getById: async (paymentId) => {
    return api.get(`/payments/${paymentId}`);
  },

  // Get user payments
  getByUser: async (userId, limit = 50, offset = 0) => {
    return api.get(`/payments/user/${userId}?limit=${limit}&offset=${offset}`);
  },

  // Get all payments (admin)
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.method) params.append('method', filters.method);
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.user_telefon) params.append('user_telefon', filters.user_telefon);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    return api.get(`/payments/admin?${params.toString()}`);
  },

  // Initialize payment
  initialize: async (paymentId) => {
    return api.post(`/payments/${paymentId}/initialize`);
  },

  // Update payment status (admin)
  updateStatus: async (paymentId, status) => {
    return api.patch(`/payments/${paymentId}/status`, { status });
  },

  // Upload payment proof
  uploadProof: async (paymentId, file) => {
    const formData = new FormData();
    formData.append('proof', file);
    return api.post(`/payments/${paymentId}/proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Requery payment (admin)
  requery: async (paymentId) => {
    return api.post(`/payments/${paymentId}/requery`);
  }
};

export default paymentAPI;

