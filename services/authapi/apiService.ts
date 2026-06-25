import { encryptRequest, decryptResponse } from "@/utils/encryption";
import { ENDPOINTS } from "@/constants/api";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";

// =========================
// BASE API CALL
// =========================
const apiCall = async (url: string, payload: unknown) => {

  console.log("=== REQUEST ===");
  console.log("URL:", url);
  console.log("PAYLOAD:", JSON.stringify(payload, null, 2));
  console.log("===============");

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();

  console.log("=== RAW RESPONSE ===");
  console.log("STATUS:", response.status);
  console.log("BODY:", rawText);
  console.log("====================");

  let rawData: any;
  try {
    rawData = rawText ? JSON.parse(rawText) : {};
  } catch (parseErr) {
    // Server didn't return JSON (HTML error page, empty body, plain text, etc.)
    const snippet = rawText?.slice(0, 200) || "(empty response)";
    throw new Error(
      `Server returned non-JSON response (status ${response.status}): ${snippet}`
    );
  }

  // Backend responds with encrypted { iv, data } — decrypt it
  if (rawData?.iv && rawData?.data) {
    const decrypted = decryptResponse(rawData);
    console.log("=== DECRYPTED ===");
    console.log(JSON.stringify(decrypted, null, 2));
    console.log("=================");

    if (!response.ok) {
      throw new Error(decrypted?.message || decrypted?.detail || "Request failed");
    }
    return decrypted;
  }

  // Plain response
  if (!response.ok) {
    throw new Error(rawData?.message || rawData?.detail || "Request failed");
  }

  return rawData;
};

// =========================
// AUTH APIs
// =========================
export const loginApi = async (email: string, password: string) => {
  return apiCall(ENDPOINTS.login, { email, password });
};

export const signupApi = async (
  full_name: string,
  email: string,
  password: string
) => {
  return apiCall(ENDPOINTS.signup, { full_name, email, password });
};

export const googleLoginApi = async (token: string) => {
  return apiCall(ENDPOINTS.googleLogin, { token });
};

export const sendOtpApi = async (phone: string) => {
  return apiCall(ENDPOINTS.sendOtp, { phone });
};

export const verifyOtpApi = async (phone: string, otp: string) => {
  return apiCall(ENDPOINTS.verifyOtp, { phone, otp });
};

// =========================
// FORGOT PASSWORD (3-step flow)
// =========================
// Step 1 — request an OTP to the user's registered email.
// Returns: { success: boolean, expires_in_seconds: number, message: string }
export const forgotPasswordSendOtpApi = async (email: string) => {
  return apiCall(ENDPOINTS.forgotPasswordSendOtp, { email });
};

// Step 2 — verify the OTP. Returns a short-lived reset_token used in step 3.
// Returns: { valid: boolean, reset_token: string, message: string }
export const forgotPasswordVerifyOtpApi = async (email: string, otp: string) => {
  return apiCall(ENDPOINTS.forgotPasswordVerifyOtp, { email, otp });
};

// Step 3 — set the new password. Invalidates all active sessions for the account.
// Returns: { success: boolean, message: string }
export const forgotPasswordResetApi = async (
  email: string,
  otp: string,
  new_password: string,
) => {
  return apiCall(ENDPOINTS.forgotPasswordReset, { email, otp, new_password });
};

// =========================
// SESSION — Refresh Token / Logout
// =========================
// Issues a new JWT access token using a valid refresh token.
// Returns: { token: string, expires_in: number }
export const refreshTokenApi = async (refresh_token: string) => {
  return apiCall(ENDPOINTS.refreshToken, { refresh_token });
};

// Logout takes the Bearer access token as a header (not a JSON body field) —
// it has its own minimal caller below instead of going through apiCall(),
// since apiCall() doesn't currently support custom headers or a no-body case.
// Returns: { success: boolean, message: string }
export const logoutApi = async (accessToken: string, refreshToken?: string) => {
  const response = await fetchWithTimeout(ENDPOINTS.logout, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
  });
  const rawText = await response.text();
  let rawData: any;
  try {
    rawData = rawText ? JSON.parse(rawText) : {};
  } catch {
    // Logout failing to parse shouldn't block local sign-out — caller treats
    // this as best-effort and clears local state regardless.
    return { success: false, message: 'Logout response was not valid JSON' };
  }
  if (rawData?.iv && rawData?.data) {
    return decryptResponse(rawData);
  }
  return rawData;
};

// =========================
// ONBOARDING
// =========================
// Saves the post-signup profile (name, dob, gender, blood type, height, weight).
// Headers: Authorization: Bearer <token>
// Body: { full_name, date_of_birth, gender, blood_type, height_cm?, weight_kg?, conditions?: string[] }
// Returns: { success: boolean, message: string }
export const saveOnboardingApi = async (
  accessToken: string,
  payload: {
    full_name: string;
    date_of_birth: string | null; // "YYYY-MM-DD"
    gender: string | null;
    blood_type: string | null;
    height_cm?: number;
    weight_kg?: number;
    conditions?: string[];
  },
) => {
  // Has its own caller (not apiCall()) for the same reason as logoutApi —
  // needs an Authorization header, which apiCall() doesn't support.
  const response = await fetchWithTimeout(ENDPOINTS.saveOnboarding, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const rawText = await response.text();
  let rawData: any;
  try {
    rawData = rawText ? JSON.parse(rawText) : {};
  } catch {
    const snippet = rawText?.slice(0, 200) || '(empty response)';
    throw new Error(`Server returned non-JSON response (status ${response.status}): ${snippet}`);
  }
  if (rawData?.iv && rawData?.data) {
    const decrypted = decryptResponse(rawData);
    if (!response.ok) {
      throw new Error(decrypted?.message || decrypted?.detail || 'Request failed');
    }
    return decrypted;
  }
  if (!response.ok) {
    throw new Error(rawData?.message || rawData?.detail || 'Request failed');
  }
  return rawData;
};