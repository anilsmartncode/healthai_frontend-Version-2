/**
 * services/medicineApiClient.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared real-API client for every Medicine-tab service (Browse, Reminders,
 * Scanner, Interaction Checker, My Medicines). Both Medicinesapi.ts and
 * medicineTabApi.ts call into this so there's a single place that:
 *   • attaches the auth token (Bearer) from storage
 *   • logs every request/response with status code + body (mirrors apiService.ts)
 *   • transparently decrypts { iv, data } responses if the backend encrypts them
 *   • throws a readable error on non-OK / non-JSON responses
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { storage } from '@/utils/storage';
import { decryptResponse } from '@/utils/encryption';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';
import { DeviceEventEmitter } from 'react-native';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface MedicineApiCallOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Set true for multipart/form-data uploads (e.g. scanner image upload) */
  isFormData?: boolean;
}

/**
 * Thrown by medicineApiCall on any non-OK response. Carries the HTTP status
 * and the exact URL that was hit, so when you're testing endpoints you can
 * immediately tell "route doesn't exist" (404) apart from auth errors
 * (401/403), validation errors (422), or server bugs (5xx).
 */
export class MedicineApiError extends Error {
  status: number;
  url: string;
  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'MedicineApiError';
    this.status = status;
    this.url = url;
  }
}

export async function medicineApiCall<T = any>(
  url: string,
  options: MedicineApiCallOptions = {},
): Promise<T> {
  const { method = 'GET', body, isFormData = false } = options;

  const token = await storage.get<string>('token');

  console.log('=== [Medicines] REQUEST ===');
  console.log('METHOD:', method);
  console.log('URL:', url);
  if (body !== undefined) {
    console.log('PAYLOAD:', isFormData ? '[FormData]' : JSON.stringify(body, null, 2));
  }
  console.log('============================');

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const startMs = Date.now();
  let response: Response;
  try {
    // For FormData (multipart) uploads we MUST use raw fetch — fetchWithTimeout
    // can serialise the RequestInit in a way that drops the FormData boundary,
    // causing the server to receive an empty body and return 422.
    if (isFormData) {
      console.log('[Medicines] using raw fetch for FormData upload');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);
      try {
        response = await fetch(url, {
          method,
          headers,          // no Content-Type — browser/RN sets it + boundary
          body: body as FormData,
          // signal: controller.signal, // 🐛 React Native instantly aborts file:// FormData uploads if a signal is passed
        });
      } finally {
        clearTimeout(timer);
      }
    } else {
      // 20s ceiling — prevents one slow/hung Medicines request from holding a
      // connection slot and starving every other call to the same host (this
      // is what made Reports/Family/Profile screens look "frozen" whenever an
      // analyze-report or other slow call was still in flight).
      response = await fetchWithTimeout(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }
  } catch (networkErr: any) {
    console.log('=== [Medicines] NETWORK ERROR ===');
    console.log(networkErr?.message || networkErr);
    console.log('==================================');
    throw new Error(networkErr?.message || 'Network request failed');
  }

  const rawText = await response.text();
  const durationMs = Date.now() - startMs;

  console.log('=== [Medicines] RAW RESPONSE ===');
  console.log(`STATUS: ${response.status} [${durationMs}ms]`);
  console.log('BODY:', rawText);
  console.log('=================================');

  let rawData: any;
  try {
    rawData = rawText ? JSON.parse(rawText) : {};
  } catch {
    const snippet = rawText?.slice(0, 200) || '(empty response)';
    throw new Error(`Server returned non-JSON response (status ${response.status}): ${snippet}`);
  }

  // Session expired
  if (response.status === 401) {
    await storage.remove('token');
    await storage.remove('refresh_token');
    await storage.remove('phone');
    await storage.remove('member_id');
    DeviceEventEmitter.emit('SESSION_EXPIRED');
    throw new Error('SESSION_EXPIRED');
  }

  // Backend may respond with encrypted { iv, data } — decrypt it, same as auth
  if (rawData?.iv && rawData?.data) {
    const decrypted = decryptResponse(rawData);
    console.log('=== [Medicines] DECRYPTED ===');
    console.log(JSON.stringify(decrypted, null, 2));
    console.log('==============================');

    if (!response.ok) {
      const errDetail = decrypted?.message || decrypted?.detail || 'Request failed';
      throw new MedicineApiError(
        typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail),
        response.status,
        url,
      );
    }
    return decrypted as T;
  }

  if (!response.ok) {
    const errDetail = rawData?.message || rawData?.detail || 'Request failed';
    throw new MedicineApiError(
      typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail),
      response.status,
      url,
    );
  }

  return rawData as T;
}