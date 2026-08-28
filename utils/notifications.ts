import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';
import { medicineApiCall } from '@/services/Medicineapiclient';
import { ENDPOINTS } from '@/constants/api';
import { getTodaysReminders } from '@/services/medicineTabApi';
import type { Reminder } from '@/types';

// Determine if we are running inside the Expo Go app.
// expo-notifications native code was removed from Expo Go in SDK 53+
const isExpoGo = Constants.appOwnership === 'expo';

// Configure how notifications behave when the app is in the foreground
if (!isExpoGo && Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ── Background Task Definition ────────────────────────────────────────────────
export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

// FCM Background Handler (Must be registered early)
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    import('@react-native-firebase/messaging').then((messagingModule) => {
      const messaging = messagingModule.default;
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('[FCM] Message handled in the background!', remoteMessage);
      });
    }).catch(e => console.warn('[FCM] Failed to dynamically load messaging for background', e));
  } catch (e) {
    console.warn('[FCM] Failed to register background handler', e);
  }
}

export function defineBackgroundNotificationTask() {
  if (isExpoGo) return;

  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('[Notifications] Background task error:', error);
      return;
    }

    if (data) {
      const { actionIdentifier, notification } = data as any;
      const reminderId = notification?.request?.content?.data?.reminderId || 'unknown';

      console.log(`[Notifications] Background action received! ID: ${actionIdentifier}, Reminder: ${reminderId}`);

      if (actionIdentifier === 'snooze') {
        // Schedule a one-off 10-minute snooze alarm
        const snoozeDate = new Date(Date.now() + 10 * 60 * 1000);
        await scheduleReminderNotification(
          `${reminderId}-snooze`,
          `Snoozed: ${notification?.request?.content?.title || 'Medicine'}`,
          notification?.request?.content?.body || 'Time to take your medicine',
          snoozeDate,
          'once'
        );
        // Dismiss the currently ringing notification to stop the sound
        if (notification?.request?.identifier) {
          await Notifications.dismissNotificationAsync(notification.request.identifier);
        }
      } else if (actionIdentifier === 'take') {
        // Mark as taken (will hook into backend later)
        console.log(`[Notifications] Medicine ${reminderId} marked as taken in background.`);

        // Notify the backend
        if (reminderId && reminderId !== 'unknown') {
          try {
            await medicineApiCall(ENDPOINTS.reminderTaken(reminderId), { method: 'POST' });
          } catch (apiErr) {
            console.warn('[Notifications] Background API call failed:', apiErr);
          }
        }

        // Just clear the snooze alarm if it exists
        await cancelReminderNotification(`${reminderId}-snooze`);

        // Dismiss the currently ringing notification to stop the sound
        if (notification?.request?.identifier) {
          await Notifications.dismissNotificationAsync(notification.request.identifier);
        }
      }
    }
  });
}

/**
 * Request user permission for notifications
 */
export async function requestNotificationPermissions() {
  if (isExpoGo) {
    console.warn('[Notifications] Running in Expo Go. Notifications are disabled.');
    return false;
  }

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('reminders-v3', {
        name: 'Medicine Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 500, 500],
        lightColor: '#0066FF',
        sound: 'alarm.wav',
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
        },
      });
    } catch (e) {
      console.warn('[Notifications] Could not set Android channel', e);
    }
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Also request FCM permissions
    if (!isExpoGo) {
      const messagingModule = await import('@react-native-firebase/messaging');
      const messaging = messagingModule.default;
      await messaging().requestPermission();
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('[Notifications] Error requesting permissions', e);
    return false;
  }
}

/**
 * Get the FCM Push Token for this device
 */
export async function getFCMToken(): Promise<string | null> {
  if (isExpoGo) return null;
  try {
    const messagingModule = await import('@react-native-firebase/messaging');
    const messaging = messagingModule.default;
    const token = await messaging().getToken();
    console.log('[FCM] Device Token:', token);
    return token;
  } catch (e) {
    console.warn('[FCM] Failed to get push token:', e);
    return null;
  }
}

/**
 * Set up interactive notification categories (e.g., Take / Snooze buttons)
 */
export async function setupNotificationCategories() {
  if (isExpoGo) return;

  try {
    await Notifications.setNotificationCategoryAsync('reminder-actions', [
      {
        identifier: 'take',
        buttonTitle: 'Mark as Taken',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze (10 mins)',
        options: { opensAppToForeground: false },
      },
    ]);
  } catch (e) {
    console.warn('[Notifications] Error setting categories', e);
  }
}

/**
 * Schedule a local notification for a medicine reminder.
 * 
 * @param id The reminder ID to use as the notification identifier (for easy cancellation later)
 * @param title The notification title (e.g. "Time to take your Metformin")
 * @param body The notification body (e.g. "Dosage: 500mg, After Food")
 * @param triggerTime The specific Date object for when this should trigger
 * @param frequency 'once', 'daily', or 'weekly'
 */
export async function scheduleReminderNotification(
  id: string,
  title: string,
  body: string,
  triggerTime: Date,
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  if (isExpoGo) {
    console.warn('[Notifications] Skipped — running in Expo Go');
    return null;
  }

  try {
    // First cancel any existing notification with this ID just in case
    await cancelReminderNotification(id);

    let trigger: Notifications.NotificationTriggerInput;

    if (frequency === 'daily') {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: triggerTime.getHours(),
        minute: triggerTime.getMinutes(),
      };
    } else if (frequency === 'weekly') {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: triggerTime.getDay() + 1, // Expo: 1=Sunday, 7=Saturday
        hour: triggerTime.getHours(),
        minute: triggerTime.getMinutes(),
      };
    } else if (frequency === 'monthly') {
      // Expo SDK 53 has no MONTHLY trigger type.
      // Use a YEARLY trigger with the specific month/day as a workaround,
      // but more practically, schedule as a one-off DATE for next month
      // and rely on the app to re-schedule when opened.
      const nextTrigger = new Date(triggerTime);
      if (nextTrigger.getTime() <= Date.now()) {
        nextTrigger.setMonth(nextTrigger.getMonth() + 1);
      }
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextTrigger,
      };
    } else {
      // One-off — must be in the future
      if (triggerTime.getTime() <= Date.now()) {
        console.warn('[Notifications] Cannot schedule notification in the past');
        return null;
      }
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerTime,
      };
    }

    console.log(`[Notifications] Scheduling alarm "${title}" | freq=${frequency} | trigger:`, JSON.stringify(trigger));

    const notifId = await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title,
        body,
        sound: 'alarm.wav',
        categoryIdentifier: 'reminder-actions',
        data: { reminderId: id },
      },
      trigger: {
        ...(trigger as any),
        channelId: 'reminders-v3',
      },
    });

    console.log(`[Notifications] ✅ Alarm scheduled! ID: ${notifId}`);

    // Debug: List all scheduled notifications
    const all = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`[Notifications] Total scheduled alarms: ${all.length}`);

    return notifId;
  } catch (e: any) {
    console.error('[Notifications] Error scheduling alarm:', e);
    throw new Error(e.message || 'The operating system blocked the alarm. Please check app permissions in settings.');
  }
}

/**
 * Cancel a specific notification by its identifier
 * @param id The reminder ID used when scheduling
 */
export async function cancelReminderNotification(id: string | number) {
  if (isExpoGo) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(String(id));
  } catch (e) {
    console.warn('[Notifications] Error cancelling notification', e);
  }
}

/**
 * Helper: Parse "HH:MM AM/PM" into a Date object for the next occurrence.
 * If the time has already passed today, it schedules for tomorrow.
 */
export function parseTimeStringToNextDate(timeStr: string): Date {
  const match = timeStr.match(/(\d+):(\d+)\s+(AM|PM)/i);
  if (!match) return new Date(Date.now() + 60000); // fallback to 1 min from now

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (trigger.getTime() <= now.getTime()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  return trigger;
}

/**
 * Fire a test notification in 5 seconds — used to verify the alarm system works.
 * Call this from any screen to quickly test.
 */
export async function testNotification() {
  if (isExpoGo) {
    console.warn('[Notifications] Cannot test in Expo Go');
    return;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Alarm!',
        body: 'If you see this, notifications are working!',
        sound: 'alarm.wav',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: 'reminders-v3',
      },
    });
    console.log('[Notifications] ✅ Test notification scheduled in 5 seconds, ID:', id);
  } catch (e) {
    console.error('[Notifications] ❌ Test notification FAILED:', e);
  }
}

/**
 * Sync Local Reminders with Backend
 * Cancels all locally scheduled notifications and re-schedules active ones 
 * to clean up any "ghost" reminders from deleted medicines or multiple devices.
 */
export async function syncLocalRemindersWithBackend() {
  if (isExpoGo) return;
  
  try {
    // 1. Fetch active reminders from backend
    const activeReminders = await getTodaysReminders();
    
    // 2. Wipe the slate clean locally
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Wiped all ghost notifications');
    
    // 3. Re-schedule only the active ones
    for (const r of activeReminders) {
      if (r.enabled !== false) {
        const nextDate = parseTimeStringToNextDate(r.time);
        await scheduleReminderNotification(
          r.id,
          `Medicine Time: ${r.medicineName}`,
          r.whenToTake ? r.whenToTake.replace(/_/g, ' ') : 'Now',
          nextDate,
          (r.frequency as any)
        ).catch(console.warn);
      }
    }
    console.log(`[Notifications] Synced ${activeReminders.length} active reminders`);
  } catch (e) {
    console.warn('[Notifications] Sync failed:', e);
  }
}
