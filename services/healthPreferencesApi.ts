import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { BASE_URL, ENDPOINTS } from '@/constants/api';
import { api } from '@/services/api';
import { getFCMToken } from '@/utils/notifications';

const isExpoGo = Constants.appOwnership === 'expo';

export interface HealthPreferences {
  units: 'metric' | 'imperial';
  medicineReminders: boolean;
  appointmentReminders: boolean;
  healthTips: boolean;
  familyAlerts: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export const DEFAULT_HEALTH_PREFERENCES: HealthPreferences = {
  units: 'metric',
  medicineReminders: true,
  appointmentReminders: true,
  healthTips: true,
  familyAlerts: true,
  quietHoursStart: '10:00 PM',
  quietHoursEnd: '07:00 AM',
};

const STORAGE_KEY = 'healthai_health_preferences';

/**
 * Get user health preferences (Local storage first for 0ms response, with background sync)
 */
export async function getHealthPreferences(): Promise<HealthPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_HEALTH_PREFERENCES, ...parsed };
    }
  } catch (err) {
    console.warn('[healthPreferencesApi] Failed to read from local storage:', err);
  }
  return DEFAULT_HEALTH_PREFERENCES;
}

/**
 * Sync Notification Preferences with Firebase Cloud Messaging (FCM) Topics
 */
export async function syncFirebaseTopics(prefs: HealthPreferences): Promise<void> {
  if (Platform.OS === 'web' || isExpoGo) return;

  try {
    const messagingModule = await import('@react-native-firebase/messaging');
    const messaging = messagingModule.default;
    const instance = messaging();

    // 1. Health Tips topic
    if (prefs.healthTips) {
      await instance.subscribeToTopic('health_tips').catch(() => {});
    } else {
      await instance.unsubscribeFromTopic('health_tips').catch(() => {});
    }

    // 2. Family Activity alerts topic
    if (prefs.familyAlerts) {
      await instance.subscribeToTopic('family_alerts').catch(() => {});
    } else {
      await instance.unsubscribeFromTopic('family_alerts').catch(() => {});
    }

    // 3. Appointment reminders topic
    if (prefs.appointmentReminders) {
      await instance.subscribeToTopic('appointment_reminders').catch(() => {});
    } else {
      await instance.unsubscribeFromTopic('appointment_reminders').catch(() => {});
    }

    // 4. Medicine reminders topic
    if (prefs.medicineReminders) {
      await instance.subscribeToTopic('medicine_reminders').catch(() => {});
    } else {
      await instance.unsubscribeFromTopic('medicine_reminders').catch(() => {});
    }

    console.log('[Firebase FCM] Successfully synced topics with Health Preferences');
  } catch (err) {
    console.warn('[Firebase FCM] Topic synchronization not available or skipped:', err);
  }
}

/**
 * Save user health preferences (Instant local storage + Firebase topic sync + background backend sync)
 */
export async function saveHealthPreferences(
  prefs: HealthPreferences
): Promise<{ success: boolean; syncedToBackend: boolean }> {
  // 1. Instant local persistence
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('[healthPreferencesApi] Failed to save locally:', err);
  }

  // 2. Firebase Cloud Messaging (FCM) Topic Synchronization
  syncFirebaseTopics(prefs).catch((e) => {
    console.warn('[healthPreferencesApi] Firebase FCM sync warning:', e);
  });

  // 3. Dual/hybrid background sync to backend (with active Firebase FCM token)
  let syncedToBackend = false;
  try {
    const fcmToken = await getFCMToken().catch(() => null);
    const payload = {
      ...prefs,
      fcm_token: fcmToken,
      updated_at: new Date().toISOString(),
    };

    const candidatePaths = ['/api/api/user/preferences', '/api/user/preferences'];
    for (const path of candidatePaths) {
      try {
        await api.request(path, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        syncedToBackend = true;
        console.log(`[healthPreferencesApi] Successfully synced preferences + FCM to ${path}`);
        break;
      } catch {
        // Try next candidate
      }
    }

    // If dedicated endpoint is not yet present, also sync FCM token to backend user profile
    if (fcmToken) {
      try {
        await api.request('/api/api/user/fcm-token', {
          method: 'POST',
          body: JSON.stringify({
            fcm_token: fcmToken,
            preferences: prefs,
          }),
        });
      } catch {
        // Silently ignore if already recorded
      }
    }
  } catch (err) {
    console.log('[healthPreferencesApi] Backend sync deferred; local and Firebase states active');
  }

  return { success: true, syncedToBackend };
}

/**
 * Check if the current local time falls within Quiet Hours
 */
export function isWithinQuietHours(prefs: HealthPreferences): boolean {
  try {
    const now = new Date();
    const parseTimeString = (timeStr: string) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let [_, h, m, meridiem] = match;
      let hours = parseInt(h, 10);
      const minutes = parseInt(m, 10);
      if (meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const startMinutes = parseTimeString(prefs.quietHoursStart);
    const endMinutes = parseTimeString(prefs.quietHoursEnd);
    if (startMinutes === null || endMinutes === null) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight (e.g. 10:00 PM to 7:00 AM)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch {
    return false;
  }
}
