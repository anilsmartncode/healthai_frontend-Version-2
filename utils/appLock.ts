/**
 * utils/appLock.ts
 *
 * Client-side secure storage & state manager for App Lock & Security.
 * Stores 4-digit PIN and biometric preferences in hardware-backed SecureStore.
 */

import { storage } from './storage';

export interface AppLockSettings {
  enabled: boolean;
  useBiometrics: boolean;
  hasPin: boolean;
}

const KEY_ENABLED = '@healthai_app_lock_enabled';
const KEY_BIOMETRICS = '@healthai_app_lock_biometrics';
const KEY_PIN = '@healthai_app_lock_pin';

export const getAppLockSettings = async (): Promise<AppLockSettings> => {
  try {
    const enabled = (await storage.get<boolean>(KEY_ENABLED)) ?? false;
    const useBiometrics = (await storage.get<boolean>(KEY_BIOMETRICS)) ?? true;
    const pin = await storage.get<string>(KEY_PIN);
    return {
      enabled,
      useBiometrics,
      hasPin: typeof pin === 'string' && pin.length === 4,
    };
  } catch (e) {
    console.warn('[appLock] Error loading settings:', e);
    return { enabled: false, useBiometrics: true, hasPin: false };
  }
};

export const setAppLockEnabled = async (enabled: boolean): Promise<void> => {
  await storage.set(KEY_ENABLED, enabled);
};

export const setUseBiometrics = async (useBiometrics: boolean): Promise<void> => {
  await storage.set(KEY_BIOMETRICS, useBiometrics);
};

export const savePin = async (pin: string): Promise<void> => {
  await storage.set(KEY_PIN, pin);
};

export const verifyPin = async (inputPin: string): Promise<boolean> => {
  try {
    const storedPin = await storage.get<string>(KEY_PIN);
    return storedPin === inputPin;
  } catch {
    return false;
  }
};

export const removePin = async () => {
  await storage.remove(KEY_PIN);
  await storage.set(KEY_ENABLED, false);
};
