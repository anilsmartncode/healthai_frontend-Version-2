import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ── MMKV — lazy + crash-safe initialization ───────────────────────────────────
// We wrap this in a try/catch so a native module failure never crashes the app.
// If MMKV fails to initialize (e.g. corrupted install), we silently fall back
// to AsyncStorage so the user can still use the app.
let _mmkv: import('react-native-mmkv').MMKV | null = null;

function getMmkv() {
  if (_mmkv) return _mmkv;
  try {
    const { MMKV } = require('react-native-mmkv');
    _mmkv = new MMKV({
      id: 'healthai-storage',
      encryptionKey: 'healthai-mmkv-enc-key-2025',
    });
    console.log('[Storage] MMKV initialized successfully');
  } catch (e) {
    console.warn('[Storage] MMKV failed to initialize, falling back to AsyncStorage:', e);
    _mmkv = null;
  }
  return _mmkv;
}

// Export for direct use if needed
export const mmkvStorage = { get: getMmkv };

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

// ── MMKV Polyfill with AsyncStorage fallback ──────────────────────────────────
export const SecureAsyncStorage = {
  getItem: (key: string): Promise<string | null> => {
    const mmkv = getMmkv();
    if (mmkv) {
      return Promise.resolve(mmkv.getString(key) ?? null);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    const mmkv = getMmkv();
    if (mmkv) {
      mmkv.set(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    const mmkv = getMmkv();
    if (mmkv) {
      mmkv.remove(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
  clear: (): Promise<void> => {
    const mmkv = getMmkv();
    if (mmkv) {
      mmkv.clearAll();
      return Promise.resolve();
    }
    return AsyncStorage.clear();
  },
};

// ── Standalone helpers (backwards-compatible) ─────────────────────────────────
export const setItem = (key: string, value: string): Promise<void> => {
  const mmkv = getMmkv();
  if (mmkv) {
    mmkv.set(key, value);
    return Promise.resolve();
  }
  return AsyncStorage.setItem(key, value);
};

export const getItem = (key: string): Promise<string | null> => {
  const mmkv = getMmkv();
  if (mmkv) {
    return Promise.resolve(mmkv.getString(key) ?? null);
  }
  return AsyncStorage.getItem(key);
};

export const removeItem = (key: string): Promise<void> => {
  const mmkv = getMmkv();
  if (mmkv) {
    mmkv.remove(key);
    return Promise.resolve();
  }
  return AsyncStorage.removeItem(key);
};

export const clearAll = async (): Promise<void> => {
  const mmkv = getMmkv();
  const keys = ['authToken', 'refreshToken', 'userData', 'device_id'];
  if (mmkv) {
    keys.forEach((key) => mmkv.remove(key));
  } else {
    await Promise.allSettled(keys.map((key) => AsyncStorage.removeItem(key)));
  }
};
