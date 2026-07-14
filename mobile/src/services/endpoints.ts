import api from './api';

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const listingsAPI = {
  getAll: (params?: any) => api.get('/listings', { params }),
  getOne: (id: string) => api.get(`/listings/${id}`),
  create: (data: any) => api.post('/listings', data),
  getMyListings: () => api.get('/listings/owner/me'),
};

export const searchAPI = {
  search: (params?: any) => api.get('/search', { params }),
  aiSearch: (query: string) => api.post('/search/ai', { query }),
};

export const requestsAPI = {
  getAll: () => api.get('/requests'),
  create: (data: any) => api.post('/requests', data),
  update: (id: string, status: string) => api.patch(`/requests/${id}`, { status }),
  getContact: (id: string) => api.get(`/requests/${id}/contact`),
};

export const savedAPI = {
  getAll: () => api.get('/saved'),
  save: (listingId: string) => api.post(`/saved/${listingId}`),
  unsave: (listingId: string) => api.delete(`/saved/${listingId}`),
};

export const chatAPI = {
  getChats: () => api.get('/chats'),
  getMessages: (chatId: string, params?: any) => api.get(`/chats/${chatId}/messages`, { params }),
};
