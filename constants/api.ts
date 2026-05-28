export const BASE_URL = "http://192.168.0.138:8060";

export const ENDPOINTS = {
  // Auth
  login:         `${BASE_URL}/auth/login`,
  signup:        `${BASE_URL}/auth/signup`,
  googleLogin:   `${BASE_URL}/auth/google-login`,
  sendOtp:       `${BASE_URL}/auth/send-otp`,
  verifyOtp:     `${BASE_URL}/auth/verify-otp`,

  // Reports
  analyzeReport: `${BASE_URL}/analyze-report`,
};