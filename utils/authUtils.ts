
import { api } from "@/services/api";
import { decryptAES256, encryptAES256 } from "@/utils/crypto";
import { getOrCreateDeviceId } from "@/utils/deviceUtils";
import { clearAll, getItem, setItem } from "@/utils/storage";
import { jwtDecode } from "jwt-decode";

const KEY = "qNv19O1mWzx+6jEzgT8d1iQz1n80it6iIVhHcK82VZI=";

/* ─── Helper: strip BOM + whitespace before JSON.parse ──────────────────── */
const safeParse = (raw: string): any => {
  const cleaned = raw.replace(/^\uFEFF/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Invalid JSON after decrypt");
  }
};

const decryptAndParse = (encrypted: string): any => {
  // FIX #1: decryptAES256 is now synchronous
  const raw = decryptAES256(encrypted, KEY);
  return safeParse(raw);
};

/* ─── FIX #6: isTokenExpired — exported for use in login.tsx / AuthContext ─ */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    // 60-second buffer (same as web AuthPage)
    return decoded.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
};

/* ─── FIX #7: clearStoredTokens — named alias matching web convention ────── */
export const clearStoredTokens = async (): Promise<void> => {
  await clearAll();
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* STORE TOKENS                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
export const storeTokens = async (
  accessToken: string,
  refreshToken: string,
  user: any,
): Promise<void> => {
  // FIX #1: encryptAES256 is now synchronous
  const encAccess = encryptAES256(accessToken, KEY);
  const encRefresh = encryptAES256(refreshToken, KEY);

  await setItem("authToken", encAccess);
  await setItem("refreshToken", encRefresh);

  // FIX #3: guard against null/undefined user to avoid storing "null" string
  if (user != null) {
    await setItem("userData", JSON.stringify(user));
  }
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* GET STORED TOKENS                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */
export const getStoredTokens = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> => {

  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  try {
    const encAccess = await getItem("authToken");

    if (encAccess) accessToken = decryptAES256(encAccess, KEY);
  } catch {
    accessToken = null;
  }

  try {
    const encRefresh = await getItem("refreshToken");

    if (encRefresh) refreshToken = decryptAES256(encRefresh, KEY);
  } catch {
    refreshToken = null;
  }

  return { accessToken, refreshToken };
};


export const refreshAccessToken = async (
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> => {

  const encrypted = encryptAES256(JSON.stringify({ refreshToken }), KEY);

  const deviceId = await getOrCreateDeviceId();

  const res = await api.request<any>(
    "/api/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ value: encrypted }),
      headers: {
        "x-device-id": deviceId,
      },
    }
  );

  const userRaw = await getItem("userData");

  if (!userRaw) {
    await clearAll();
    throw new Error("User data missing");
  }
  const json = res;
  let decrypted: any = json;

  if (json?.value && typeof json.value === "string") {
    try {
      decrypted = decryptAndParse(json.value);
    } catch {
      decrypted = json;
    }
  }

  const newAccessToken =
    decrypted.accessToken ?? decrypted.token ?? decrypted.access_token;
  const newRefreshToken =
    decrypted.refreshToken ?? decrypted.refresh_token ?? refreshToken;

  if (!newAccessToken) {
    await clearAll();
    throw new Error("Session expired");
  }


  let parsedUser: any = null;
  try {
    parsedUser = userRaw ? safeParse(userRaw) : null;
  } catch {
    parsedUser = null;
  }

  await storeTokens(newAccessToken, newRefreshToken, parsedUser);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};


export const createAuthenticatedFetch = async (): Promise<
  (url: string, options?: RequestInit) => Promise<Response>
> => {
  const { accessToken } = await getStoredTokens();

  return (url: string, options: RequestInit = {}) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
};
