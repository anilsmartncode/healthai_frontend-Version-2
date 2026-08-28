import { Config } from '@/config/env';
import { storage } from '@/utils/storage';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';
import { decryptResponse } from '@/utils/encryption';
import { DeviceEventEmitter } from 'react-native';
import { currentAppLangCode } from '@/context/Languagecontext';
import { currentAppCountryCode } from '@/context/CountryContext';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await storage.get<string>('token');

  const url = `${Config.apiBaseUrl}${path}`;
  console.log('[api] REQUEST', init?.method ?? 'GET', url);
  const startMs = Date.now();
  
  const headers: Record<string, string> = {
    'Accept-Language': currentAppLangCode,
    'X-User-Country': currentAppCountryCode,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers ?? {}) as Record<string, string>),
  };

  // Only force application/json if we are NOT sending FormData
  if (!(init?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetchWithTimeout(url, {
    ...init,
    headers,
  });

  const rawText = await res.text();
  const durationMs = Date.now() - startMs;
  console.log(`[api] RESPONSE ${res.status} [${durationMs}ms]`, url);
  let rawData: any;
  try {
    rawData = rawText ? JSON.parse(rawText) : {};
  } catch {
    const snippet = rawText?.slice(0, 200) || '(empty response)';
    throw new Error(`Server returned non-JSON response (status ${res.status}): ${snippet}`);
  }

  // Session expired — sign out and redirect to login
  if (res.status === 401) {
    await storage.remove('token');
    await storage.remove('refresh_token');
    await storage.remove('phone');
    await storage.remove('member_id');
    DeviceEventEmitter.emit('SESSION_EXPIRED');
    throw new Error('SESSION_EXPIRED');
  }

  // Backend encrypts all responses as { iv, data } — decrypt before returning.
  // Without this, callers receive the raw envelope and every field is undefined.
  if (rawData?.iv && rawData?.data && typeof rawData.data === 'string') {
    const decrypted: any = decryptResponse(rawData);
    if (!res.ok) throw new Error(decrypted?.message || decrypted?.detail || `Request failed: ${res.status}`);
    return decrypted as T;
  }

  // Surface the backend's actual message instead of a generic status code,
  // so screens like account.tsx can show the real reason a save failed.
  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status}`;
    if (rawData?.message) {
      errorMsg = typeof rawData.message === 'string' ? rawData.message : JSON.stringify(rawData.message);
    } else if (rawData?.detail) {
      errorMsg = typeof rawData.detail === 'string' ? rawData.detail : JSON.stringify(rawData.detail);
    }
    console.warn(`[api] ERROR ${res.status} BODY:`, JSON.stringify(rawData));
    throw new Error(errorMsg);
  }

  return rawData as T;
}

export const api = { request };