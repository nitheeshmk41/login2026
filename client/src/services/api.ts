import { axiosInstance } from './axios';

export const api = {
  getHealthStatus: async () => {
    const response = await axiosInstance.get<{ status: string }>('/health');
    return response.data;
  },

  // Generic methods
  get: async (url: string, params?: any) => await axiosInstance.get(url, { params }),
  post: async (url: string, data?: any) => await axiosInstance.post(url, data),
  put: async (url: string, data?: any) => await axiosInstance.put(url, data),
  delete: async (url: string) => await axiosInstance.delete(url),

  // Auth Module
  auth: {
    register: async (data: any) => await axiosInstance.post('/auth/register', data),
    checkEmail: async (email: string) => await axiosInstance.post('/auth/check-email', { email }),
    sendOtp: async (email: string) => await axiosInstance.post('/auth/send-otp', { email }),
    login: async (data: { loginId?: string; email?: string; password: string }) => await axiosInstance.post('/auth/login', data),
    logout: async () => await axiosInstance.post('/auth/logout'),
    forgotPassword: async (email: string) => await axiosInstance.post('/auth/forgot-password', { email }),
    resetPassword: async (data: { email: string; otp: string; newPassword: string }) => await axiosInstance.post('/auth/reset-password', data),
    changePassword: async (data: { currentPassword?: string; newPassword: string }) => await axiosInstance.post('/auth/change-password', data),
  },

  // User Management Module
  users: {
    profile: async () => await axiosInstance.get('/users/profile'),
    updateProfile: async (data: any) => await axiosInstance.put('/users/profile', data),
    getAll: async () => await axiosInstance.get('/users/'),
    create: async (data: any) => await axiosInstance.post('/users/', data),
    updateDetails: async (id: number | string, data: any) => await axiosInstance.put(`/users/${id}/details`, data),
    delete: async (id: number | string) => await axiosInstance.delete(`/users/${id}`),
    getById: async (id: number | string) => await axiosInstance.get(`/users/${id}`),
    updateRole: async (id: number | string, role: string) => await axiosInstance.put(`/users/${id}/role`, { role }),
    updateStatus: async (id: number | string, is_active: boolean) => await axiosInstance.put(`/users/${id}/status`, { is_active }),
  },

  alumni: {
    update: async (id: number | string, data: any) => await axiosInstance.put(`/users/alumni/${id}`, data),
    delete: async (id: number | string) => await axiosInstance.delete(`/users/alumni/${id}`),
  },

  // Events Module
  events: {
    getAll: async () => await axiosInstance.get('/events/'),
    getAssigned: async () => await axiosInstance.get('/events/assigned'),
    getTimeline: async (date?: string) => await axiosInstance.get('/events/timeline', { params: { date } }),
    getDetails: async (id: number | string) => await axiosInstance.get(`/events/${id}`),
    create: async (data: any) => await axiosInstance.post('/events/', data),
    update: async (id: number | string, data: any) => await axiosInstance.put(`/events/${id}`, data),
    delete: async (id: number | string) => await axiosInstance.delete(`/events/${id}`),
    assignCoordinator: async (eventId: number | string, user_id: number) => await axiosInstance.post(`/events/${eventId}/coordinators`, { user_id }),
  },

  // Event Registration Module
  registrations: {
    register: async (data: { event_id: number | string; team_name?: string; team_id?: number | string; team_members?: any[] }) => await axiosInstance.post('/registrations/', data),
    getMyRegistrations: async () => await axiosInstance.get('/registrations/my'),
    getEventRegistrations: async (eventId: number | string) => await axiosInstance.get(`/registrations/event/${eventId}`),
    cancel: async (id: number | string) => await axiosInstance.put(`/registrations/${id}/cancel`),
    deregister: async (eventId: number | string) => await axiosInstance.delete(`/registrations/event/${eventId}`),
  },

  // Payment Module
  payments: {
    getMyStatus: async () => await axiosInstance.get('/payments/my'),
    initiate: async (data: { transaction_reference: string; receipt_url?: string; amount?: number; payment_date?: string; payment_method?: string }) => await axiosInstance.post('/payments/', data),
    getAll: async () => await axiosInstance.get('/payments/'),
    verify: async (id: number | string, data?: { status?: string; rejection_reason?: string }) => await axiosInstance.put(`/payments/${id}/verify`, data || { status: 'VERIFIED' }),
    refund: async (id: number | string) => await axiosInstance.put(`/payments/${id}/refund`),
    // CSV payment verification flow
    uploadCsv: async (formData: FormData) => await axiosInstance.post('/payments/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    bulkVerify: async (payment_ids: number[]) => await axiosInstance.post('/payments/bulk-verify', { payment_ids }),
  },

  // Uploads Module
  uploads: {
    uploadReceipt: async (data: FormData) => await axiosInstance.post('/upload/receipt', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    uploadBonafide: async (data: FormData) => await axiosInstance.post('/upload/bonafide', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  },



  // Team Formation Module
  teams: {
    create: async (data: { name: string; event_id: number }) => await axiosInstance.post('/teams/', data),
    getMyTeams: async () => await axiosInstance.get('/teams/my'),
    getTeamDetails: async (teamId: number | string) => await axiosInstance.get(`/teams/${teamId}`),
    getEventTeams: async (eventId: number | string) => await axiosInstance.get(`/teams/event/${eventId}`),
    searchStudents: async (search: string) => await axiosInstance.get('/teams/students', { params: { search } }),

    // Invitations (Leader → Participant)
    inviteMember: async (teamId: number | string, login_id: string) => await axiosInstance.post(`/teams/${teamId}/invite`, { login_id }),
    getMyInvitations: async () => await axiosInstance.get('/teams/invitations/my'),
    respondToInvitation: async (id: number | string, status: 'accepted' | 'declined') => await axiosInstance.put(`/teams/invitations/${id}`, { status }),

    // Join Requests (Participant → Team)
    sendJoinRequest: async (teamId: number | string) => await axiosInstance.post(`/teams/${teamId}/join-request`),
    getMyJoinRequests: async () => await axiosInstance.get('/teams/join-requests/my'),
    respondToJoinRequest: async (id: number | string, status: 'accepted' | 'rejected') => await axiosInstance.put(`/teams/join-requests/${id}`, { status }),

    // Team Management
    registerTeam: async (teamId: number | string) => await axiosInstance.post(`/teams/${teamId}/register`),
    removeMember: async (teamId: number | string, userId: number | string) => await axiosInstance.delete(`/teams/${teamId}/members/${userId}`),
    delete: async (teamId: number | string) => await axiosInstance.delete(`/teams/${teamId}`),
  },

  // Attendance Module
  attendance: {
    getEventList: async (eventId: number | string) => await axiosInstance.get(`/attendance/event/${eventId}`),
    mark: async (data: { event_id: number; student_id: number; status: string }) => await axiosInstance.post('/attendance/', data),
    markByQR: async (data: { qr_code: string }) => await axiosInstance.post('/attendance/scan-qr', data),
  },

  // Notifications Module
  notifications: {
    getMy: async () => await axiosInstance.get('/notifications/'),
    getUnreadCount: async () => await axiosInstance.get('/notifications/unread-count'),
    markAsRead: async (id: number | string) => await axiosInstance.put(`/notifications/${id}/read`),
    markAllAsRead: async () => await axiosInstance.put('/notifications/read-all'),
  },

  // Competition Results Module
  results: {
    getAll: async () => await axiosInstance.get('/results'),
    getForEvent: async (eventId: number | string) => await axiosInstance.get(`/results/event/${eventId}`),
    saveForEvent: async (eventId: number | string, data: any) => await axiosInstance.put(`/results/event/${eventId}`, data),
    getEventResult: async (eventId: number | string) => await axiosInstance.get(`/results/event/${eventId}`),
    saveEventResult: async (eventId: number | string, data: any) => await axiosInstance.put(`/results/event/${eventId}`, data),
  },

  // Announcements Ticker
  announcements: {
    getActive: async () => await axiosInstance.get('/announcements/'),
    create: async (data: any) => await axiosInstance.post('/announcements/', data),
    update: async (id: number | string, data: any) => await axiosInstance.put(`/announcements/${id}`, data),
    delete: async (id: number | string) => await axiosInstance.delete(`/announcements/${id}`),
  },

  // Dynamic Settings
  settings: {
    get: async () => await axiosInstance.get('/settings/'),
    update: async (data: any) => await axiosInstance.put('/settings/', data),
  },

  // Stats Telemetry
  stats: {
    getParticipantStats: async () => await axiosInstance.get('/stats/participants'),
  },

  // Bonafides Module
  bonafides: {
    getMy: async () => await axiosInstance.get('/bonafides/my'),
    upload: async (data: any) => await axiosInstance.post('/bonafides/', data),
    verify: async (id: number | string, data?: any) => await axiosInstance.put(`/bonafides/${id}/verify`, data),
  },

  // Exports Module (Reports)
  exports: {
    getEventStudents: async (eventId: number | string) => await axiosInstance.get(`/exports/event/${eventId}/students`, { responseType: 'blob' }),
    getAttendance: async () => await axiosInstance.get('/exports/attendance', { responseType: 'blob' }),
    getMasterRoster: async () => await axiosInstance.get('/exports/users', { responseType: 'blob' }),
    getRegistrations: async () => await axiosInstance.get('/exports/registrations', { responseType: 'blob' }),
    getPayments: async () => await axiosInstance.get('/exports/payments', { responseType: 'blob' }),
    getTeams: async () => await axiosInstance.get('/exports/teams', { responseType: 'blob' }),
    getAlumni: async () => await axiosInstance.get('/exports/alumni', { responseType: 'blob' }),
  },
};
