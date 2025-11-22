import api from './api';

// Authentication APIs
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => {
    // If data is FormData (file upload), use PATCH for partial update
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    const method = data instanceof FormData ? 'patch' : 'put';
    return api[method]('/auth/profile/', data, config);
  },
  changePassword: (data) => api.post('/auth/change-password/', data),
  applyTechnician: (data) => api.post('/auth/technician/apply/', data),
  // Password Reset APIs
  requestPasswordReset: (email) => api.post('/auth/password-reset/request/', { email }),
  verifyResetToken: (token) => api.get(`/auth/password-reset/verify/?token=${token}`),
  resetPassword: (token, newPassword, confirmPassword) => 
    api.post('/auth/password-reset/confirm/', { 
      token, 
      new_password: newPassword, 
      confirm_password: confirmPassword 
    }),
  // Technician Application APIs
  submitTechnicianApplication: (data) => api.post('/auth/technician-application/submit/', data),
  getMyApplication: () => api.get('/auth/technician-application/my-application/'),
  getAdminApplications: (params) => api.get('/auth/admin/technician-applications/', { params }),
  reviewApplication: (id, reviewData) => api.post(`/auth/admin/technician-applications/${id}/review/`, reviewData),
};

// Issue Library APIs
export const issuesAPI = {
  getCategories: () => api.get('/issues/categories/'),
  getIssues: (params) => api.get('/issues/resolved/', { params }),
  getIssueDetail: (id) => api.get(`/issues/resolved/${id}/`),
  markHelpful: (id) => api.post(`/issues/resolved/${id}/helpful/`),
  getSimilarIssues: (params) => api.get('/issues/similar/', { params }),
  getPopularIssues: () => api.get('/issues/popular/'),
  getRecentIssues: () => api.get('/issues/recent/'),
  createIssue: (data) => api.post('/issues/resolved/create/', data),
};

// AI Chat APIs
export const chatAPI = {
  startSession: (data) => api.post('/chat/start/', data),
  sendMessage: (sessionId, message) => 
    api.post(`/chat/sessions/${sessionId}/message/`, { message }),
  getChatHistory: (sessionId) => api.get(`/chat/sessions/${sessionId}/`),
  listSessions: () => api.get('/chat/sessions/'),
  closeSession: (sessionId) => api.post(`/chat/sessions/${sessionId}/close/`),
  deleteSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}/delete/`),
};

// Support Tickets APIs
export const ticketsAPI = {
  createTicket: (data) => api.post('/tickets/create/', data),
  getMyTickets: (params) => api.get('/tickets/my-tickets/', { params }),
  getTicketDetail: (id) => api.get(`/tickets/${id}/`),
  getPendingTickets: () => api.get('/tickets/admin/pending/'),
  getAllTickets: (params) => api.get('/tickets/admin/all/', { params }),
  assignTicket: (id, technicianId) => 
    api.post(`/tickets/${id}/assign/`, { technician_id: technicianId }),
  getAssignedTickets: () => api.get('/tickets/technician/assigned/'),
  updateStatus: (id, updateData) => 
    api.patch(`/tickets/${id}/update-status/`, updateData),
  updateTicketDetails: (id, details) => 
    api.patch(`/tickets/${id}/update-details/`, details),
  addComment: (id, comment) => 
    api.post(`/tickets/${id}/add-update/`, { update_text: comment }),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tickets/${id}/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDashboardStats: () => api.get('/tickets/admin/dashboard-stats/'),
  deleteTicket: (id) => api.delete(`/tickets/${id}/delete/`),
  createIssueFromTicket: (ticketId, issueData) => 
    api.post(`/tickets/${ticketId}/create-issue/`, issueData),
};

// Notification Settings APIs
export const notificationsAPI = {
  getSettings: () => api.get('/auth/notifications/settings/'),
  updateSettings: (data) => api.put('/auth/notifications/settings/', data),
};
