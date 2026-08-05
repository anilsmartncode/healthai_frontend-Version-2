import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storage } from '@/utils/storage';
import { reportStorageKey, reportDetailsStorageKey } from '@/services/reportsApi';
import { medicineStorageKey, reminderStorageKey } from '@/services/medicineTabApi';
import { STORAGE_KEYS as AI_STORAGE_KEYS } from '@/services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Platform } from 'react-native';
import { router } from 'expo-router';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  phone: string | null;
  memberId: number | null;      // logged-in user's numeric ID (sent to analyze-report)
  signIn: (token: string, phone: string, memberId?: number | null, refreshToken?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
  // Calls POST /api/auth/refresh-token with the stored refresh_token and
  // persists the new access token. Returns the new token, or null if the
  // refresh failed (e.g. refresh_token itself expired) — callers should
  // treat a null return as "session is over, send the user to login."
  refreshSession: () => Promise<string | null>;
  ready: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await storage.get<string>('token');
      const rt = await storage.get<string>('refresh_token');
      const p = await storage.get<string>('phone');
      const m = await storage.get<number>('member_id');
      setToken(t);
      setRefreshToken(rt);
      setPhone(p);
      setMemberId(m ?? null);
      setReady(true);

      // If user is already logged in, ensure backend has the latest FCM token
      if (t) {
        registerPushToken();
      }
    })();
  }, []);

  const registerPushToken = async () => {
    try {
      const { requestNotificationPermissions, getFCMToken } = await import('@/utils/notifications');
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          const { ENDPOINTS } = await import('@/constants/api');
          const { medicineApiCall } = await import('@/services/Medicineapiclient');
          await medicineApiCall(ENDPOINTS.updateFcmToken, {
            method: 'POST',
            body: { fcm_token: fcmToken }
          });
          console.log('[AuthContext] Successfully registered FCM token with backend.');
        }
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to register FCM token', e);
    }
  };

  const signIn = async (t: string, p: string, mId?: number | null, rt?: string | null) => {
    await storage.set('token', t);
    await storage.set('phone', p);
    if (mId != null) await storage.set('member_id', mId);
    if (rt) await storage.set('refresh_token', rt);
    setToken(t);
    setPhone(p);
    if (mId != null) setMemberId(mId);
    if (rt) setRefreshToken(rt);

    // After setting auth tokens, register this device for push notifications
    await registerPushToken();
  };

  const signOut = async () => {
    // 🔴 REAL — best-effort server-side logout (invalidates the refresh token
    // server-side). Deliberately doesn't block or throw on failure: if the
    // network is down or the token's already expired, the user still needs
    // to be signed out locally — we never want a failed logout call to trap
    // someone on the app with a "stuck" session.
    if (token) {
      try {
        const { logoutApi } = await import('@/services/authapi/apiService');
        await logoutApi(token, refreshToken ?? undefined);
      } catch (e) {
        console.log('[AuthContext] logout API call failed (continuing with local sign-out)', e);
      }
    }

    // Clear auth credentials
    await storage.remove('token');
    await storage.remove('refresh_token');
    await storage.remove('phone');
    await storage.remove('member_id');

    // Clear this user's locally cached reports so the next user
    // (or the same user after re-login) starts with a clean slate
    // from the server — preventing data leakage between sessions.
    if (phone) {
      const aiKeys = AI_STORAGE_KEYS(phone);
      await AsyncStorage.multiRemove([
        reportStorageKey(phone),
        reportDetailsStorageKey(phone),
        medicineStorageKey(phone),
        reminderStorageKey(phone),
        aiKeys.AI_MEMORY,
        aiKeys.CONVERSATION,
        `${aiKeys.CONVERSATION}_session_id`,
      ]);
    }

    // Clear onboarding flag so a NEW signup on this device isn't
    // skipped because a PREVIOUS account already completed it.
    await AsyncStorage.removeItem('onboarding_done');

    setToken(null);
    setRefreshToken(null);
    setPhone(null);
    setMemberId(null);
  };

  useEffect(() => {
    if (Platform.OS === 'web') return; // No session management on web
    const sub = DeviceEventEmitter.addListener('SESSION_EXPIRED', async () => {
      await signOut();
      router.replace('/(auth)/onboarding');
    });
    return () => sub.remove();
  }, []);

  // 🔴 REAL — exchanges the stored refresh_token for a new access token.
  // Doesn't auto-sign-out on failure here; the caller (e.g. an API wrapper
  // that just saw a 401) decides what to do — usually that means calling
  // signOut() itself so the redirect-to-login logic in AuthContext.ready
  // stays the single source of truth for "are we logged in."
  const refreshSession = async (): Promise<string | null> => {
    if (!refreshToken) return null;
    try {
      const { refreshTokenApi } = await import('@/services/authapi/apiService');
      const data = await refreshTokenApi(refreshToken);
      if (data?.token) {
        await storage.set('token', data.token);
        setToken(data.token);
        return data.token;
      }
      return null;
    } catch (e) {
      console.log('[AuthContext] refreshSession failed', e);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ token, refreshToken, phone, memberId, signIn, signOut, refreshSession, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};