import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  get: async <T>(key: string): Promise<T | null> => {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  },
  set: async (key: string, value: unknown) =>
    AsyncStorage.setItem(key, JSON.stringify(value)),
  remove: (key: string) => AsyncStorage.removeItem(key),
};

// ── BUG FIX ──────────────────────────────────────────────────────────────
// utils/authUtils.ts imports { clearAll, getItem, setItem } from this file,
// but only `storage` (above) was ever exported here. That made every call
// to storeTokens() / getStoredTokens() throw "setItem is not a function" /
// "getItem is not a function" at runtime — silently breaking the encrypted
// auth-token flow (authUtils.ts already encrypts with AES before storing,
// so plain AsyncStorage underneath is fine — no need for expo-secure-store).
export const setItem = (key: string, value: string) =>
  AsyncStorage.setItem(key, value);

export const getItem = (key: string) => AsyncStorage.getItem(key);

export const removeItem = (key: string) => AsyncStorage.removeItem(key);

export const clearAll = async () => {
  const keys = ['authToken', 'refreshToken', 'userData', 'device_id'];
  await Promise.allSettled(keys.map((key) => AsyncStorage.removeItem(key)));
};
