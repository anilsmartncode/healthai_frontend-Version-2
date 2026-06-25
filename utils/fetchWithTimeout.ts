/**
 * utils/fetchWithTimeout.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Why this exists:
 *   Every shared API caller in this app (medicineApiCall, reportsApiCall,
 *   familyApi, profileSubScreenApi, aiService, auth, etc.) calls plain
 *   fetch() with no AbortController. A normal device only allows a handful
 *   of concurrent connections to the same host (~4-6 on RN/iOS/Android).
 *   If ONE request hangs (slow backend, dropped connection, no response),
 *   it holds a connection slot indefinitely. Every other call to the same
 *   host — a different screen, a different tab, anything — queues behind
 *   it and APPEARS frozen, even though nothing in app state is actually
 *   locked. This is what was happening with /api/analyze-report: a single
 *   slow analyze call could starve Medicines/Family/Profile calls for as
 *   long as it stayed open.
 *
 *   apiFileCall() in reportsApi.ts already solved this for the one
 *   analyze-report endpoint (150s ceiling, since OCR+AI genuinely takes
 *   that long). This helper brings the same protection to every OTHER
 *   call, with a much shorter default timeout — list/detail/delete/etc.
 *   should never legitimately take more than a few seconds.
 *
 * Usage:
 *   const response = await fetchWithTimeout(url, { method: 'GET', headers });
 *   // same Response object you'd get from fetch() — drop-in replacement
 */

export class FetchTimeoutError extends Error {
  constructor(ms: number, url: string) {
    super(`Request timed out after ${ms / 1000}s: ${url}`);
    this.name = 'FetchTimeoutError';
  }
}

const DEFAULT_TIMEOUT_MS = 60000; // 20s — generous for JSON list/detail/delete calls

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  // Respect a caller-supplied signal too (rare, but don't clobber it) —
  // if the caller already passed one, we just layer our own abort on top.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new FetchTimeoutError(timeoutMs, url);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}