// ─── API Base URL ─────────────────────────────────────────────────────────────
// Priority: EXPO_PUBLIC_API_URL env var (set in .env) → shared backend domain.
// 🟢 MOCK mode (USE_MOCK = true in each service) ignores this entirely.
//
// FIX: this used to hardcode its own separate BASE_URL ('http://122.175.45.53:8060'
// — an old dev-server IP), while every other service (reportsApi, Medicineapiclient,
// authapi) used 'https://healthai.smartncode.com' from constants/api.ts. That split
// sent app/account.tsx's profile calls to a different server than the rest of the
// app. Only one backend should ever be used — re-export the same BASE_URL from
// constants/api.ts so there's a single source of truth and this can't drift again.

import { BASE_URL } from '@/constants/api';

export { BASE_URL };

export const Config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? BASE_URL,
};
