/**
 * services/medicinesApi.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Medicine Tab — API service layer
 *
 * HOW TO USE:
 *   • Every function has TWO blocks — 🔴 REAL (active) and 🟢 MOCK (commented)
 *   • 🔴 REAL is active, calling https://healthai.smartncode.com/api/...
 *   • If backend paths differ, update ENDPOINTS in constants/api.ts
 *
 * COVERS:
 *   • Browse All Medicines  (7 APIs)
 *   • Medicine Reminders    (8 APIs)
 *   • Medicine Scanner      (5 APIs)
 *   • Interaction Checker   (7 APIs)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ENDPOINTS } from '@/constants/api';
import { medicineApiCall } from './Medicineapiclient';
import { Colors } from '@/constants/Colors';

// ─── Config ───────────────────────────────────────────────────────────────────
// 🔴 REAL endpoints come from ENDPOINTS (constants/api.ts) — BASE_URL below is
// kept only so the 🟢 MOCK comment blocks below remain visually consistent.
const BASE_URL = 'https://your-api-base-url.com'; // unused now that REAL is active

// Helper: fake network delay so mock feels realistic
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Helper: unwrap paginated list responses.
// Backend wraps arrays as { medicines: [...] } or { data: [...] } rather than
// returning a bare array.  This extracts the array safely, falling back to []
// so callers never receive undefined and crash on .map().
function unwrapList<T>(raw: any, ...keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  for (const key of keys) {
    if (Array.isArray(raw?.[key])) return raw[key] as T[];
  }
  return [];
}

// Helper: normalise a raw API medicine object onto the Medicine interface.
// The backend may return snake_case fields (ai_summary, side_effects, etc.)
// that don't match our camelCase type — this ensures .aiSummary, .isVerified,
// etc. are always populated regardless of which key the server uses.
function mapMedicine(raw: any): Medicine {
  return {
    id: String(raw.id ?? raw.medicine_id ?? ''),
    name: raw.name ?? raw.medicine_name ?? '',
    form: raw.form ?? raw.type ?? raw.medicine_type ?? 'Tablet',
    category: raw.category ?? raw.category_name ?? '',
    rx: raw.rx ?? (raw.prescription_type === 'Prescription'),
    uses: raw.uses ?? raw.use ?? undefined,
    dosage: raw.dosage ?? raw.dose ?? undefined,
    sideEffects: Array.isArray(raw.sideEffects) ? raw.sideEffects
      : Array.isArray(raw.side_effects) ? raw.side_effects
        : undefined,
    description: raw.description ?? undefined,
    warnings: raw.warnings ?? undefined,
    aiSummary: raw.aiSummary ?? raw.ai_summary ?? undefined,
    aiSummaryDetails: raw.aiSummaryDetails ?? raw.ai_summary_details ?? undefined,
    patientSummary: raw.patientSummary ?? raw.patient_summary ?? undefined,
    aiGenerated: raw.aiGenerated ?? raw.ai_generated ?? undefined,
    isVerified: raw.isVerified ?? raw.is_verified ?? undefined,
  };
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
}

export interface Medicine {
  id: string;
  name: string;
  form: string;         // "Tablet" | "Capsule" | "Syrup" etc.
  category: string;
  rx: boolean;          // true = Prescription Required
  uses?: string;
  dosage?: string;
  sideEffects?: string[];
  description?: string;
  warnings?: string;
  aiSummary?: string;
  aiSummaryDetails?: {
    uses?: string;
    howItHelps?: string;
    dosageNote?: string;
    safetyNote?: string;
    sideEffects?: string;
  };
  patientSummary?: {
    overview?: string;
    howItWorks?: string;
    administration?: string;
    safety?: string;
    whenToSeekMedicalHelp?: string;
  };
  aiGenerated?: boolean;
  isVerified?: boolean;
}

export interface SearchMedicinesResponse {
  success: boolean;
  status: 'success' | 'no_match';
  query: string;
  country: string;
  count: number;
  medicines: Medicine[];
  reason?: string;
  disclaimer?: string;
}

export interface Reminder {
  id: string;
  medicineId?: string;
  medicineName: string;
  time: string;         // "08:00 AM"
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  whenToTake: 'before_food' | 'after_food' | 'with_food' | 'bedtime';
  enabled: boolean;
  status: 'upcoming' | 'taken' | 'missed' | 'cancelled';
}

export interface ScanResult {
  scanId: string;
  medicineId?: string;
  name?: string;
  medicineName?: string;
  form?: string;
  medicineType?: string;
  category?: string;
  dosage?: string;
  manufacturer?: string;
  uses?: string;
  confidence?: number;   // 0–100 normalized
  medicineFound?: boolean;
  noTextDetected?: boolean;
  failureReason?: string;
}

export interface ScanHistoryItem {
  id: string;
  name: string;
  form: string;
  scannedAt: string;
  confidence: number;
}

export type Severity = 'none' | 'low' | 'moderate' | 'high';

export interface MedicineSearchResult {
  id: string;
  name: string;
  form: string;
  rx: boolean;
}

export interface InteractionResult {
  severity: Severity;
  medicines: string[];
  summary: string;
  recommendation: string;
  description: string;
  symptoms: string[];
  recommendations: string[];
}

export interface InteractionHistoryItem {
  id: string;
  medicines: string[];
  severity: Severity;
  date: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// (delete this entire section once real APIs are integrated)
// ═════════════════════════════════════════════════════════════════════════════

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Diabetes', icon: 'water-outline', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'c2', name: 'Blood Pressure', icon: 'pulse-outline', color: '#E11D48', bg: '#FFF1F2' },
  { id: 'c3', name: 'Vitamins', icon: 'nutrition-outline', color: '#16A34A', bg: '#F0FDF4' },
  { id: 'c4', name: 'Heart Care', icon: 'heart-outline', color: '#EA580C', bg: '#FFF7ED' },
  { id: 'c5', name: 'Thyroid', icon: 'stats-chart-outline', color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'c6', name: 'Pain Relief', icon: 'bandage-outline', color: '#E11D48', bg: '#FFF1F2' },
];

export const MOCK_MEDICINES: Medicine[] = [
  { id: 'm1', name: 'Metformin 500mg', form: 'Tablet', category: 'Diabetes', rx: true, uses: 'Controls blood sugar in type 2 diabetes.', dosage: 'As prescribed by doctor', sideEffects: ['Nausea', 'Stomach discomfort'] },
  { id: 'm2', name: 'Glimepiride 1mg', form: 'Tablet', category: 'Diabetes', rx: true, uses: 'Stimulates insulin release.', dosage: 'Once daily before breakfast', sideEffects: ['Hypoglycemia', 'Weight gain'] },
  { id: 'm3', name: 'Gliclazide 80mg', form: 'Tablet', category: 'Diabetes', rx: true, uses: 'Lowers blood glucose levels.', dosage: 'As prescribed by doctor', sideEffects: ['Nausea', 'Dizziness'] },
  { id: 'm4', name: 'Voglibose 0.2mg', form: 'Tablet', category: 'Diabetes', rx: true, uses: 'Reduces post-meal blood sugar spikes.', dosage: 'With meals', sideEffects: ['Flatulence', 'Diarrhea'] },
  { id: 'm5', name: 'Sitagliptin 50mg', form: 'Tablet', category: 'Diabetes', rx: true, uses: 'Helps pancreas make more insulin when needed.', dosage: 'Once daily', sideEffects: ['Runny nose', 'Headache'] },
  { id: 'm6', name: 'Dapagliflozin 10mg', form: 'Tablet', category: 'Diabetes', rx: true, uses: 'Removes excess sugar through urine.', dosage: 'Once daily in the morning', sideEffects: ['Urinary tract infections', 'Thirst'] },
  { id: 'm7', name: 'Amlodipine 5mg', form: 'Tablet', category: 'Blood Pressure', rx: true, uses: 'Lowers high blood pressure, treats angina.', dosage: '5mg once daily', sideEffects: ['Flushing', 'Ankle swelling'] },
  { id: 'm8', name: 'Aspirin 75mg', form: 'Tablet', category: 'Heart Care', rx: false, uses: 'Blood thinner, reduces heart attack risk.', dosage: '75mg once daily after food', sideEffects: ['Stomach upset', 'Heartburn'] },
  { id: 'm9', name: 'Vitamin D3', form: 'Capsule', category: 'Vitamins', rx: false, uses: 'Maintains bone health and immune system.', dosage: '1 capsule daily', sideEffects: ['Nausea if overdosed'] },
  { id: 'm10', name: 'Paracetamol 500mg', form: 'Tablet', category: 'Pain Relief', rx: false, uses: 'Relieves mild to moderate pain and fever.', dosage: '500mg every 4–6 hours', sideEffects: ['Rare liver issues if overdosed'] },
];

export const MOCK_REMINDERS: Reminder[] = [
  { id: 'r1', medicineId: 'm1', medicineName: 'Metformin 500mg', time: '08:00 AM', frequency: 'daily', whenToTake: 'after_food', enabled: true, status: 'upcoming' },
  { id: 'r2', medicineId: 'm9', medicineName: 'Vitamin D3', time: '08:00 PM', frequency: 'daily', whenToTake: 'after_food', enabled: true, status: 'upcoming' },
];

export const MOCK_REMINDER_HISTORY: Reminder[] = [
  { id: 'h1', medicineId: 'm1', medicineName: 'Metformin 500mg', time: '08:00 AM', frequency: 'daily', whenToTake: 'after_food', enabled: true, status: 'taken' },
  { id: 'h2', medicineId: 'm9', medicineName: 'Vitamin D3', time: '08:00 PM', frequency: 'daily', whenToTake: 'after_food', enabled: true, status: 'missed' },
  { id: 'h3', medicineId: 'm1', medicineName: 'Metformin 500mg', time: '08:00 AM', frequency: 'daily', whenToTake: 'after_food', enabled: true, status: 'taken' },
];

export const MOCK_SCAN_RESULT: ScanResult = {
  scanId: '101',
  medicineId: 'm1',
  name: 'Metformin 500mg',
  form: 'Tablet',
  confidence: 98,
};

export const MOCK_SCAN_HISTORY: ScanHistoryItem[] = [
  { id: 's1', name: 'Metformin 500mg', form: 'Tablet', scannedAt: '02 Jun 2026, 10:30 AM', confidence: 98 },
  { id: 's2', name: 'Aspirin 75mg', form: 'Tablet', scannedAt: '01 Jun 2026, 08:15 PM', confidence: 94 },
  { id: 's3', name: 'Paracetamol 500mg', form: 'Tablet', scannedAt: '30 May 2026, 07:45 PM', confidence: 91 },
];

export const MOCK_SEARCH_RESULTS: MedicineSearchResult[] = [
  { id: 'm1', name: 'Metformin 500mg', form: 'Tablet', rx: true },
  { id: 'm2', name: 'Metformin 850mg', form: 'Tablet', rx: true },
  { id: 'm11', name: 'Metoprolol 25mg', form: 'Tablet', rx: true },
  { id: 'm12', name: 'Methotrexate 2.5mg', form: 'Tablet', rx: true },
  { id: 'm8', name: 'Aspirin 75mg', form: 'Tablet', rx: false },
  { id: 'm13', name: 'Aspirin 150mg', form: 'Tablet', rx: false },
  { id: 'm14', name: 'Ibuprofen 400mg', form: 'Tablet', rx: false },
  { id: 'm10', name: 'Paracetamol 500mg', form: 'Tablet', rx: false },
  { id: 'm15', name: 'Amoxicillin 500mg', form: 'Capsule', rx: true },
];

export const MOCK_INTERACTION_HISTORY: InteractionHistoryItem[] = [
  { id: 'i1', medicines: ['Metformin 500mg', 'Aspirin 75mg'], severity: 'moderate', date: '02 Jun 2026, 10:30 AM' },
  { id: 'i2', medicines: ['Paracetamol 500mg', 'Ibuprofen 400mg'], severity: 'low', date: '30 May 2026, 07:45 PM' },
  { id: 'i3', medicines: ['Amoxicillin 500mg'], severity: 'high', date: '28 May 2026, 08:20 AM' },
];

// ═════════════════════════════════════════════════════════════════════════════
// BROWSE ALL MEDICINES APIs
// Total: 7 APIs  |  Avg total time: ~2.5 – 4.0 sec
// ═════════════════════════════════════════════════════════════════════════════

/**
 * API 1 — Get Categories
 * Triggered: when user opens Browse Medicines screen
 * Expected:  ~0.3 – 0.6 sec
 */
// Maps backend category slugs/names → valid Ionicons names
const CAT_ICON_MAP: Record<string, string> = {
  // pain / fever
  pain: 'bandage-outline',
  fever: 'thermometer-outline',
  painkiller: 'bandage-outline',
  // allergy
  allergy: 'alert-circle-outline',
  allergies: 'alert-circle-outline',
  antihistamine: 'alert-circle-outline',
  // cough / cold / respiratory
  cough: 'mic-off-outline',
  cold: 'snow-outline',
  respiratory: 'fitness-outline',
  // stomach / digestive / gastro
  stomach: 'nutrition-outline',
  digestive: 'nutrition-outline',
  gastro: 'nutrition-outline',
  antacid: 'nutrition-outline',
  // vitamin / supplement
  vitamin: 'leaf-outline',
  supplement: 'leaf-outline',
  // skin / derma
  skin: 'color-palette-outline',
  derma: 'color-palette-outline',
  topical: 'color-palette-outline',
  // diabetes / blood sugar
  diabetes: 'pulse-outline',
  blood: 'pulse-outline',
  cardiac: 'heart-outline',
  heart: 'heart-outline',
  // sleep / anxiety / mental
  sleep: 'moon-outline',
  anxiety: 'happy-outline',
  mental: 'brain',
  // antibiotic / infection
  antibiotic: 'shield-checkmark-outline',
  infection: 'shield-checkmark-outline',
  // eye / ear / ent
  eye: 'eye-outline',
  ear: 'ear-outline',
  // default
  general: 'medical-outline',
};

function resolveCatIcon(raw: string | undefined): string {
  if (!raw) return 'medical-outline';
  const key = raw.toLowerCase().replace(/[^a-z]/g, '');
  // exact match
  if (CAT_ICON_MAP[key]) return CAT_ICON_MAP[key];
  // partial match
  for (const k of Object.keys(CAT_ICON_MAP)) {
    if (key.includes(k) || k.includes(key)) return CAT_ICON_MAP[k];
  }
  return 'medical-outline';
}

export async function getCategories(): Promise<Category[]> {
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.medicineCategories);
  const list = unwrapList<any>(raw, 'categories', 'data', 'results');
  return list.map((c: any) => ({
    ...c,
    icon: resolveCatIcon(c.icon ?? c.name ?? c.slug ?? ''),
    color: c.color ?? Colors.primary,
  }));

  // 🟢 MOCK
  // await delay(400);
  // return MOCK_CATEGORIES;
}

/**
 * API 2 — Search Medicines
 * Triggered: when user types in the search box
 * Expected:  ~0.4 – 0.8 sec
 * Params:    q (string), page (number), limit (number)
 */
export async function searchMedicines(
  q: string, 
  page = 1, 
  limit = 20,
  country = 'Global',
  asOfDate?: string
): Promise<SearchMedicinesResponse> {
  // 🔴 REAL — active
  let url = `${ENDPOINTS.medicineSearch}?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}&country=${encodeURIComponent(country)}`;
  if (asOfDate) {
    url += `&as_of_date=${encodeURIComponent(asOfDate)}`;
  }
  const raw = await medicineApiCall<any>(url);
  const mappedMedicines = unwrapList<any>(raw, 'medicines', 'data', 'results').map(mapMedicine);
  
  return {
    success: raw.success ?? true,
    status: raw.status ?? (mappedMedicines.length > 0 ? 'success' : 'no_match'),
    query: raw.query ?? q,
    country: raw.country ?? country,
    count: raw.count ?? mappedMedicines.length,
    medicines: mappedMedicines,
    reason: raw.reason,
    disclaimer: raw.disclaimer,
  };
}

/**
 * API 3 — Get Medicines by Category
 * Triggered: when user selects a category chip
 * Expected:  ~0.5 – 1.0 sec
 * Params:    category_id (string), page (number), limit (number)
 */
export async function getMedicinesByCategory(categoryId: string, page = 1, limit = 20): Promise<Medicine[]> {
  // 🔴 REAL — active
  const url = `${ENDPOINTS.medicinesByCategory}?category=${categoryId}&page=${page}&limit=${limit}`;
  const raw = await medicineApiCall<any>(url);
  return unwrapList<any>(raw, 'medicines', 'data', 'results').map(mapMedicine);

  // 🟢 MOCK
  // await delay(600);
  // const cat = MOCK_CATEGORIES.find((c) => c.id === categoryId);
  // return MOCK_MEDICINES.filter((m) => m.category === cat?.name).slice((page - 1) * limit, page * limit);
}

/**
 * API 4 — Get Medicine Details
 * Triggered: when user clicks a medicine to view full details
 * Expected:  ~0.6 – 1.2 sec
 * Params:    medicine_id (string)
 */
export async function getMedicineDetails(medicineId: string): Promise<Medicine | null> {
  // 🔴 REAL — active
  try {
    const raw = await medicineApiCall<any>(ENDPOINTS.medicineDetails(medicineId));
    // Backend wraps response as { success, medicine: { ... }, disclaimer }
    const payload = raw?.medicine ?? raw?.data ?? raw;
    return mapMedicine(payload);
  } catch {
    return null;
  }

  // 🟢 MOCK
  // await delay(700);
  // return MOCK_MEDICINES.find((m) => m.id === medicineId) ?? null;
}

/**
 * API 5 — Save Medicine
 * Triggered: when user taps "Save Medicine" on details screen
 * Expected:  ~0.3 – 0.6 sec
 * Body:      { medicine_id: string }
 */
export async function saveMedicine(medicineId: string): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.userMedicines, {
    method: 'POST',
    body: { medicine_id: medicineId },
  });

  // 🟢 MOCK
  // await delay(400);
  // return { success: true, message: 'Saved' };
}

/**
 * API 6 — Get Recently Viewed
 * Triggered: when user opens the Recently Viewed section
 * Expected:  ~0.3 – 0.6 sec
 * Params:    page (number), limit (number)
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
 * API 7 — Get Popular Medicines (optional)
 * Triggered: when user opens Browse screen (home state)
 * Expected:  ~0.3 – 0.6 sec
 * Params:    limit (number)
 */
export async function getPopularMedicines(limit = 6): Promise<Medicine[]> {
  // 🔴 REAL — active
  const url = `${ENDPOINTS.medicinePopular}?limit=${limit}`;
  const raw = await medicineApiCall<any>(url);
  return unwrapList<any>(raw, 'medicines', 'data', 'results').map(mapMedicine);

  // 🟢 MOCK
  // await delay(400);
  // return MOCK_MEDICINES.slice(0, limit);
}

// ═════════════════════════════════════════════════════════════════════════════
// MEDICINE REMINDERS APIs
// Total: 8 APIs  |  Avg total time: ~3.0 – 4.5 sec
// ═════════════════════════════════════════════════════════════════════════════

/**
 * API 1 — Get User's Saved Medicines (for reminder picker)
 * Triggered: when My Medicines screen opens
 * Expected:  ~0.5 – 1.0 sec
 */
export async function getUserMedicines(): Promise<Medicine[]> {
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.userMedicines);
  return unwrapList<Medicine>(raw, 'medicines', 'data', 'results');

  // 🟢 MOCK
  // await delay(600);
  // return MOCK_MEDICINES.slice(0, 5);
}

/**
 * API 2 — Create Reminder
 * Triggered: when user taps "Save Reminder"
 * Expected:  ~0.8 – 1.2 sec
 * Body:      { medicine_id, time, frequency, when_to_take }
 */
export async function createReminder(payload: {
  medicineId: string;
  time: string;
  frequency: Reminder['frequency'];
  whenToTake: Reminder['whenToTake'];
}): Promise<{ success: boolean; message: string; reminderId: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.reminders, {
    method: 'POST',
    body: {
      medicine_id: payload.medicineId,
      time: payload.time,
      frequency: payload.frequency,
      when_to_take: payload.whenToTake,
    },
  });

  // 🟢 MOCK
  // await delay(900);
  // return { success: true, message: 'Reminder created', reminderId: `r_${Date.now()}` };
}

/**
 * API 3 — Get Today's Reminders
 * Triggered: when Today's Reminders screen opens
 * Expected:  ~0.5 – 1.0 sec
 */
export async function getTodaysReminders(): Promise<Reminder[]> {
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.remindersToday);
  console.log('=== GET TODAYS REMINDERS API RESPONSE ===', JSON.stringify(raw, null, 2));
  const list = unwrapList<any>(raw, 'reminders', 'data', 'results');
  
  // NOTE: This mapping is REQUIRED because the Home Screen banner explicitly
  // expects 'medicineName', 'time', and 'status: "upcoming"'. 
  // The backend returns 'medicine_name', 'reminder_time', and 'is_active'.
  return list.map((r: any) => ({
    id: String(r.id),
    medicineId: r.medicine_id ? String(r.medicine_id) : undefined,
    medicineName: r.medicine_name ?? r.medicineName ?? '',
    time: r.reminder_time ?? r.time ?? '',
    frequency: r.frequency ?? 'daily',
    whenToTake: r.when_to_take ?? r.whenToTake ?? 'after_food',
    enabled: r.is_active ?? true,
    status: (['taken', 'missed', 'cancelled'].includes(String(r.status || '').toLowerCase())) 
      ? (String(r.status).toLowerCase() as 'upcoming' | 'taken' | 'missed' | 'cancelled')
      : 'upcoming'
  }));

  // 🟢 MOCK
  // await delay(600);
  // return MOCK_REMINDERS;
}

/**
 * API 4 — Mark Reminder as Taken
 * Triggered: when user taps "Taken"
 * Expected:  ~0.3 – 0.6 sec
 * Body:      { taken_at: ISO string }
 */
export async function markReminderTaken(reminderId: string): Promise<{ success: boolean; status: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.reminderTaken(reminderId), {
    method: 'POST',
    body: { taken_at: new Date().toISOString() },
  });

  // 🟢 MOCK
  // await delay(350);
  // return { success: true, status: 'taken' };
}

/**
 * API 5 — Mark Reminder as Missed
 * Triggered: when user taps "Missed"
 * Expected:  ~0.3 – 0.6 sec
 * Body:      { missed_at: ISO string }
 */
export async function markReminderMissed(reminderId: string): Promise<{ success: boolean; status: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.reminderMissed(reminderId), {
    method: 'POST',
    body: { missed_at: new Date().toISOString() },
  });

  // 🟢 MOCK
  // await delay(350);
  // return { success: true, status: 'missed' };
}

/**
 * API 6 — Get Reminder History
 * Triggered: when History tab opens
 * Expected:  ~0.5 – 1.0 sec
 */
export async function getReminderHistory(): Promise<Reminder[]> {
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.reminderHistory);
  return unwrapList<Reminder>(raw, 'reminders', 'data', 'results');

  // 🟢 MOCK
  // await delay(600);
  // return MOCK_REMINDER_HISTORY;
}

/**
 * API 7 — Update Reminder
 * Triggered: when user taps "Update Reminder" in edit sheet
 * Expected:  ~0.3 – 0.6 sec
 * Body:      { time, frequency, when_to_take }
 */
export async function updateReminder(
  reminderId: string,
  payload: Pick<Reminder, 'time' | 'frequency' | 'whenToTake'>,
): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.reminderUpdate(reminderId), {
    method: 'PUT',
    body: { time: payload.time, frequency: payload.frequency, when_to_take: payload.whenToTake },
  });

  // 🟢 MOCK
  // await delay(400);
  // return { success: true, message: 'Reminder updated' };
}

/**
 * API 8 — Delete Reminder
 * Triggered: when user taps "Delete Reminder" in edit sheet
 * Expected:  ~0.3 – 0.6 sec
 */
export async function deleteReminder(reminderId: string): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.reminderDelete(reminderId), { method: 'DELETE' });

  // 🟢 MOCK
  // await delay(350);
  // return { success: true, message: 'Reminder deleted' };
}

// ═════════════════════════════════════════════════════════════════════════════
// MEDICINE SCANNER APIs
// Total: 5 APIs  |  Avg total time: ~3.0 – 4.5 sec
// ═════════════════════════════════════════════════════════════════════════════

/**
 * API 1 — Upload Medicine Image
 * Triggered: after user captures/selects an image
 * Expected:  ~1.0 – 1.5 sec
 * Body:      { image: file (multipart/form-data) }
 * Response:  { scan_id, status: "processing" }
 */
export async function uploadMedicineImage(imageUri: string): Promise<{ scanId: string; status: string }> {
  // 🔴 REAL — active
  const formData = new FormData();
  formData.append('image', { uri: imageUri, name: 'scan.jpg', type: 'image/jpeg' } as any);
  const data = await medicineApiCall<{ scan_id: string; status: string }>(ENDPOINTS.scannerUpload, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
  return { scanId: data.scan_id, status: data.status };

  // 🟢 MOCK
  // await delay(1200);
  // return { scanId: '101', status: 'processing' };
}

/**
 * API 2 — Get Scan Result
 * Triggered: after image is uploaded (poll until medicine_found = true)
 * Expected:  ~0.8 – 1.2 sec
 * Params:    scan_id (string)
 */
export async function getScanResult(scanId: string): Promise<ScanResult> {
  // 🔴 REAL — active
  const data = await medicineApiCall<any>(ENDPOINTS.scannerResult(scanId));
  const payload = data.decrypted_data ?? data.data ?? data;

  const rawMedId = payload.medicine_id ?? payload.medicine?.medicine_id ?? payload.medicine?.id;
  const medicineId = rawMedId ? String(rawMedId) : undefined;

  const rawMedName = payload.medicine?.medicine_name ?? payload.medicine_name ?? payload.medicine?.name;
  const isMeaningfulName = typeof rawMedName === 'string' &&
    rawMedName.trim().length > 0 &&
    !['unknown', 'null', 'undefined', 'not identified', 'none', 'n/a', 'no text', 'not found', 'unidentified'].includes(rawMedName.trim().toLowerCase());
  const medicineName = isMeaningfulName ? rawMedName.trim() : undefined;

  const rawFound = payload.medicine_found ?? payload.medicineFound;
  const medicineFound = (rawFound !== false && rawFound !== 'false') && Boolean(medicineName || medicineId);

  const extractedText = payload.ocr_info?.extracted_text ?? payload.extracted_text ?? payload.ocr_text ?? '';
  const noTextDetected = payload.no_text_detected ?? (!extractedText || extractedText.trim().length === 0);

  const rawConfidence = payload.confidence ?? payload.medicine?.confidence ?? payload.ocr_info?.ocr_confidence ?? payload.ocr_info?.confidence;
  let normalizedConfidence: number | undefined = undefined;
  if (typeof rawConfidence === 'number') {
    if (rawConfidence > 0 && rawConfidence <= 1) {
      normalizedConfidence = Math.round(rawConfidence * 100);
    } else if (rawConfidence > 1 && rawConfidence <= 100) {
      normalizedConfidence = Math.round(rawConfidence);
    } else {
      normalizedConfidence = Math.round(rawConfidence);
    }
  }

  const form = payload.form ?? payload.medicine?.type ?? payload.medicine?.medicine_type ?? payload.type ?? 'Tablet';
  const category = payload.category ?? payload.medicine?.category;
  const dosage = payload.dosage ?? payload.medicine?.dosage;
  const manufacturer = payload.manufacturer ?? payload.medicine?.manufacturer;
  const uses = payload.uses ?? payload.medicine?.uses ?? payload.ai_summary ?? payload.summary;

  return {
    scanId: payload.scan_id ?? scanId,
    medicineId: medicineId,
    name: medicineName,
    medicineName: medicineName,
    form: form,
    medicineType: form,
    category: category,
    dosage: dosage,
    manufacturer: manufacturer,
    uses: uses,
    confidence: normalizedConfidence,
    medicineFound: medicineFound,
    noTextDetected: noTextDetected,
    failureReason: payload.reason ?? payload.message ?? (noTextDetected ? 'No readable text was detected in this image.' : undefined),
  };

  // 🟢 MOCK
  // await delay(900);
  // return MOCK_SCAN_RESULT;
}

/**
 * API 3 — Get Medicine Details after scan
 * Same endpoint as Browse API 4 — reused here
 * Triggered: after medicine is identified, auto-fetches full info
 * Expected:  ~0.8 – 1.2 sec
 */
export { getMedicineDetails as getScanMedicineDetails };

/**
 * API 4 — Save Scanned Medicine (optional)
 * Triggered: when user taps "Save Medicine" from scanner actions
 * Expected:  ~0.3 – 1.2 sec
 * Same endpoint as Browse API 5 — reused here
 */
export { saveMedicine as saveScannedMedicine };

/**
 * API 5 — Get Scan History
 * Triggered: when user taps the history icon in scanner header
 * Expected:  ~0.5 – 1.0 sec
 * Params:    page (number), limit (number)
 */
export async function getScanHistory(page = 1, limit = 10): Promise<ScanHistoryItem[]> {
  // 🔴 REAL — active
  const url = `${ENDPOINTS.scannerHistory}?page=${page}&limit=${limit}`;
  const raw = await medicineApiCall<any>(url);
  return unwrapList<ScanHistoryItem>(raw, 'history', 'scans', 'data', 'results');

  // 🟢 MOCK
  // await delay(600);
  // return MOCK_SCAN_HISTORY.slice((page - 1) * limit, page * limit);
}

// ═════════════════════════════════════════════════════════════════════════════
// INTERACTION CHECKER APIs
// Total: 7 APIs  |  Avg total time: varies (~300ms – 1.5s per call)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * API 1 — Search Medicines for Interaction Checker
 * Triggered: on each keystroke in medicine search box (~300ms debounce)
 * Expected:  ~300ms
 * Same endpoint as Browse API 2 — reused with a different return type
 */
export async function searchMedicinesForInteraction(q: string): Promise<MedicineSearchResult[]> {
  // 🔴 REAL — active
  const url = `${ENDPOINTS.medicineSearch}?q=${encodeURIComponent(q)}`;
  const raw = await medicineApiCall<any>(url);
  return unwrapList<MedicineSearchResult>(raw, 'medicines', 'data', 'results');

  // 🟢 MOCK
  // await delay(300);
  // const query = q.toLowerCase();
  // return MOCK_SEARCH_RESULTS.filter((m) => m.name.toLowerCase().includes(query));
}

/**
 * API 2 — Check Interactions
 * Triggered: when user taps "Analyze Interactions"
 * Expected:  ~1.5 sec  (processing + analysis)
 * Body:      { medicine_ids: string[] }
 */
export async function checkInteractions(medicineIds: string[]): Promise<InteractionResult> {
  // 🔴 REAL — active
  return medicineApiCall<InteractionResult>(ENDPOINTS.interactionsCheck, {
    method: 'POST',
    body: { medicine_ids: medicineIds },
  });

  // 🟢 MOCK
  // await delay(1500);
  // const names = medicineIds.map((id) => MOCK_SEARCH_RESULTS.find((m) => m.id === id)?.name ?? id);
  // return {
  //   severity: 'moderate',
  //   medicines: names,
  //   summary: `${names[0]} may increase the risk of stomach irritation when combined with ${names[1] ?? 'the other medicine'}.`,
  //   recommendation: 'Use with caution and take after food. Consult your doctor.',
  //   description:
  //     'Taking these medicines together may increase the risk of gastrointestinal discomfort. The combination can irritate the stomach lining and amplify this effect.',
  //   symptoms: ['Stomach pain', 'Acid reflux', 'Nausea'],
  //   recommendations: ['Take after food', 'Drink plenty of water', 'Consult doctor if symptoms persist'],
  // };
}

/**
 * API 3 — Get Interaction Details
 * Triggered: when user taps "View Details" from results screen
 * Expected:  ~400ms
 * Params:    interaction_id (string)
 */
export async function getInteractionDetails(interactionId: string): Promise<InteractionResult | null> {
  // 🔴 REAL — active
  try {
    return await medicineApiCall<InteractionResult>(ENDPOINTS.interactionDetails(interactionId));
  } catch {
    return null;
  }

  // 🟢 MOCK
  // await delay(400);
  // return {
  //   severity: 'moderate',
  //   medicines: ['Metformin 500mg', 'Aspirin 75mg'],
  //   summary: 'Aspirin may increase the risk of stomach irritation when combined with Metformin.',
  //   recommendation: 'Use with caution and take after food. Consult your doctor.',
  //   description:
  //     'Taking these medicines together may increase the risk of gastrointestinal discomfort. Aspirin can irritate the stomach lining, and combining it with Metformin may amplify this effect.',
  //   symptoms: ['Stomach pain', 'Acid reflux', 'Nausea'],
  //   recommendations: ['Take after food', 'Drink plenty of water', 'Consult doctor if symptoms persist'],
  // };
}

/**
 * API 4 — Save Interaction Report
 * Triggered: when user taps "Save This Check"
 * Expected:  ~300ms
 * Body:      { medicine_ids: string[] }
 */
export async function saveInteractionReport(
  medicineIds: string[],
): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.interactionsSave, {
    method: 'POST',
    body: { medicine_ids: medicineIds },
  });

  // 🟢 MOCK
  // await delay(350);
  // return { success: true, message: 'Interaction report saved' };
}

/**
 * API 5 — Get Interaction History
 * Triggered: when user opens the history modal
 * Expected:  ~400ms
 */
export async function getInteractionHistory(): Promise<InteractionHistoryItem[]> {
  // 🔴 REAL — active
  const raw = await medicineApiCall<any>(ENDPOINTS.interactionsHistory);
  return unwrapList<InteractionHistoryItem>(raw, 'interactions', 'history', 'data', 'results');

  // 🟢 MOCK
  // await delay(400);
  // return MOCK_INTERACTION_HISTORY;
}

/**
 * API 6 — Delete Interaction Report
 * Triggered: when user deletes a history item
 * Expected:  ~300ms
 * Params:    report_id (string)
 */
export async function deleteInteractionReport(reportId: string): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.interactionHistoryDelete(reportId), { method: 'DELETE' });

  // 🟢 MOCK
  // await delay(300);
  // return { success: true, message: 'Report deleted' };
}

/**
 * API 7 — AI Interaction Summary (optional)
 * Triggered: optionally when user requests an AI explanation
 * Expected:  ~1 sec
 * Body:      { medicine_ids: string[] }
 */
export async function getAiInteractionSummary(medicineIds: string[]): Promise<{ summary: string }> {
  // 🔴 REAL — active
  return medicineApiCall(ENDPOINTS.interactionsAiSummary, {
    method: 'POST',
    body: { medicine_ids: medicineIds },
  });

  // 🟢 MOCK
  // await delay(1000);
  // return {
  //   summary:
  //     'Based on the selected medicines, there is a moderate risk of gastrointestinal discomfort. It is advisable to take these medicines after food and monitor for any unusual symptoms. Consult your physician before making any changes.',
  // };
}