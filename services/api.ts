import { Config } from '@/config/env';
import { storage } from '@/utils/storage';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';
import { decryptResponse } from '@/utils/encryption';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await storage.get<string>('token');

  const url = `${Config.apiBaseUrl}${path}`;
  console.log('[api] REQUEST', init?.method ?? 'GET', url);
  const res = await fetchWithTimeout(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const rawText = await res.text();
  console.log('[api] RESPONSE', res.status, url);
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
  if (!res.ok) throw new Error(rawData?.message || rawData?.detail || `Request failed: ${res.status}`);

  return rawData as T;
}

export const api = { request };