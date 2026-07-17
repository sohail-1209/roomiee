// All API calls — grouped by feature. Import only what you need.
import api from './api';

// ─── Auth ────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateFcmToken: (fcmToken) => api.patch('/auth/fcm-token', { fcmToken }),
  googleAuth: (idToken) => api.post('/auth/google', { idToken }),
  completeProfile: (data) => api.post('/auth/complete-profile', data),
  sendVerification: () => api.post('/auth/send-verification'),
  verifyEmail: (otp) => api.post('/auth/verify-email', { otp }),
  confirmEmailVerified: (email) => api.post('/auth/confirm-email-verified', { email }),
};

// ─── Listings ─────────────────────────────────────────
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getOne: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  updateStatus: (id, status) => api.patch(`/listings/${id}/status`, { status }),
  delete: (id) => api.delete(`/listings/${id}`),
  getMyListings: () => api.get('/listings/owner/me'),
  getMyBookings: () => api.get('/listings/tenant/bookings'),
  createFromBooking: (data) => api.post('/listings/from-booking', data),
  completeBooking: (id) => api.post(`/listings/tenant/bookings/${id}/complete`),
};

// ─── Search ───────────────────────────────────────────
export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  aiSearch: (query) => api.post('/search/ai', { query }),
};

// ─── Requests ─────────────────────────────────────────
export const requestsAPI = {
  getAll: () => api.get('/requests'),
  create: (data) => api.post('/requests', data),
  update: (id, status) => api.patch(`/requests/${id}`, { status }),
  getContact: (id) => api.get(`/requests/${id}/contact`),
};

// ─── Saved ────────────────────────────────────────────
export const savedAPI = {
  getAll: () => api.get('/saved'),
  save: (listingId) => api.post(`/saved/${listingId}`),
  unsave: (listingId) => api.delete(`/saved/${listingId}`),
};

// ─── Chat ─────────────────────────────────────────────
export const chatAPI = {
  getChats: () => api.get('/chats'),
  getMessages: (chatId, params) => api.get(`/chats/${chatId}/messages`, { params }),
  sendMessage: (chatId, data) => api.post(`/chats/${chatId}/messages`, data),
};

// ─── Reviews ──────────────────────────────────────────
export const reviewsAPI = {
  getUserReviews: (userId) => api.get(`/reviews/${userId}`),
  create: (data) => api.post('/reviews', data),
};

// ─── Reports ──────────────────────────────────────────
export const reportsAPI = {
  create: (data) => api.post('/reports', data),
};

// ─── Upload ───────────────────────────────────────────
export const uploadAPI = {
  listingPhotos: (listingId, formData) =>
    api.post(`/upload/listing-photos/${listingId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deletePhoto: (photoId) => api.delete(`/upload/photos/${photoId}`),
  profilePhoto: (formData) =>
    api.post('/upload/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Notifications ────────────────────────────────────
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ─── Users ────────────────────────────────────────────
export const usersAPI = {
  getUser: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.patch('/users/me', data),
};

// ─── Xiayoki Chatbot ─────────────────────────────────
export const xiayokiAPI = {
  chat: (message, history = []) => api.post('/xiayoki/chat', { message, history }),
};

// ─── Admin ────────────────────────────────────────────
export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  banUser: (id, isBanned) => api.patch(`/admin/users/${id}/ban`, { isBanned }),
  getAllListings: () => api.get('/admin/listings'),
  verifyListing: (id) => api.patch(`/admin/listings/${id}/verify`),
  getAnalytics: () => api.get('/admin/analytics'),
  getAllReports: () => api.get('/reports'),
  updateReport: (id, status) => api.patch(`/reports/${id}`, { status }),
};

