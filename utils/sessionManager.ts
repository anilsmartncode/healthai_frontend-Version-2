import * as Application from "expo-application";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/* ================= KEYS ================= */

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_data";
const DEVICE_ID_KEY = "device_id";

/* ================= DEVICE ================= */

export const getDeviceId = async (): Promise<string> => {
  try {
    const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (storedId) return storedId;

    let deviceId: string | null = null;

    if (Platform.OS === "android") {
      try {
        deviceId = Application.getAndroidId(); // ✅ FIXED
      } catch {
        deviceId = null;
      }
    } else {
      deviceId = Device.osInternalBuildId ?? null;
    }

    const finalId = deviceId ?? `device_${Date.now()}`;

    await SecureStore.setItemAsync(DEVICE_ID_KEY, finalId);
    return finalId;
  } catch {
    return `device_${Date.now()}`;
  }
};

export const clearDeviceId = async () => {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
};

/* ================= SESSION ================= */

export const generateSessionId = () => {
  const random = Math.random().toString(36).substring(2, 10);
  return `SESSION_${Date.now()}_${random}`;
};

/* ================= SAVE SESSION ================= */

export const saveSession = async (
  accessToken: string,
  refreshToken: string,
  user: any,
) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

/* ================= GET SESSION ================= */

export const getSession = async () => {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  const userData = await SecureStore.getItemAsync(USER_KEY);

  return {
    accessToken,
    refreshToken,
    user: userData ? JSON.parse(userData) : null,
  };
};

/* ================= CLEAR SESSION ================= */

export const clearSession = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};
