/**
 * medicineTabApi.ts
 * ─────────────────────────────────────────────────────────────
 * All API contracts for the Medicine tab (Browse, Reminder,
 * Scanner, Interaction Checker).
 *
 * ⚠️  MOCK ONLY – replace each function body with a real fetch()
 *     call once the backend is ready.  The endpoint, method,
 *     params & response shapes are documented as comments so the
 *     integration is a straight drop-in.
 * ─────────────────────────────────────────────────────────────
 */

import { MOCK_CATEGORIES, MOCK_MEDICINES, MOCK_REMINDERS, MOCK_SCAN_HISTORY, MOCK_INTERACTIONS } from './medicineMockData';

// ─── Shared delay helper (simulates network) ─────────────────
const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type SeverityLevel = 'none' | 'low' | 'moderate' | 'high';
export type PrescriptionType = 'OTC' | 'Prescription' | 'High Risk';
export type ReminderFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type WhenToTake = 'before_food' | 'after_food' | 'with_food' | 'bedtime';
export type ReminderStatus = 'upcoming' | 'taken' | 'missed' | 'cancelled';

export interface Category {
  id: string;
  name: string;
  icon: string; // icon name for Ionicons
  color: string;
}

export interface Medicine {
  id: string;
  name: string;
  type: string; // e.g. "Tablet", "Syrup"
  category: string;
  uses: string;
  dosage: string;
  sideEffects: string[];
  prescriptionType: PrescriptionType;
  isSaved?: boolean;
  imageUrl?: string;
}

export interface Reminder {
  id: string;
  medicineId: string;
  medicineName: string;
  medicineType: string;
  time: string; // "08:00 AM"
  frequency: ReminderFrequency;
  whenToTake: WhenToTake;
  status: ReminderStatus;
  createdAt: string;
}

export interface ScanResult {
  scanId: string;
  medicineFound: boolean;
  medicineId?: string;
  medicineName?: string;
  confidence?: number; // 0–100
  status: 'processing' | 'done' | 'failed';
}

export interface ScanHistoryItem {
  scanId: string;
  medicineName: string;
  medicineType: string;
  scannedAt: string;
  imageUrl?: string;
}

export interface InteractionResult {
  interactionId: string;
  medicines: { id: string; name: string; type: string }[];
  severity: SeverityLevel;
  summary: string;
  recommendation: string;
  symptoms: string[];
  checkedAt: string;
}

export interface InteractionHistoryItem {
  interactionId: string;
  medicines: string[]; // names
  severity: SeverityLevel;
  checkedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// BROWSE MEDICINES APIS
// ═══════════════════════════════════════════════════════════════

/**
 * API 1 – Get Categories
 * GET /api/medicines/categories
 * Expected time: ~0.3 – 0.6 s
 */
export async function getCategories(): Promise<Category[]> {
  await delay(400);
  return MOCK_CATEGORIES;
}

/**
 * API 2 – Search Medicines
 * GET /api/medicines/search?q={query}&page=1&limit=20
 * Expected time: ~0.4 – 0.8 s
 */
export async function searchMedicines(query: string, page = 1, limit = 20): Promise<Medicine[]> {
  await delay(500);
  const q = query.toLowerCase();
  return MOCK_MEDICINES.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
  ).slice((page - 1) * limit, page * limit);
}

/**
 * API 3 – Get Medicines by Category
 * GET /api/medicines?category_id={id}&page=1&limit=20
 * Expected time: ~0.5 – 1.0 s
 */
export async function getMedicinesByCategory(categoryId: string, page = 1, limit = 20): Promise<Medicine[]> {
  await delay(600);
  return MOCK_MEDICINES.filter((m) => m.category.toLowerCase() === categoryId.toLowerCase())
    .slice((page - 1) * limit, page * limit);
}

/**
 * API 4 – Get Medicine Details
 * GET /api/medicines/{medicine_id}
 * Expected time: ~0.6 – 1.2 s
 */
export async function getMedicineDetails(medicineId: string): Promise<Medicine | null> {
  await delay(700);
  return MOCK_MEDICINES.find((m) => m.id === medicineId) ?? null;
}

/**
 * API 5 – Save Medicine (to My Medicines)
 * POST /api/user/medicines  { medicine_id }
 * Expected time: ~0.3 – 0.6 s
 */
export async function saveMedicine(medicineId: string): Promise<{ success: boolean; message: string }> {
  await delay(400);
  return { success: true, message: 'Saved' };
}

/**
 * API 6 – Get Recently Viewed
 * GET /api/medicines/recent?page=1&limit=10
 * Expected time: ~0.3 – 0.6 s
 */
export async function getRecentlyViewed(page = 1, limit = 10): Promise<Medicine[]> {
  await delay(400);
  return MOCK_MEDICINES.slice(0, limit);
}

/**
 * API 7 – Get Popular Medicines (Optional)
 * GET /api/medicines/popular?limit=10
 * Expected time: ~0.3 – 0.6 s
 */
export async function getPopularMedicines(limit = 10): Promise<Medicine[]> {
  await delay(400);
  return MOCK_MEDICINES.slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════
// MEDICINE REMINDER APIS
// ═══════════════════════════════════════════════════════════════

/**
 * API 1 – Get User Medicines (saved list)
 * GET /api/user/medicines
 * Expected time: ~0.5 – 1.0 s
 */
export async function getUserMedicines(): Promise<Medicine[]> {
  await delay(600);
  return MOCK_MEDICINES.slice(0, 5);
}

/**
 * API 2 – Create Reminder
 * POST /api/reminders  { medicine_id, time, frequency, when_to_take }
 * Expected time: ~0.8 – 1.2 s
 */
export async function createReminder(payload: {
  medicineId: string;
  time: string;
  frequency: ReminderFrequency;
  whenToTake: WhenToTake;
}): Promise<{ success: boolean; message: string; reminderId: string }> {
  await delay(900);
  return { success: true, message: 'Reminder created', reminderId: `rem_${Date.now()}` };
}

/**
 * API 3 – Get Today's Reminders
 * GET /api/reminders/today
 * Expected time: ~0.5 – 1.0 s
 */
export async function getTodaysReminders(): Promise<Reminder[]> {
  await delay(600);
  return MOCK_REMINDERS;
}

/**
 * API 4 – Mark Reminder as Taken
 * POST /api/reminders/{id}/taken  { taken_at }
 * Expected time: ~0.3 – 0.6 s
 */
export async function markReminderTaken(reminderId: string): Promise<{ success: boolean }> {
  await delay(400);
  return { success: true };
}

/**
 * API 5 – Mark Reminder as Missed
 * POST /api/reminders/{id}/missed  { missed_at }
 * Expected time: ~0.3 – 0.6 s
 */
export async function markReminderMissed(reminderId: string): Promise<{ success: boolean }> {
  await delay(400);
  return { success: true };
}

/**
 * API 6 – Get Reminder History
 * GET /api/reminders/history
 * Expected time: ~0.5 – 1.0 s
 */
export async function getReminderHistory(): Promise<Reminder[]> {
  await delay(600);
  return MOCK_REMINDERS;
}

/**
 * API 7 – Update Reminder
 * PUT /api/reminders/{id}  { time, frequency, when_to_take }
 * Expected time: ~0.3 – 0.6 s
 */
export async function updateReminder(
  reminderId: string,
  payload: Partial<Pick<Reminder, 'time' | 'frequency' | 'whenToTake'>>
): Promise<{ success: boolean; message: string }> {
  await delay(400);
  return { success: true, message: 'Reminder updated' };
}

/**
 * API 8 – Delete Reminder
 * DELETE /api/reminders/{id}
 * Expected time: ~0.3 – 0.6 s
 */
export async function deleteReminder(reminderId: string): Promise<{ success: boolean; message: string }> {
  await delay(400);
  return { success: true, message: 'Reminder deleted' };
}

// ═══════════════════════════════════════════════════════════════
// MEDICINE SCANNER APIS
// ═══════════════════════════════════════════════════════════════

/**
 * API 1 – Upload Image
 * POST /api/medicine-scanner/upload  { image: file }
 * Expected time: ~1.0 – 1.5 s
 */
export async function uploadMedicineImage(imageUri: string): Promise<{ scanId: string; status: 'processing' }> {
  await delay(1200);
  return { scanId: '101', status: 'processing' };
}

/**
 * API 2 – Get Scan Result
 * GET /api/medicine-scanner/result/{scan_id}
 * Expected time: ~0.8 – 1.2 s
 */
export async function getScanResult(scanId: string): Promise<ScanResult> {
  await delay(900);
  return {
    scanId,
    medicineFound: true,
    medicineId: '1',
    medicineName: 'Metformin 500mg',
    confidence: 98,
    status: 'done',
  };
}

/**
 * API 3 – Get Medicine Details (re-used from Browse)
 * GET /api/medicines/{medicine_id}
 */
export { getMedicineDetails as getScanMedicineDetails };

/**
 * API 4 – Save Scanned Medicine (Optional)
 * POST /api/user/medicines  { medicine_id }
 */
export { saveMedicine as saveScannedMedicine };

/**
 * API 5 – Get Scan History
 * GET /api/medicine-scanner/history?page=1&limit=10
 * Expected time: ~0.5 – 1.0 s
 */
export async function getScanHistory(page = 1, limit = 10): Promise<ScanHistoryItem[]> {
  await delay(600);
  return MOCK_SCAN_HISTORY.slice((page - 1) * limit, page * limit);
}

// ═══════════════════════════════════════════════════════════════
// MEDICINE INTERACTION CHECKER APIS
// ═══════════════════════════════════════════════════════════════

/**
 * API 1 – Search Medicines  (re-used)
 * GET /api/medicines/search?q={query}
 * Expected time: ~300ms
 */
export { searchMedicines as searchMedicinesForInteraction };

/**
 * API 2 – Check Interactions
 * POST /api/interactions/check  { medicine_ids: [1, 2] }
 * Expected time: ~1.5 s
 */
export async function checkInteractions(medicineIds: string[]): Promise<InteractionResult> {
  await delay(1500);
  return {
    interactionId: 'int_101',
    medicines: medicineIds.map((id) => {
      const m = MOCK_MEDICINES.find((x) => x.id === id);
      return { id, name: m?.name ?? 'Unknown', type: m?.type ?? 'Tablet' };
    }),
    severity: 'moderate',
    summary: 'Aspirin may increase the risk of stomach irritation when combined with Metformin.',
    recommendation: 'Use with caution and take after food. Consult your doctor.',
    symptoms: ['Stomach pain', 'Acid reflux', 'Nausea'],
    checkedAt: new Date().toISOString(),
  };
}

/**
 * API 3 – Get Interaction Details
 * GET /api/interactions/{interaction_id}
 * Expected time: ~400ms
 */
export async function getInteractionDetails(interactionId: string): Promise<InteractionResult | null> {
  await delay(400);
  return MOCK_INTERACTIONS.find((i) => i.interactionId === interactionId) ?? null;
}

/**
 * API 4 – Save Interaction Report
 * POST /api/interactions/save  { medicine_ids }
 * Expected time: ~300ms
 */
export async function saveInteractionReport(medicineIds: string[]): Promise<{ success: boolean; message: string }> {
  await delay(300);
  return { success: true, message: 'Interaction report saved' };
}

/**
 * API 5 – Get Interaction History
 * GET /api/interactions/history
 * Expected time: ~400ms
 */
export async function getInteractionHistory(): Promise<InteractionHistoryItem[]> {
  await delay(400);
  return MOCK_INTERACTIONS.map((i) => ({
    interactionId: i.interactionId,
    medicines: i.medicines.map((m) => m.name),
    severity: i.severity,
    checkedAt: i.checkedAt,
  }));
}

/**
 * API 6 – Delete Interaction Report
 * DELETE /api/interactions/history/{id}
 * Expected time: ~300ms
 */
export async function deleteInteractionReport(reportId: string): Promise<{ success: boolean }> {
  await delay(300);
  return { success: true };
}

/**
 * API 7 – AI Interaction Summary (Optional)
 * POST /api/interactions/ai-summary  { medicine_ids }
 * Expected time: ~1 s
 */
export async function getAiInteractionSummary(medicineIds: string[]): Promise<{ summary: string }> {
  await delay(1000);
  return {
    summary:
      'Based on the selected medicines, there is a moderate risk of gastrointestinal discomfort. It is recommended to take these medicines after food and consult your physician before continuing.',
  };
}

// ═══════════════════════════════════════════════════════════════
// MY MEDICINES (SAVED) APIS
// ═══════════════════════════════════════════════════════════════

/**
 * API – Get Saved Medicines
 * GET /api/user/medicines
 * Expected time: ~0.5 – 1.0 s
 */
export async function getSavedMedicines(): Promise<Medicine[]> {
  await delay(600);
  return MOCK_MEDICINES.filter((m) => m.isSaved || ['3', '1'].includes(m.id));
}

/**
 * API – Remove Saved Medicine
 * DELETE /api/user/medicines/{medicine_id}
 * Expected time: ~0.3 – 0.6 s
 */
export async function removeSavedMedicine(medicineId: string): Promise<{ success: boolean }> {
  await delay(400);
  return { success: true };
}
