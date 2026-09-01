/**
 * services/consentApi.ts
 *
 * Manages patient privacy consent toggles.
 * Uses Dual/Hybrid architecture: Instant local persistence with background API sync.
 */

import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { medicineApiCall } from './Medicineapiclient';
import { BASE_URL } from '@/constants/api';

export interface UserConsents {
  process_health_data?: boolean; // Base health data processing
  ai_analysis: boolean;          // AI processing of lab reports
  share_family: boolean;         // Visibility in Family Care Hub
  share_doctors: boolean;        // Sharing summary with confirmed doctors
  anonymized_research: boolean;  // Opt-in clinical research
  marketing_tips?: boolean;      // Marketing & product tips
}

const DEFAULT_CONSENTS: UserConsents = {
  process_health_data: true,
  ai_analysis: true,
  share_family: true,
  share_doctors: true,
  anonymized_research: false,
  marketing_tips: false,
};

const STORAGE_KEY = '@healthai_user_consents';

/**
 * Load current consents (Local cache first, background sync with backend)
 */
export async function getConsents(): Promise<UserConsents> {
  let localConsents: UserConsents = { ...DEFAULT_CONSENTS };

  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      localConsents = { ...DEFAULT_CONSENTS, ...JSON.parse(cached) };
    }
  } catch { /* ignore */ }

  // Background fetch candidate endpoints
  const candidateUrls = [
    `${BASE_URL}/api/api/user/consents`,
    `${BASE_URL}/api/user/consents`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await medicineApiCall<any>(url);
      const data = res?.data ?? res?.consents ?? res;
      if (data && typeof data === 'object') {
        const merged: UserConsents = {
          process_health_data: data.process_health_data ?? localConsents.process_health_data ?? true,
          ai_analysis: data.ai_analysis ?? localConsents.ai_analysis,
          share_family: data.share_family ?? localConsents.share_family,
          share_doctors: data.share_doctors ?? localConsents.share_doctors,
          anonymized_research: data.anonymized_research ?? localConsents.anonymized_research,
          marketing_tips: data.marketing_tips ?? localConsents.marketing_tips ?? false,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch {
      // Backend not ready yet, continue with local cache
    }
  }

  return localConsents;
}

/**
 * Update consent preferences (Instant local write + background backend sync)
 */
export async function updateConsents(updates: Partial<UserConsents>): Promise<UserConsents> {
  const current = await getConsents();
  const next: UserConsents = { ...current, ...updates };

  // 1. Instant local write
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('[ConsentApi] Local storage error:', e);
  }

  // 2. Background sync with backend
  const candidateUrls = [
    `${BASE_URL}/api/api/user/consents`,
    `${BASE_URL}/api/user/consents`,
  ];

  for (const url of candidateUrls) {
    try {
      await medicineApiCall(url, {
        method: 'POST',
        body: next,
      });
      break;
    } catch {
      // Backend not ready, local storage already succeeded
    }
  }

  return next;
}
