export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://healthai.smartncode.com";

// ─── URL-PREFIX NOTE ──────────────────────────────────────────────────────────
// Auth endpoints:    BASE_URL + /api/auth/...       (single /api)
// Reports endpoints: BASE_URL + /api/...            (single /api)
// AI endpoints:      BASE_URL + /ai/...             (no /api prefix)
//
// Medicine + Profile + Family endpoints: BASE_URL + /api/api/...  (double /api)
//   Confirmed from backend: /api/api/medicines/search works.
//   All medicines/*, user/*, and family/* routes follow the same double-prefix.
// ─────────────────────────────────────────────────────────────────────────────

export const ENDPOINTS = {
  // ── Auth
  // Firebase Auth
  firebaseLogin: `${BASE_URL}/api/api/auth/firebase-login`,

  // Custom API Auth
  login: `${BASE_URL}/api/auth/login`,


  // Auth — Forgot Password
  forgotPasswordSendOtp: `${BASE_URL}/api/auth/forgot-password/send-otp`,
  forgotPasswordVerifyOtp: `${BASE_URL}/api/auth/forgot-password/verify-otp`,
  forgotPasswordReset: `${BASE_URL}/api/auth/forgot-password/reset`,

  // Auth — Session
  refreshToken: `${BASE_URL}/api/auth/refresh-token`,
  logout: `${BASE_URL}/api/auth/logout`,

  // Auth — Onboarding
  saveOnboarding: `${BASE_URL}/api/auth/onboarding`,

  // Auth — OTP (Family invite verification)
  familyOtpSend: `${BASE_URL}/api/auth/otp/send`,
  familyOtpVerify: `${BASE_URL}/api/auth/otp/verify`,

  // ── Profile 
  profileMe: `${BASE_URL}/api/api/user/profile`,
  profileMePath: '/api/api/user/profile',           // relative path for api.request()
  profileAvatar: `${BASE_URL}/api/api/user/profile/avatar`,
  profileAvatarPath: '/api/api/user/profile/avatar',
  deleteAccount: `${BASE_URL}/api/api/user/account`,

  // ── Reports 
  analyzeReport: `${BASE_URL}/api/analyze-report`,
  listReports: `${BASE_URL}/api/reports`,
  scorecardReport: `${BASE_URL}/api/reports/scorecard`,
  reportDetail: (id: string) => `${BASE_URL}/api/reports/${id}`,
  reportDelete: (id: string) => `${BASE_URL}/api/reports/${id}`,
  reportShare: (id: string) => `${BASE_URL}/api/api/reports/${id}/share`,

  // ── Doctors 
  doctors: `${BASE_URL}/api/doctors`,
  doctorDetail: (id: string | number) => `${BASE_URL}/api/doctors/${id}`,

  // ── AI Assistant 
  aiChatPath: '/api/ai/chat',
  aiSuggestedPromptsPath: '/api/api/ai/suggested-prompts',
  aiMemoryPath: '/api/api/ai/memory',
  aiAskWithReportPath: '/api/api/ai/ask-with-report',
  aiHealthAlertsPath: '/api/api/ai/health-alerts',
  aiSessionsPath: '/api/ai/sessions',
  aiSessionPath: (id: string) => `/api/ai/sessions/${id}`,

  // ── Medicines — Browse (/api/api/medicines/...) ───────────────────────────
  medicineCategories: `${BASE_URL}/api/api/medicines/categories`,
  medicineSearch: `${BASE_URL}/api/api/medicines/search`,
  medicinesByCategory: `${BASE_URL}/api/api/medicines`,
  medicineDetails: (id: string) => `${BASE_URL}/api/api/medicines/${id}`,
  medicineRecent: `${BASE_URL}/api/api/medicines/recent`,
  medicinePopular: `${BASE_URL}/api/api/medicines/popular`,

  // ── Medicines — Saved / User Medicines (/api/api/user/...) ───────────────
  userMedicines: `${BASE_URL}/api/api/user/medicines`,
  userMedicineRemove: (id: string) => `${BASE_URL}/api/api/user/medicines/${id}`,
  updateFcmToken: `${BASE_URL}/api/api/user/fcm-token`,

  // ── Medicines — Reminders (/api/api/reminders/...) ───────────────────────
  reminders: `${BASE_URL}/api/api/reminders`,
  remindersToday: `${BASE_URL}/api/api/reminders/today`,
  reminderTaken: (id: string) => `${BASE_URL}/api/api/reminders/${id}/taken`,
  reminderUntake: (id: string) => `${BASE_URL}/api/api/reminders/${id}/untake`,
  reminderMissed: (id: string) => `${BASE_URL}/api/api/reminders/${id}/missed`,
  reminderHistory: `${BASE_URL}/api/api/reminders/history`,
  reminderUpdate: (id: string) => `${BASE_URL}/api/api/reminders/${id}`,
  reminderDelete: (id: string) => `${BASE_URL}/api/api/reminders/${id}`,

  // ── Medicines — Scanner (/api/api/medicine-scanner/...) ──────────────────
  scannerUpload: `${BASE_URL}/api/api/medicine-scanner/upload`,
  scannerResult: (scanId: string) => `${BASE_URL}/api/api/medicine-scanner/result/${scanId}`,
  scannerHistory: `${BASE_URL}/api/api/medicine-scanner/history`,

  // ── Medicines — Interaction Checker (/api/api/interactions/...) ──────────
  interactionsCheck: `${BASE_URL}/api/api/interactions/check`,
  interactionDetails: (id: string) => `${BASE_URL}/api/api/interactions/${id}`,
  interactionsSave: `${BASE_URL}/api/api/interactions/save`,
  interactionsHistory: `${BASE_URL}/api/api/interactions/history`,
  interactionHistoryDelete: (report_id: string) => `${BASE_URL}/api/api/interactions/${report_id}`,
  interactionsAiSummary: `${BASE_URL}/api/api/interactions/ai-summary`,

  // ── Family — Dashboard 
  familyDashboard: `${BASE_URL}/api/api/family/dashboard`,
  familyHealthHistory: `${BASE_URL}/api/api/family/health-score/history`,

  // ── Family — Members 
  familyMemberSearch: `${BASE_URL}/api/api/family/member/search`,
  familyMemberAdd: `${BASE_URL}/api/api/family/member/add-dependent`,
  familyMemberProfile: (memberId: string) => `${BASE_URL}/api/api/family/member/${memberId}/profile`,
  familyMemberRemove: (memberId: string) => `${BASE_URL}/api/api/family/member/${memberId}`,
  familyMemberPermissions: (memberId: string) => `${BASE_URL}/api/api/family/member/${memberId}/permissions`,

  // ── Family — Invitations 
  familyInviteSend: `${BASE_URL}/api/api/family/invite/send`,
  familyInviteGenerateLink: `${BASE_URL}/api/api/family/invite/generate-link`,
  familyInvitations: `${BASE_URL}/api/api/family/invitations`,
  familyInviteDetails: (inviteCode: string) => `${BASE_URL}/api/api/family/invite/${inviteCode}`,
  familyInviteResend: (inviteId: string) => `${BASE_URL}/api/api/family/invite/${inviteId}/resend`,
  familyInviteCancel: (inviteId: string) => `${BASE_URL}/api/api/family/invite/${inviteId}`,
  familyInviteAccept: (inviteId: string) => `${BASE_URL}/api/api/family/invite/${inviteId}/accept`,
  familyInviteDecline: (inviteId: string) => `${BASE_URL}/api/api/family/invite/${inviteId}/decline`,

  // ── Family — Tree 
  familyTree: `${BASE_URL}/api/api/family/tree`,

  // ── Family — AI 
  familyAiQuery: `${BASE_URL}/api/api/family/ai/query`,
  familyAiSuggestions: `${BASE_URL}/api/api/family/ai/suggested-questions`,

  // ── Family — Notifications 
  familyNotifications: `${BASE_URL}/api/api/family/notifications`,
  familyNotificationsRead: `${BASE_URL}/api/api/family/notifications/read`,

  // ── Family — Member Sub-screens 
  familyMemberHealthSummary: (id: string) => `${BASE_URL}/api/api/family/member/${id}/health-summary`,
  familyMemberReports: (id: string) => `${BASE_URL}/api/api/family/member/${id}/reports`,
  familyMemberMedications: (id: string) => `${BASE_URL}/api/api/family/member/${id}/medications`,
  familyMemberAppointments: (id: string) => `${BASE_URL}/api/api/family/member/${id}/appointments`,
  familyMemberAiInsights: (id: string) => `${BASE_URL}/api/api/family/member/${id}/ai-insights`,
  familyMemberEmergency: (id: string) => `${BASE_URL}/api/api/family/member/${id}/emergency`,
  familyMemberEmergencyContacts: (id: string) => `${BASE_URL}/api/api/family/member/${id}/emergency/contacts`,
  familyMemberEmergencyContact: (id: string, contactId: string) => `${BASE_URL}/api/api/family/member/${id}/emergency/contacts/${contactId}`,
  familyMemberMedicalInfo: (id: string) => `${BASE_URL}/api/api/family/member/${id}/emergency/medical-info`,

  // ── Family — Commute & Activity Tracking
  familyMemberGeofences: (id: string) => `${BASE_URL}/api/api/family/member/${id}/geofences`,
  familyMemberGeofenceDelete: (id: string, zoneId: string) => `${BASE_URL}/api/api/family/member/${id}/geofences/${zoneId}`,
  familyCommuteEvent: `${BASE_URL}/api/api/family/commute/event`,
  familyMemberCommuteHistory: (id: string) => `${BASE_URL}/api/api/family/member/${id}/commute/history`,
  familyMemberCommuteStatus: (id: string) => `${BASE_URL}/api/api/family/member/${id}/commute/status`,
  familyMemberSleep: (id: string) => `${BASE_URL}/api/api/family/member/${id}/sleep`,
  healthDataSync: `${BASE_URL}/api/api/user/health-data`,
  familyMemberTrackingPermissions: (id: string) => `${BASE_URL}/api/api/family/member/${id}/tracking-permissions`,

  // ── Translations
  supportedLanguagesPath: '/api/supported-languages',
  translateTextPath: '/api/translate-text',
};