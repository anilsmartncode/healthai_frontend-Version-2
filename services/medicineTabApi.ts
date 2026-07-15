/**
 * medicineTabApi.ts
 * ─────────────────────────────────────────────────────────────
 * All API contracts for the Medicine tab (Browse, Reminder,
 * Scanner, Interaction Checker).
 *
 * Pattern: REAL-FIRST — every function below calls the real backend
 * at https://healthai.smartncode.com/api/... via medicineApiCall().
 * The original 🟢 MOCK body (AsyncStorage / static mock data) is kept
 * commented directly beneath each 🔴 REAL block as a fallback.
 * ─────────────────────────────────────────────────────────────
 */

import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { MOCK_CATEGORIES, MOCK_MEDICINES, MOCK_REMINDERS, MOCK_SCAN_HISTORY, MOCK_INTERACTIONS } from './medicineMockData';
import { ENDPOINTS } from '@/constants/api';
import { medicineApiCall } from './Medicineapiclient';

// Helper: unwrap paginated list responses.
// Backend wraps arrays as { medicines: [...] } or { data: [...] } rather than
// returning a bare array.
function unwrapList<T>(raw: any, ...keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  for (const key of keys) {
    if (Array.isArray(raw?.[key])) return raw[key] as T[];
  }
  return [];
}

// Helper: normalise a raw API medicine object onto the Medicine interface.
// The backend may return snake_case fields (medicine_type, side_effects, etc.)
// that don't match our camelCase type — this ensures .type and .dosage are
// always populated regardless of which key the server uses.
function mapMedicine(raw: any): Medicine {
  return {
    id: String(raw.id ?? raw.medicine_id ?? ''),
    name: raw.name ?? raw.medicine_name ?? '',
    type: raw.form ?? raw.type ?? raw.medicine_type ?? 'Tablet',
    category: raw.category ?? raw.category_name ?? '',
    uses: raw.uses ?? raw.use ?? '',
    dosage: raw.dosage ?? raw.dose ?? '',
    sideEffects: Array.isArray(raw.sideEffects) ? raw.sideEffects
      : Array.isArray(raw.side_effects) ? raw.side_effects
        : [],
    prescriptionType: (raw.rx !== undefined) ? (raw.rx ? 'Rx' : 'OTC') : (raw.prescriptionType ?? raw.prescription_type ?? 'OTC'),
    isSaved: raw.isSaved ?? raw.is_saved,
    imageUrl: raw.imageUrl ?? raw.image_url,
  };
}


// ─── User-scoped storage keys ─────────────────────────────────────────────────
// Scoped to phone number so medicines/reminders from different users never mix.
// Call these with the phone from useAuth() and pass it to each function.
export function medicineStorageKey(phone: string | null): string {
  const user = phone ? phone.replace(/\D/g, '') : 'guest';
  return `healthai_medicines_${user}`;
}
export function reminderStorageKey(phone: string | null): string {
  const user = phone ? phone.replace(/\D/g, '') : 'guest';
  return `healthai_reminders_${user}`;
}

// ─── Shared delay helper (used only by commented-out 🟢 MOCK fallbacks) ──────
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
  description?: string;
  recommendation: string;
  symptoms: string[];
  aiSummary?: string;
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
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.medicineCategories);
  return unwrapList<Category>(raw, 'categories', 'data', 'results');

  // 🟢 MOCK
  // await delay(400);
  // return MOCK_CATEGORIES;
}

/**
 * API 2 – Search Medicines
 * GET /api/medicines/search?q={query}&page=1&limit=20
 * Expected time: ~0.4 – 0.8 s
 */
export async function searchMedicines(query: string, page = 1, limit = 20): Promise<Medicine[]> {
  // 🔴 REAL — active
  const url = `${ENDPOINTS.medicineSearch}?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
  const raw = await medicineApiCall<any>(url);
  return unwrapList<any>(raw, 'medicines', 'data', 'results').map(mapMedicine);

  // 🟢 MOCK
  // await delay(500);
  // const q = query.toLowerCase();
  // return MOCK_MEDICINES.filter(
  //   (m) =>
  //     m.name.toLowerCase().includes(q) ||
  //     m.category.toLowerCase().includes(q)
  // ).slice((page - 1) * limit, page * limit);
}

/**
 * API 3 – Get Medicines by Category
 * GET /api/medicines?category_id={id}&page=1&limit=20
 * Expected time: ~0.5 – 1.0 s
 */
export async function getMedicinesByCategory(categoryId: string, page = 1, limit = 20): Promise<Medicine[]> {
  // 🔴 REAL — active
  const url = `${ENDPOINTS.medicinesByCategory}?category=${categoryId}&page=${page}&limit=${limit}`;
  const raw = await medicineApiCall<any>(url);
  return unwrapList<any>(raw, 'medicines', 'data', 'results').map(mapMedicine);

  // 🟢 MOCK
  // await delay(600);
  // return MOCK_MEDICINES.filter((m) => m.category.toLowerCase() === categoryId.toLowerCase())
  //   .slice((page - 1) * limit, page * limit);
}

/**
 * API 4 – Get Medicine Details
 * GET /api/medicines/{medicine_id}
 * Expected time: ~0.6 – 1.2 s
 */
export async function getMedicineDetails(medicineId: string): Promise<Medicine | null> {
  // 🔴 REAL — active
  try {
    const raw = await medicineApiCall<any>(ENDPOINTS.medicineDetails(medicineId));
    // The backend might return { success: true, medicine: { ... } }
    // Or it might just return the medicine object directly.
    const payload = raw.decrypted_data?.medicine ?? raw.decrypted_data ?? raw.medicine ?? raw.data ?? raw;
    return mapMedicine(payload);
  } catch (e) {
    console.error('[getMedicineDetails] Error:', e);
    return null;
  }

  // 🟢 MOCK
  // await delay(700);
  // return MOCK_MEDICINES.find((m) => m.id === medicineId) ?? null;
}

/**
 * API 5 – Save Medicine (to My Medicines)
 * POST /api/user/medicines  { medicine_id }
 * Expected time: ~0.3 – 0.6 s
 */
export async function saveMedicine(medicineId: string, phone: string | null = null): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.userMedicines, {
    method: 'POST',
    body: { medicine_id: medicineId },
  });

  // 🟢 MOCK — saves to user-scoped AsyncStorage
  // try {
  //   await delay(200);
  //   const raw = await AsyncStorage.getItem(medicineStorageKey(phone));
  //   const ids: string[] = raw ? JSON.parse(raw) : [];
  //   if (!ids.includes(medicineId)) {
  //     await AsyncStorage.setItem(medicineStorageKey(phone), JSON.stringify([...ids, medicineId]));
  //   }
  //   return { success: true, message: 'Saved' };
  // } catch {
  //   return { success: false, message: 'Failed to save' };
  // }
}

/**
 * API 6 – Get Recently Viewed
 * GET /api/medicines/recent?page=1&limit=10
 * Expected time: ~0.3 – 0.6 s
 */
export async function getRecentlyViewed(page = 1, limit = 10): Promise<Medicine[]> {
  // 🔴 REAL — active
  const url = `${ENDPOINTS.medicineRecent}?page=${page}&limit=${limit}`;
  const raw = await medicineApiCall<any>(url);
  return unwrapList<any>(raw, 'medicines', 'data', 'results').map(mapMedicine);

  // 🟢 MOCK
  // await delay(400);
  // return MOCK_MEDICINES.slice(0, limit);
}

/**
 * API 7 – Get Popular Medicines (Optional)
 * GET /api/medicines/popular?limit=10
 * Expected time: ~0.3 – 0.6 s
 */
export async function getPopularMedicines(limit = 10): Promise<Medicine[]> {
  // 🔴 REAL — active
  const url = `${ENDPOINTS.medicinePopular}?limit=${limit}`;
  const raw = await medicineApiCall<any>(url);
  return unwrapList<any>(raw, 'medicines', 'data', 'results').map(mapMedicine);

  // 🟢 MOCK
  // await delay(400);
  // return MOCK_MEDICINES.slice(0, limit);
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
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.userMedicines);
  return unwrapList<any>(raw, 'medicines', 'data', 'results').map(mapMedicine);

  // 🟢 MOCK
  // await delay(600);
  // return MOCK_MEDICINES.slice(0, 5);
}

// ─── Enum maps: internal snake_case → API Title Case literals ────────────────
const FREQ_API_MAP: Record<ReminderFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

const WHEN_API_MAP: Record<WhenToTake, string> = {
  before_food: 'Before Food',
  after_food: 'After Food',
  with_food: 'With Food',
  bedtime: 'At Bedtime',
};

/**
 * API 2 – Create Reminder
 * POST /api/reminders  { medicine_id, medicine_name, medicine_type, dosage, reminder_time, frequency, when_to_take }
 * Expected time: ~0.8 – 1.2 s
 */
export async function createReminder(payload: {
  medicineId: string;
  medicineName: string;
  medicineType: string;
  dosage: string;
  time: string;
  frequency: ReminderFrequency;
  whenToTake: WhenToTake;
}): Promise<{ success: boolean; message: string; reminderId: string }> {
  // 🔴 REAL — active
  const data = await medicineApiCall<any>(ENDPOINTS.reminders, {
    method: 'POST',
    body: {
      medicine_id: payload.medicineId,
      medicine_name: payload.medicineName,
      medicine_type: payload.medicineType,
      dosage: payload.dosage,
      reminder_time: payload.time,
      frequency: FREQ_API_MAP[payload.frequency],
      when_to_take: WHEN_API_MAP[payload.whenToTake],
    },
  });
  return {
    success: data?.success ?? true,
    message: data?.message ?? 'Reminder created',
    reminderId: data?.reminder_id ?? data?.reminderId ?? `rem_${Date.now()}`,
  };

  // 🟢 MOCK
  // await delay(900);
  // return { success: true, message: 'Reminder created', reminderId: `rem_${Date.now()}` };
}

/**
 * API 3 – Get Today's Reminders
 * GET /api/reminders/today
 * Expected time: ~0.5 – 1.0 s
 */
export async function getTodaysReminders(): Promise<Reminder[]> {
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.remindersToday);
  return unwrapList<Reminder>(raw, 'reminders', 'data', 'results');

  // 🟢 MOCK
  // await delay(600);
  // return MOCK_REMINDERS;
}

/**
 * API 4 – Mark Reminder as Taken
 * POST /api/reminders/{id}/taken  { taken_at }
 * Expected time: ~0.3 – 0.6 s
 */
export async function markReminderTaken(reminderId: string): Promise<{ success: boolean }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.reminderTaken(reminderId), {
    method: 'POST',
    body: { taken_at: new Date().toISOString() },
  });

  // 🟢 MOCK
  // await delay(400);
  // return { success: true };
}

/**
 * API 5 – Mark Reminder as Missed
 * POST /api/reminders/{id}/missed  { missed_at }
 * Expected time: ~0.3 – 0.6 s
 */
export async function markReminderMissed(reminderId: string): Promise<{ success: boolean }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.reminderMissed(reminderId), {
    method: 'POST',
    body: { missed_at: new Date().toISOString() },
  });

  // 🟢 MOCK
  // await delay(400);
  // return { success: true };
}

/**
 * API 6 – Get Reminder History
 * GET /api/reminders/history
 * Expected time: ~0.5 – 1.0 s
 */
export async function getReminderHistory(): Promise<Reminder[]> {
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.reminderHistory);
  return unwrapList<Reminder>(raw, 'reminders', 'data', 'results');

  // 🟢 MOCK
  // await delay(600);
  // return MOCK_REMINDERS;
}

/**
 * API 7 – Update Reminder
 * PUT /api/reminders/{id}  { time, frequency, when_to_take }
 * Expected time: ~0.3 – 0.6 s
 */
export async function updateReminder(
  reminderId: string,
  payload: Partial<Pick<Reminder, 'time' | 'frequency' | 'whenToTake'>> & { enabled?: boolean }
): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL — active
  const body: Record<string, unknown> = {};
  if (payload.time !== undefined) body.reminder_time = payload.time;
  if (payload.frequency !== undefined) body.frequency = FREQ_API_MAP[payload.frequency];
  if (payload.whenToTake !== undefined) body.when_to_take = WHEN_API_MAP[payload.whenToTake];
  if (payload.enabled !== undefined) body.is_active = payload.enabled;
  return medicineApiCall(ENDPOINTS.reminderUpdate(reminderId), { method: 'PUT', body });

  // 🟢 MOCK
  // await delay(400);
  // return { success: true, message: 'Reminder updated' };
}

/**
 * API 8 – Delete Reminder
 * DELETE /api/reminders/{id}
 * Expected time: ~0.3 – 0.6 s
 */
export async function deleteReminder(reminderId: string): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.reminderDelete(reminderId), { method: 'DELETE' });

  // 🟢 MOCK
  // await delay(400);
  // return { success: true, message: 'Reminder deleted' };
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
  // 🔴 REAL — active
  const formData = new FormData();
  formData.append('file', { uri: imageUri, name: 'scan.jpg', type: 'image/jpeg' } as any);
  const data = await medicineApiCall<any>(ENDPOINTS.scannerUpload, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });

  const payload = data.decrypted_data ?? data.data ?? data;
  return { scanId: payload.scan_id, status: 'processing' };

  // 🟢 MOCK
  // await delay(1200);
  // return { scanId: '101', status: 'processing' };
}

/**
 * API 2 – Get Scan Result
 * GET /api/medicine-scanner/result/{scan_id}
 * Expected time: ~0.8 – 1.2 s
 */
export async function getScanResult(scanId: string): Promise<ScanResult> {
  // 🔴 REAL — active
  const data = await medicineApiCall<any>(ENDPOINTS.scannerResult(scanId));

  const payload = data.decrypted_data ?? data.data ?? data;
  let status = payload.status ?? 'done';
  // Normalize backend's "identified" status to "done" so the polling loop breaks
  if (status === 'identified') status = 'done';

  return {
    scanId: payload.scan_id ?? scanId,
    medicineFound: !!(payload.medicine_id ?? payload.medicine_found ?? payload.medicine),
    medicineId: payload.medicine_id ? String(payload.medicine_id) : undefined,
    medicineName: payload.medicine?.medicine_name ?? payload.medicine_name,
    confidence: payload.medicine?.confidence ?? payload.confidence ?? payload.ocr_info?.ocr_confidence,
    status: status,
  };

  // 🟢 MOCK
  // await delay(900);
  // return {
  //   scanId,
  //   medicineFound: true,
  //   medicineId: '1',
  //   medicineName: 'Metformin 500mg',
  //   confidence: 98,
  //   status: 'done',
  // };
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
  // 🔴 REAL — active
  const url = `${ENDPOINTS.scannerHistory}?page=${page}&limit=${limit}`;
  const raw = await medicineApiCall<any>(url);
  const list = unwrapList<any>(raw, 'history', 'scans', 'data', 'results');

  return list.map(item => ({
    scanId: item.scan_id ?? item.scanId ?? '',
    status: item.status ?? 'done',
    medicineId: item.medicine_id ? String(item.medicine_id) : undefined,
    medicineName: item.medicine_name ?? item.medicineName ?? 'Unknown Medicine',
    confidence: item.confidence ?? 0,
    aiSummary: item.ai_summary ?? item.aiSummary ?? '',
    imageUrl: item.image_url ?? item.imageUrl,
    createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
  }));

  // 🟢 MOCK
  // await delay(600);
  // return MOCK_SCAN_HISTORY.slice((page - 1) * limit, page * limit);
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
  // 🔴 REAL — active
  const data = await medicineApiCall<any>(ENDPOINTS.interactionsCheck, {
    method: 'POST',
    body: { medicine_ids: medicineIds },
  });
  console.log('[medicineTabApi] checkInteractions raw:', JSON.stringify(data).slice(0, 300));

  // Medicine names: backend may return objects OR medicine_names string array
  let medicines: { id: string; name: string; type: string }[] = [];
  if (Array.isArray(data.medicines) && data.medicines.length > 0) {
    medicines = data.medicines.map((m: any) => ({
      id: String(m.id ?? m.medicine_id ?? ''),
      name: m.name ?? m.medicine_name ?? '',
      type: m.type ?? m.medicine_type ?? 'Tablet',
    }));
  } else if (Array.isArray(data.medicine_names) && data.medicine_names.length > 0) {
    medicines = data.medicine_names.map((name: string, idx: number) => ({
      id: String(idx),
      name,
      type: 'Tablet',
    }));
  } else if (typeof data.medicine_pair_display === 'string' && data.medicine_pair_display) {
    medicines = data.medicine_pair_display.split(' + ').map((name: string, idx: number) => ({
      id: String(idx),
      name: name.trim(),
      type: 'Tablet',
    }));
  }

  return {
    interactionId: String(data.id ?? data.interaction_id ?? data.interactionId ?? `int_${Date.now()}`),
    medicines,
    severity: data.overall_severity ?? data.severity ?? 'none',
    summary: data.summary ?? '',
    recommendation: data.recommendation ?? data.advice ?? '',
    symptoms: data.symptoms ?? data.side_effects ?? [],
    checkedAt: data.checked_at ?? data.created_at ?? data.checkedAt ?? new Date().toISOString(),
  };

  // 🟢 MOCK
  // await delay(1500);
  // return {
  //   interactionId: 'int_101',
  //   medicines: medicineIds.map((id) => {
  //     const m = MOCK_MEDICINES.find((x) => x.id === id);
  //     return { id, name: m?.name ?? 'Unknown', type: m?.type ?? 'Tablet' };
  //   }),
  //   severity: 'moderate',
  //   summary: 'Aspirin may increase the risk of stomach irritation when combined with Metformin.',
  //   recommendation: 'Use with caution and take after food. Consult your doctor.',
  //   symptoms: ['Stomach pain', 'Acid reflux', 'Nausea'],
  //   checkedAt: new Date().toISOString(),
  // };
}

/**
 * API 3 – Get Interaction Details
 * GET /api/interactions/{interaction_id}
 * Expected time: ~400ms
 */
export async function getInteractionDetails(interactionId: string): Promise<InteractionResult | null> {
  // 🔴 REAL — active
  try {
    const raw = await medicineApiCall<any>(ENDPOINTS.interactionDetails(interactionId));
    console.log('[medicineTabApi] getInteractionDetails raw:', JSON.stringify(raw).slice(0, 300));

    // Backend wraps in { success, data: { ... } }
    const d = raw?.data ?? raw;

    // Medicine names
    let medicines: { id: string; name: string; type: string }[] = [];
    if (Array.isArray(d.medicines) && d.medicines.length > 0) {
      medicines = d.medicines.map((m: any) => ({
        id: String(m.id ?? m.medicine_id ?? ''),
        name: m.name ?? m.medicine_name ?? '',
        type: m.type ?? m.medicine_type ?? 'Tablet',
      }));
    } else if (Array.isArray(d.medicine_names) && d.medicine_names.length > 0) {
      medicines = d.medicine_names.map((name: string, idx: number) => ({
        id: String(idx),
        name,
        type: 'Tablet',
      }));
    } else if (typeof d.medicine_pair_display === 'string' && d.medicine_pair_display) {
      medicines = d.medicine_pair_display.split(' + ').map((name: string, idx: number) => ({
        id: String(idx),
        name: name.trim(),
        type: 'Tablet',
      }));
    }

    // recommendations: may be array or single string
    const recommendationText = Array.isArray(d.recommendations)
      ? d.recommendations.join('\n• ')
      : (d.recommendation ?? d.advice ?? '');
    const recommendation = recommendationText
      ? (Array.isArray(d.recommendations) ? '• ' + recommendationText : recommendationText)
      : '';

    return {
      interactionId: String(d.id ?? d.interaction_id ?? d.interactionId ?? interactionId),
      medicines,
      severity: d.overall_severity ?? d.severity ?? 'none',
      summary: d.summary ?? '',
      description: d.description ?? d.ai_summary ?? '',
      recommendation,
      symptoms: d.possible_symptoms ?? d.symptoms ?? d.side_effects ?? [],
      aiSummary: d.ai_summary ?? '',
      checkedAt: d.checked_at ?? d.created_at ?? d.checkedAt ?? new Date().toISOString(),
    };
  } catch (e: any) {
    console.error('[medicineTabApi] getInteractionDetails ERROR', e?.message ?? e);
    return null;
  }

  // 🟢 MOCK
  // await delay(400);
  // return MOCK_INTERACTIONS.find((i) => i.interactionId === interactionId) ?? null;
}

/**
 * API 4 – Save Interaction Report
 * POST /api/interactions/save  { medicine_ids }
 * Expected time: ~300ms
 */
export async function saveInteractionReport(medicineIds: string[]): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.interactionsSave, {
    method: 'POST',
    body: { medicine_ids: medicineIds },
  });

  // 🟢 MOCK
  // await delay(300);
  // return { success: true, message: 'Interaction report saved' };
}

/**
 * API 5 – Get Interaction History
 * GET /api/interactions/history
 * Expected time: ~400ms
 */
export async function getInteractionHistory(): Promise<InteractionHistoryItem[]> {
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.interactionsHistory);
  const data = unwrapList<any>(raw, 'interactions', 'history', 'data', 'results');
  console.log('[medicineTabApi] getInteractionHistory raw items[0]:', JSON.stringify(data[0] ?? null));
  return data.map((i: any) => {
    const rawId = i.id ?? i.interaction_id ?? i.interactionId ?? i.check_id ?? i.checkId;
    const interactionId = rawId != null ? String(rawId) : '';

    // Medicine names: array field or split from display string
    let medicines: string[] = [];
    const rawMeds = i.medicines ?? i.medicine_names;
    if (Array.isArray(rawMeds) && rawMeds.length > 0) {
      medicines = rawMeds.map((m: any) =>
        typeof m === 'string' ? m : m.name ?? m.medicine_name ?? ''
      );
    } else if (typeof i.medicine_pair_display === 'string' && i.medicine_pair_display) {
      medicines = i.medicine_pair_display.split(' + ').map((s: string) => s.trim());
    }

    return {
      interactionId,
      medicines,
      severity: i.overall_severity ?? i.severity ?? 'none',
      checkedAt: i.checked_at ?? i.checkedAt ?? i.created_at ?? i.date ?? new Date().toISOString(),
    };
  });

  // 🟢 MOCK
  // await delay(400);
  // return MOCK_INTERACTIONS.map((i) => ({
  //   interactionId: i.interactionId,
  //   medicines: i.medicines.map((m) => m.name),
  //   severity: i.severity,
  //   checkedAt: i.checkedAt,
  // }));
}

/**
 * API 6 – Delete Interaction Report
 * DELETE /api/interactions/history/{id}
 * Expected time: ~300ms
 */
export async function deleteInteractionReport(reportId: string): Promise<{ success: boolean; message?: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.interactionHistoryDelete(reportId), {
    method: 'DELETE',
  });
}

/**
 * API 7 – AI Interaction Summary (Optional)
 * POST /api/interactions/ai-summary  { medicine_ids }
 * Expected time: ~1 s
 */
export async function getAiInteractionSummary(medicineIds: string[]): Promise<{ summary: string }> {
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.interactionsAiSummary, {
    method: 'POST',
    body: { medicine_ids: medicineIds },
  });
  return (raw?.data ?? raw) as { summary: string };
}

// ═══════════════════════════════════════════════════════════════
// MY MEDICINES (SAVED) APIS
// ═══════════════════════════════════════════════════════════════

/**
 * API – Get Saved Medicines
 * GET /api/user/medicines
 * Expected time: ~0.5 – 1.0 s
 */
export async function getSavedMedicines(phone: string | null = null): Promise<Medicine[]> {
  // 🔴 REAL — active. This was previously reading a local AsyncStorage list
  // that nothing in the real-API path ever wrote to (saveMedicine() POSTs
  // to the backend but never touched local storage), so My Medicines could
  // show an empty/stale list even after a successful save. Mirrors
  // getUserMedicines() above, which already called this correctly.
  const raw = await medicineApiCall<any>(ENDPOINTS.userMedicines);
  return unwrapList<any>(raw, 'medicines', 'data', 'results').map(mapMedicine);

  // 🟢 MOCK — previous behavior, kept for quick local testing if needed:
  // await delay(300);
  // try {
  //   const raw = await AsyncStorage.getItem(medicineStorageKey(phone));
  //   const ids: string[] = raw ? JSON.parse(raw) : [];
  //   return MOCK_MEDICINES.filter((m) => ids.includes(m.id));
  // } catch {
  //   return [];
  // }
}

/**
 * API – Remove Saved Medicine
 * DELETE /api/user/medicines/{medicine_id}
 * Expected time: ~0.3 – 0.6 s
 */
export async function removeSavedMedicine(medicineId: string, phone: string | null = null): Promise<{ success: boolean }> {
  // 🔴 REAL — active. Previously only removed the id from a local
  // AsyncStorage list that the real save path never wrote to — so a
  // "removed" medicine was never actually deleted server-side and could
  // reappear on next real-API fetch / another device.
  try {
    await medicineApiCall(ENDPOINTS.userMedicineRemove(medicineId), { method: 'DELETE' });
    return { success: true };
  } catch (e: any) {
    console.log('[medicineTabApi] removeSavedMedicine failed', e?.message || e);
    return { success: false };
  }

  // 🟢 MOCK — previous behavior, kept for quick local testing if needed:
  // await delay(200);
  // try {
  //   const raw = await AsyncStorage.getItem(medicineStorageKey(phone));
  //   const ids: string[] = raw ? JSON.parse(raw) : [];
  //   await AsyncStorage.setItem(medicineStorageKey(phone), JSON.stringify(ids.filter(id => id !== medicineId)));
  //   return { success: true };
  // } catch {
  //   return { success: false };
  // }
}