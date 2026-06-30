import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determine if we are running inside the Expo Go app.
// expo-notifications native code was removed from Expo Go in SDK 53+
const isExpoGo = Constants.appOwnership === 'expo';

// Configure how notifications behave when the app is in the foreground
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
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
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Medicine Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0066FF',
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

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('[Notifications] Error requesting permissions', e);
    return false;
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
 */
export async function scheduleReminderNotification(id: string, title: string, body: string, triggerTime: Date) {
  if (isExpoGo) return null;

  try {
    // First cancel any existing notification with this ID just in case
    await cancelReminderNotification(id);

    // Make sure triggerTime is in the future
    if (triggerTime.getTime() <= Date.now()) {
      console.warn('[Notifications] Cannot schedule notification in the past');
      return null;
    }

    return await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title,
        body,
        sound: true,
        categoryIdentifier: 'reminder-actions',
        data: { reminderId: id }, // Pass the ID in data so the listener can read it
      },
      trigger: {
        date: triggerTime,
      },
    });
  } catch (e) {
    console.warn('[Notifications] Error scheduling notification', e);
    return null;
  }
}

/**
 * Cancel a specific notification by its identifier
 * @param id The reminder ID used when scheduling
 */
export async function cancelReminderNotification(id: string) {
  if (isExpoGo) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(id);
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
