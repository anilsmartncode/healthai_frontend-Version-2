import * as SecureStore from 'expo-secure-store';
import { MMKV } from 'react-native-mmkv';

// ── MMKV instance — AES-256 encrypted, ~30x faster than AsyncStorage ─────────
// Used for non-sensitive app data (AI sessions, medicine cache, theme, etc.)
// Auth tokens stay in SecureStore (hardware-backed keychain/keystore).
export const mmkvStorage = new MMKV({
  id: 'healthai-storage',
  encryptionKey: 'healthai-mmkv-enc-key-2025',
});

// ── Secure auth token storage (SecureStore — hardware encrypted) ──────────────
export const storage = {
  get: async <T>(key: string): Promise<T | null> => {
    const v = await SecureStore.getItemAsync(key);
    return v ? (JSON.parse(v) as T) : null;
  },
  set: async (key: string, value: unknown) =>
    SecureStore.setItemAsync(key, JSON.stringify(value)),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};

// ── MMKV Polyfill (drop-in AsyncStorage replacement) ─────────────────────────
// All callers use `await` so we wrap synchronous MMKV in Promise.resolve().
export const SecureAsyncStorage = {
  getItem: (key: string): Promise<string | null> => {
    const value = mmkvStorage.getString(key);
    return Promise.resolve(value ?? null);
  },
  setItem: (key: string, value: string): Promise<void> => {
    mmkvStorage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    mmkvStorage.delete(key);
    return Promise.resolve();
  },
  clear: (): Promise<void> => {
    mmkvStorage.clearAll();
    return Promise.resolve();
  },
};

// ── Standalone helpers (backwards-compatible) ─────────────────────────────────
export const setItem = (key: string, value: string): Promise<void> => {
  mmkvStorage.set(key, value);
  return Promise.resolve();
};

export const getItem = (key: string): Promise<string | null> => {
  return Promise.resolve(mmkvStorage.getString(key) ?? null);
};

export const removeItem = (key: string): Promise<void> => {
  mmkvStorage.delete(key);
  return Promise.resolve();
};

export const clearAll = (): Promise<void> => {
  const keys = ['authToken', 'refreshToken', 'userData', 'device_id'];
  keys.forEach((key) => mmkvStorage.delete(key));
  return Promise.resolve();
};
