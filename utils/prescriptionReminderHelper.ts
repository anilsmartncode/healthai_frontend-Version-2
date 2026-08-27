/**
 * utils/prescriptionReminderHelper.ts
 *
 * Provides utilities to parse doctor prescription instructions and clinical
 * shorthand into structured reminder parameters (frequency, timings, when to take,
 * tablet quantity), and to batch-create reminders in one tap.
 */

import {
  createReminder,
  type ReminderFrequency,
  type WhenToTake,
  type Reminder,
} from '@/services/medicineTabApi';
import { NotificationCenter } from '@/services/NotificationService';
import { scheduleReminderNotification, parseTimeStringToNextDate } from '@/utils/notifications';
import type { ApiPrescriptionMedicine } from '@/types/Report/reportype';

export interface ParsedPrescriptionReminder {
  medicineName: string;
  dosage: string;
  frequency: ReminderFrequency;
  whenToTake: WhenToTake;
  times: string[];
  totalCount: number;
  durationDays: number;
  instructionsSummary: string;
}

/**
 * Parse an extracted prescription medicine into structured reminder properties.
 */
export function parsePrescriptionMedicineForReminder(
  med: ApiPrescriptionMedicine
): ParsedPrescriptionReminder {
  const name = (med.name || 'Medicine').trim();
  const dosage = [med.dosage, med.units].filter(Boolean).join(' ').trim();
  const combinedText = [
    med.frequency || '',
    med.instructions || '',
    med.usage_explanation || '',
    med.why_prescribed || '',
  ].join(' ').toLowerCase();

  // 1. Determine When to Take
  let whenToTake: WhenToTake = 'after_food';
  if (/before food|before meal|empty stomach|\bac\b|fasting|morning empty/i.test(combinedText)) {
    whenToTake = 'before_food';
  } else if (/bedtime|at bedtime|night only|before sleep|\bhs\b/i.test(combinedText)) {
    whenToTake = 'bedtime';
  } else if (/with food|with meal/i.test(combinedText)) {
    whenToTake = 'with_food';
  }

  // 2. Determine Frequency
  let frequency: ReminderFrequency = 'daily';
  if (/week|weekly|every week|once a week/i.test(combinedText)) {
    frequency = 'weekly';
  } else if (/month|monthly|every month/i.test(combinedText)) {
    frequency = 'monthly';
  }

  // 3. Determine Times of Day
  let times: string[] = ['08:00 AM'];
  const freqRaw = (med.frequency || '').toLowerCase();

  if (/1-1-1|thrice|3 times|three times|\btid\b|\btds\b/i.test(freqRaw) || /1-1-1|thrice/i.test(combinedText)) {
    times = ['08:00 AM', '02:00 PM', '08:00 PM'];
  } else if (/1-0-1|twice|2 times|two times|\bbid\b|\bbds\b/i.test(freqRaw) || /1-0-1|twice/i.test(combinedText)) {
    times = ['08:00 AM', '08:00 PM'];
  } else if (/0-0-1|night|bedtime|\bhs\b/i.test(freqRaw) || whenToTake === 'bedtime') {
    times = ['09:00 PM'];
  } else if (/0-1-0|afternoon|lunch/i.test(freqRaw)) {
    times = ['01:00 PM'];
  } else if (/1-0-0|morning|breakfast|\bod\b/i.test(freqRaw)) {
    times = ['08:00 AM'];
  }

  // 4. Determine Duration Days and Total Count
  let durationDays = 5; // sensible default
  const durRaw = (med.duration || '').toLowerCase();
  const dayMatch = durRaw.match(/(\d+)\s*(day|days|d\b)/i);
  const weekMatch = durRaw.match(/(\d+)\s*(week|weeks|wk|wks)/i);
  const monthMatch = durRaw.match(/(\d+)\s*(month|months|m\b)/i);

  if (dayMatch && dayMatch[1]) {
    durationDays = parseInt(dayMatch[1], 10) || 5;
  } else if (weekMatch && weekMatch[1]) {
    durationDays = (parseInt(weekMatch[1], 10) || 1) * 7;
  } else if (monthMatch && monthMatch[1]) {
    durationDays = (parseInt(monthMatch[1], 10) || 1) * 30;
  }

  const dosesPerDay = times.length;
  const totalCount = Math.max(dosesPerDay * durationDays, 5);

  const instructionsSummary = [
    med.frequency,
    med.duration ? `for ${med.duration}` : '',
    med.instructions,
  ].filter(Boolean).join(' • ');

  return {
    medicineName: name,
    dosage,
    frequency,
    whenToTake,
    times,
    totalCount,
    durationDays,
    instructionsSummary,
  };
}

/**
 * Batch create reminders for a list of prescription medicines.
 * Each medicine can have 1 or more doses scheduled.
 */
export async function batchCreatePrescriptionReminders(
  medicines: ApiPrescriptionMedicine[]
): Promise<{ successCount: number; errorCount: number }> {
  let successCount = 0;
  let errorCount = 0;

  const defaultExpiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  for (const med of medicines) {
    try {
      const parsed = parsePrescriptionMedicineForReminder(med);

      // Create reminder for the primary time (or each time if multiple)
      for (let i = 0; i < parsed.times.length; i++) {
        const slotTime = parsed.times[i];
        const medId = `rx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const res = await createReminder({
          medicineId: medId,
          medicineName: parsed.medicineName,
          medicineType: med.units || 'Tablet',
          dosage: parsed.dosage,
          time: slotTime,
          frequency: parsed.frequency,
          totalCount: parsed.totalCount,
          refillThreshold: Math.max(Math.floor(parsed.totalCount * 0.2), 2),
          expiresInDays: 180,
          expiryDate: defaultExpiry,
          whenToTake: parsed.whenToTake,
        });

        if (res.success) {
          successCount++;
          // Trigger local push notification
          try {
            const triggerTime = parseTimeStringToNextDate(slotTime);
            await scheduleReminderNotification(
              res.reminderId,
              'Medicine Time!',
              `Time to take your ${parsed.medicineName}${parsed.dosage ? ' (' + parsed.dosage + ')' : ''}`,
              triggerTime,
              parsed.frequency === 'daily' || parsed.frequency === 'weekly' ? parsed.frequency : 'once'
            );
          } catch (notifErr) {
            console.warn('[PrescriptionReminder] Notification schedule warning:', notifErr);
          }

          // Publish notification to center
          try {
            NotificationCenter.publish({
              id: `rx_rem_${res.reminderId}_${Date.now()}`,
              category: 'medicine',
              priority: 'MEDIUM',
              status: 'unread',
              title: 'Prescription Reminder Set',
              message: `Reminder active for ${parsed.medicineName} at ${slotTime}`,
              timestamp: new Date().toISOString(),
              action: { type: 'navigate', route: '/medicines/reminders' },
            });
          } catch {}
        } else {
          errorCount++;
        }
      }
    } catch (err) {
      console.error('[PrescriptionReminder] Failed to create reminder for', med.name, err);
      errorCount++;
    }
  }

  return { successCount, errorCount };
}

/**
 * Check whether a medicine name matches any existing active reminders.
 */
export function isMedicineReminderActive(
  medName: string,
  existingReminders: Reminder[]
): { active: boolean; times: string[] } {
  if (!medName || !existingReminders || existingReminders.length === 0) {
    return { active: false, times: [] };
  }

  const cleanTarget = medName.trim().toLowerCase();
  const matching = existingReminders.filter((r) => {
    const rName = (r.medicineName || '').trim().toLowerCase();
    return rName === cleanTarget || cleanTarget.includes(rName) || rName.includes(cleanTarget);
  });

  if (matching.length > 0) {
    const times = Array.from(new Set(matching.map((r) => r.time).filter(Boolean)));
    return { active: true, times };
  }

  return { active: false, times: [] };
}
