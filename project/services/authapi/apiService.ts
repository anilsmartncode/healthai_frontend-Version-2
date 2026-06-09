import { encryptRequest, decryptResponse } from "@/utils/encryption";
import { ENDPOINTS } from "@/constants/api";

// =========================
// BASE API CALL
// =========================
const apiCall = async (url: string, payload: unknown) => {

  console.log("=== REQUEST ===");
  console.log("URL:", url);
  console.log("PAYLOAD:", JSON.stringify(payload, null, 2));
  console.log("===============");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawData = await response.json();

  console.log("=== RAW RESPONSE ===");
  console.log("STATUS:", response.status);
  console.log(JSON.stringify(rawData, null, 2));
  console.log("====================");

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