/**
 * ============================================================
 * REPORTS API SERVICE  —  reportsApi.ts
 * ============================================================
 * Pattern: REAL-FIRST  (identical to medicineTabApi.ts / Medicinesapi.ts)
 *   • Every function below calls the real backend at
 *     https://healthai.smartncode.com/... via reportsApiCall() / apiFileCall().
 *   • The original 🟢 MOCK body (AsyncStorage / static mock data) is kept
 *     commented directly beneath each 🔴 REAL block as a fallback.
 *
 * TO ROLL BACK TO MOCK (if backend is ever unavailable):
 *   Set USE_MOCK = true below — every function will fall back to its
 *   original AsyncStorage-backed mock behavior.
 * ============================================================
 */

import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { decryptResponse } from '@/utils/encryption';
import { ENDPOINTS } from '@/constants/api';
import { storage } from '@/utils/storage';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';
import type {
  Report,
  ApiAnalyzeResponse,
  LabValue,
  ApiSummary,
  DetectedMedicine,
  ReportCategory,
} from '@/types/Report/reportype';
import { mapApiLabValues, deriveCategory } from '@/types/Report/reportype';

// ─── Toggle ────────────────────────────────────────────────────────────────────
const USE_MOCK = false; // 🔴 REAL active | set true to roll back to 🟢 MOCK fallback
// ──────────────────────────────────────────────────────────────────────────────

// ─── User-scoped storage keys ─────────────────────────────────────────────────
// Keys are scoped to the logged-in user's phone number so reports from
// different users on the same device never mix.
// The phone number is passed in by the caller (useReports hook / upload screen).
// Falls back to 'guest' when no user is signed in (should not normally happen).
export function reportStorageKey(phone: string | null): string {
  const user = phone ? phone.replace(/\D/g, '') : 'guest';
  return `healthai_reports_${user}`;
}
export function reportDetailsStorageKey(phone: string | null): string {
  const user = phone ? phone.replace(/\D/g, '') : 'guest';
  return `healthai_report_details_${user}`;
}

export async function getReportRenames(phone: string | null): Promise<Record<string, string>> {
  try {
    const key = `healthai_report_renames_${phone ? phone.replace(/\D/g, '') : 'guest'}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function renameReport(id: string, newName: string, phone: string | null): Promise<void> {
  try {
    const key = `healthai_report_renames_${phone ? phone.replace(/\D/g, '') : 'guest'}`;
    const renames = await getReportRenames(phone);
    renames[id] = newName.trim();
    await AsyncStorage.setItem(key, JSON.stringify(renames));
  } catch (e) {
    console.error('Failed to save rename', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportListItem {
  id: string;
  title: string;
  reportType: string;         // Short: CBC, Lipid, etc.
  reportTypeFull: string;     // Full name for display
  category: ReportCategory;   // ← NEW: used for filter chips
  date: string;               // Formatted display date
  labName: string;
  fileType: 'PDF' | 'IMAGE';
  healthScore: number;        // 0–100
  healthLabel: string;        // Good / Attention / etc.
  totalValues: number;
  abnormalCount: number;
  borderlineCount: number;
  status: 'good' | 'attention';
  thumbnailUri: string | null;
  fileUri: string | null;       // local file URI saved at upload time — for viewing
  analyzedAt: string;         // ISO date — for sorting
  fileHash?: string;          // ← NEW: hash of name+size+lastModified, for dedup
}

export interface AnalyzeResult {
  reportId: number;
  patientName: string;
  hospitalName: string;
  reportType: string;
  reportTypeFull: string;
  category: ReportCategory;   // ← NEW
  summary: string;            // JSON-stringified ApiSummary
  values: LabValue[];
  healthScore: number;
  healthLabel: string;
  totalValues: number;
  abnormalCount: number;
  detectedMedicines: DetectedMedicine[]; // ← NEW
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_REPORTS: ReportListItem[] = [
  {
    id: '1',
    title: 'Complete Blood Count',
    reportType: 'CBC',
    reportTypeFull: 'Complete Blood Count',
    category: 'CBC',
    date: '14 May 2024',
    labName: 'City Lab',
    fileType: 'PDF',
    healthScore: 85,
    healthLabel: 'Good',
    totalValues: 14,
    abnormalCount: 2,
    borderlineCount: 1,
    status: 'good',
    thumbnailUri: null,
    fileUri: null,
    analyzedAt: new Date('2024-05-14T10:30:00').toISOString(),
  },
  {
    id: '2',
    title: 'Lipid Profile',
    reportType: 'Lipid',
    reportTypeFull: 'Lipid Profile',
    category: 'Lipid',
    date: '12 May 2024',
    labName: 'City Lab',
    fileType: 'PDF',
    healthScore: 72,
    healthLabel: 'Attention',
    totalValues: 8,
    abnormalCount: 3,
    borderlineCount: 1,
    status: 'attention',
    thumbnailUri: null,
    fileUri: null,
    analyzedAt: new Date('2024-05-12T09:00:00').toISOString(),
  },
  {
    id: '3',
    title: 'Thyroid Profile',
    reportType: 'Thyroid',
    reportTypeFull: 'Thyroid Function Test',
    category: 'Thyroid',
    date: '10 May 2024',
    labName: 'City Lab',
    fileType: 'PDF',
    healthScore: 91,
    healthLabel: 'Good',
    totalValues: 5,
    abnormalCount: 0,
    borderlineCount: 0,
    status: 'good',
    thumbnailUri: null,
    fileUri: null,
    analyzedAt: new Date('2024-05-10T11:00:00').toISOString(),
  },
  {
    id: '4',
    title: 'HbA1c',
    reportType: 'HbA1c',
    reportTypeFull: 'Glycated Hemoglobin',
    category: 'Diabetes',
    date: '08 May 2024',
    labName: 'City Lab',
    fileType: 'PDF',
    healthScore: 68,
    healthLabel: 'Moderate Risk',
    totalValues: 3,
    abnormalCount: 1,
    borderlineCount: 1,
    status: 'attention',
    thumbnailUri: null,
    fileUri: null,
    analyzedAt: new Date('2024-05-08T14:00:00').toISOString(),
  },
  {
    id: '5',
    title: 'Vitamin D',
    reportType: 'VitaminD',
    reportTypeFull: 'Vitamin D (25-OH)',
    category: 'Vitamins',
    date: '05 May 2024',
    labName: 'City Lab',
    fileType: 'PDF',
    healthScore: 55,
    healthLabel: 'Low Risk',
    totalValues: 2,
    abnormalCount: 1,
    borderlineCount: 0,
    status: 'attention',
    thumbnailUri: null,
    fileUri: null,
    analyzedAt: new Date('2024-05-05T08:30:00').toISOString(),
  },
];

/** Mock analyze result — mirrors real API shape (ApiAnalyzeResponse) */
const MOCK_ANALYZE_RESPONSE: ApiAnalyzeResponse = {
  success: true,
  report_id: 999,
  report_type: 'CBC',
  report_type_full: 'Complete Blood Count',
  summary: {
    overall_health: 'Your blood report is overall good.',
    ai_summary:
      'Hemoglobin and RBC count are normal. Slightly low Vitamin D and borderline high LDL cholesterol.',
    health_score: '85/100',
    condition_severity: 'Good',
    condition_color: '#16A34A',
    patient_friendly_explanation:
      'Your blood report looks mostly good! A couple of values are slightly off, but nothing alarming.',
    is_emergency: false,
    important_risks: ['Borderline high LDL cholesterol', 'Slightly low Vitamin D'],
    symptoms_patient_may_feel: ['Mild fatigue', 'Weak bones (if Vitamin D stays low)'],
    what_patient_should_do_next: [
      'Take Vitamin D rich foods',
      'Regular sunlight exposure',
      'Reduce saturated fats',
      'Regular exercise',
    ],
    recommended_diet: ['Leafy greens', 'Eggs', 'Fatty fish', 'Fortified milk'],
    foods_to_avoid: ['Fried foods', 'Processed meats', 'Trans fats'],
    recommended_fruits: ['Oranges', 'Papaya', 'Kiwi'],
    recommended_juices: ['Orange juice', 'Carrot juice'],
    exercise_recommendations: ['30 min brisk walk daily', 'Avoid sedentary lifestyle'],
    water_intake: '2.5 litres per day',
    doctor_consultation_needed: 'Visit a physician within 2 weeks for Vitamin D follow-up.',
    next_tests_recommended: ['Repeat CBC in 3 months', 'Vitamin D retest in 6 weeks'],
    abnormal_findings: ['LDL slightly high', 'Vitamin D slightly low'],
    recommendations: ['Sunlight exposure', 'Reduce saturated fat intake'],
    general_medicine_guidance: [
      'Vitamin D3 supplements (1000–2000 IU daily)',
      'Omega-3 fatty acids for LDL management',
    ],
    // ← NEW: detected medicines
    detected_medicines: [
      { name: 'Vitamin D3', reason: 'Vitamin D level is low (18 ng/mL)', type: 'recommended' },
      { name: 'Omega-3', reason: 'LDL cholesterol is borderline high', type: 'recommended' },
      { name: 'Rosuvastatin', reason: 'Mentioned for LDL management — consult doctor', type: 'mentioned' },
    ],
  } as ApiSummary,
  data: [
    {
      'Patient Name': 'John Doe',
      'Hospital Name': 'City Lab',
      'Test Name': 'Hemoglobin',
      'Value': '14.2',
      'Units': 'g/dL',
      'Normal Range': '13.5 – 17.5',
      'Status': 'Normal',
      'Simple Meaning': 'Your blood carries oxygen well.',
      'Symptoms': [],
      'Recommended Foods': ['Spinach', 'Red meat', 'Lentils'],
      'Foods To Avoid': [],
    },
    {
      'Patient Name': 'John Doe',
      'Hospital Name': 'City Lab',
      'Test Name': 'LDL Cholesterol',
      'Value': '138',
      'Units': 'mg/dL',
      'Normal Range': '< 130',
      'Status': 'High',
      'Possible Disease': 'Hypercholesterolemia',
      'Simple Meaning': 'Bad cholesterol is slightly elevated.',
      'Symptoms': ['No visible symptoms now', 'Long-term heart risk'],
      'Recommended Foods': ['Oats', 'Avocado', 'Nuts'],
      'Foods To Avoid': ['Butter', 'Fried snacks', 'Red meat'],
    },
    {
      'Patient Name': 'John Doe',
      'Hospital Name': 'City Lab',
      'Test Name': 'Vitamin D',
      'Value': '18',
      'Units': 'ng/mL',
      'Normal Range': '30 – 100',
      'Status': 'Low',
      'Possible Disease': 'Vitamin D Deficiency',
      'Simple Meaning': 'Your Vitamin D is low. You need more sunlight and supplements.',
      'Symptoms': ['Fatigue', 'Bone pain', 'Muscle weakness'],
      'Recommended Foods': ['Fatty fish', 'Egg yolk', 'Fortified milk'],
      'Foods To Avoid': [],
    },
    {
      'Patient Name': 'John Doe',
      'Hospital Name': 'City Lab',
      'Test Name': 'RBC Count',
      'Value': '5.1',
      'Units': 'M/μL',
      'Normal Range': '4.5 – 5.9',
      'Status': 'Normal',
      'Simple Meaning': 'Red blood cells are in good range.',
      'Symptoms': [],
      'Recommended Foods': [],
      'Foods To Avoid': [],
    },
    {
      'Patient Name': 'John Doe',
      'Hospital Name': 'City Lab',
      'Test Name': 'Platelet Count',
      'Value': '245000',
      'Units': '/μL',
      'Normal Range': '150000 – 400000',
      'Status': 'Normal',
      'Simple Meaning': 'Platelets are normal, good clotting ability.',
      'Symptoms': [],
      'Recommended Foods': [],
      'Foods To Avoid': [],
    },
  ] as any,
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function loadStoredReports(phone: string | null): Promise<ReportListItem[]> {
  try {
    const raw = await AsyncStorage.getItem(reportStorageKey(phone));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveReports(reports: ReportListItem[], phone: string | null): Promise<void> {
  try {
    await AsyncStorage.setItem(reportStorageKey(phone), JSON.stringify(reports));
  } catch (e) {
    console.warn('[reportsApi] AsyncStorage save failed', e);
  }
}

// ─── Detail storage (full AnalyzeResult per report id) ────────────────────────
async function loadStoredDetails(phone: string | null): Promise<Record<string, AnalyzeResult>> {
  try {
    const raw = await AsyncStorage.getItem(reportDetailsStorageKey(phone));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveDetail(id: string, detail: AnalyzeResult, phone: string | null): Promise<void> {
  try {
    const all = await loadStoredDetails(phone);
    all[id] = detail;
    await AsyncStorage.setItem(reportDetailsStorageKey(phone), JSON.stringify(all));
  } catch (e) {
    console.warn('[reportsApi] AsyncStorage detail save failed', e);
  }
}

async function deleteDetail(id: string, phone: string | null): Promise<void> {
  try {
    const all = await loadStoredDetails(phone);
    delete all[id];
    await AsyncStorage.setItem(reportDetailsStorageKey(phone), JSON.stringify(all));
  } catch (e) {
    console.warn('[reportsApi] AsyncStorage detail delete failed', e);
  }
}

/**
 * Simple, fast, dependency-free string hash (djb2).
 * Used to fingerprint an uploaded file by name + size + lastModified date,
 * so re-uploading the exact same file doesn't create a duplicate entry.
 */
function hashFileMeta(name: string, size?: number, modifiedAt?: number | string): string {
  const input = `${name}|${size ?? 0}|${modifiedAt ?? 0}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & 0xffffffff; // keep 32-bit
  }
  return `f_${(hash >>> 0).toString(36)}`;
}

function scoreToLabel(score: number): string {
  if (score >= 85) return 'Good';
  if (score >= 70) return 'Moderate Risk';
  if (score >= 50) return 'Low Risk';
  return 'High Risk';
}

function parseHealthScore(raw?: ApiSummary | string): number {
  if (!raw) return 0;
  const summary = typeof raw === 'string' ? (() => { try { return JSON.parse(raw) as ApiSummary; } catch { return null; } })() : raw;
  if (!summary?.health_score) return 0;
  if (typeof summary.health_score === 'number') return summary.health_score;
  const n = parseInt(String(summary.health_score).split('/')[0]);
  return isNaN(n) ? 0 : n;
}

function extractDetectedMedicines(summary?: ApiSummary | string): DetectedMedicine[] {
  if (!summary) return [];
  const s = typeof summary === 'string' ? (() => { try { return JSON.parse(summary) as ApiSummary; } catch { return null; } })() : summary;
  return s?.detected_medicines ?? [];
}

// ─── Shared real-API JSON caller (GET/DELETE) — mirrors medicineApiCall ──────
async function reportsApiCall<T = any>(
  url: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE' } = {},
): Promise<T> {
  const { method = 'GET' } = options;
  const token = await storage.get<string>('token');

  console.log('[reportsApi] REQUEST', method, url);

  let response: Response;
  try {
    // 20s ceiling — same reasoning as Medicineapiclient.ts: list/detail/delete
    // calls should never legitimately take this long, and without a timeout
    // here a hung request holds a connection slot and queues every other
    // call to the same host behind it.
    response = await fetchWithTimeout(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (networkErr: any) {
    console.log('[reportsApi] NETWORK ERROR', networkErr?.message || networkErr);
    throw new Error(networkErr?.message || 'Network request failed');
  }

  const rawText = await response.text();
  console.log('[reportsApi] RESPONSE', response.status, rawText);

  let rawData: any;
  try {
    rawData = rawText ? JSON.parse(rawText) : {};
  } catch {
    const snippet = rawText?.slice(0, 200) || '(empty response)';
    throw new Error(`Server returned non-JSON response (status ${response.status}): ${snippet}`);
  }

  if (rawData?.iv && rawData?.data && !Array.isArray(rawData.data)) {
    const decrypted = decryptResponse(rawData);
    console.log('=== [reportsApi] DECRYPTED ===');
    console.log(JSON.stringify(decrypted, null, 2));
    console.log('===============================');
    if (!response.ok) throw new Error(decrypted?.message || decrypted?.detail || 'Request failed');
    return decrypted as T;
  }

  if (!response.ok) throw new Error(rawData?.message || rawData?.detail || 'Request failed');
  return rawData as T;
}

// Real API caller
async function apiFileCall(url: string, formData: FormData, externalSignal?: AbortSignal): Promise<ApiAnalyzeResponse> {
  console.log('[reportsApi] POST', url);
  // 🔴 REAL: attach auth token so the backend can identify the user
  const token = await storage.get<string>('token');
  const t0 = Date.now();

  // Hard timeout so a truly hung backend fails loudly instead of leaving the
  // "Analyzing Report" overlay spinning forever with no signal.
  // Raised from 60s → 150s: OCR + AI analysis of an uploaded photo/PDF can
  // legitimately take well over a minute, especially for larger images —
  // the previous 60s ceiling was the *client* giving up while the backend
  // may still have been genuinely processing (no error came back, the
  // request just went silent until this code aborted it itself).
  const TIMEOUT_MS = 150000;
  const controller = new AbortController();

  // If the caller passed an external signal (e.g. user tapped "Stop"),
  // abort our internal controller the moment it fires.
  if (externalSignal) {
    if (externalSignal.aborted) {
      // Already cancelled before the call even started
      throw new Error('Analysis cancelled');
    }
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const heartbeat = setInterval(() => {
    console.log(`[reportsApi] ⏳ still waiting on analyze-report… ${Math.round((Date.now() - t0) / 1000)}s elapsed`);
  }, 5000);
  const timeoutId = setTimeout(() => {
    console.log(`[reportsApi] ⏰ TIMEOUT after ${TIMEOUT_MS}ms — aborting analyze-report request`);
    controller.abort();
  }, TIMEOUT_MS);


  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    });
  } catch (networkErr: any) {
    clearInterval(heartbeat);
    clearTimeout(timeoutId);
    if (networkErr?.name === 'AbortError') {
      if (externalSignal?.aborted) {
        console.log(`[reportsApi] ❌ CANCELLED by user after ${Date.now() - t0}ms`, url);
        throw new Error('Analysis cancelled');
      }
      console.log(`[reportsApi] ❌ ABORTED (timeout) after ${Date.now() - t0}ms`, url);
      throw new Error(`Analysis timed out after ${TIMEOUT_MS / 1000}s — the server may be taking too long to process this file, or the connection dropped.`);
    }
    console.log('[reportsApi] NETWORK ERROR', url, networkErr?.message || networkErr);
    throw new Error(networkErr?.message || 'Network request failed');
  }
  clearInterval(heartbeat);
  clearTimeout(timeoutId);
  const t1 = Date.now();
  console.log(`[reportsApi] ⏱ network round-trip: ${t1 - t0}ms`);

  const rawText = await response.text();
  console.log('[reportsApi] RESPONSE', response.status, url, '→', rawText.slice(0, 300));

  let rawData: any;
  try {
    rawData = rawText ? JSON.parse(rawText) : {};
  } catch {
    const snippet = rawText?.slice(0, 200) || '(empty response)';
    throw new Error(`Server returned non-JSON response (status ${response.status}): ${snippet}`);
  }
  const t2 = Date.now();
  console.log(`[reportsApi] ⏱ read+JSON.parse: ${t2 - t1}ms`);

  if (rawData?.iv && rawData?.data) {
    const decrypted = decryptResponse(rawData);
    const t3 = Date.now();
    console.log(`[reportsApi] ⏱ decrypt: ${t3 - t2}ms  |  ⏱ TOTAL: ${t3 - t0}ms`);
    console.log('=== [reportsApi] DECRYPTED ===');
    console.log(JSON.stringify(decrypted, null, 2));
    console.log('===============================');
    if (!response.ok) throw new Error(decrypted?.error || decrypted?.message || 'Request failed');
    return decrypted as ApiAnalyzeResponse;
  }

  if (!response.ok) throw new Error(rawData?.error || rawData?.message || rawData?.detail || 'Request failed');
  return rawData as ApiAnalyzeResponse;
}

function apiToAnalyzeResult(result: ApiAnalyzeResponse): AnalyzeResult {
  const summaryStr =
    typeof result.summary === 'string'
      ? result.summary
      : result.summary
        ? JSON.stringify(result.summary)
        : '{}';

  const values = mapApiLabValues(result.data);
  const abnormalCount = values.filter(v => v.status === 'high' || v.status === 'low').length;
  const healthScore = parseHealthScore(result.summary);
  const category = deriveCategory(result.report_type ?? '');

  return {
    reportId: result.report_id,
    patientName: result.data[0]?.['Patient Name'] ?? '',
    hospitalName: result.data[0]?.['Hospital Name'] ?? '',
    reportType: result.report_type ?? '',
    reportTypeFull: result.report_type_full ?? '',
    category,
    summary: summaryStr,
    values,
    healthScore,
    healthLabel: scoreToLabel(healthScore),
    totalValues: values.length,
    abnormalCount,
    detectedMedicines: extractDetectedMedicines(result.summary),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const reportsApi = {

  /**
   * LIST REPORTS
   * ─────────────
   * MOCK  → returns MOCK_REPORTS + any locally stored (analyzed) reports
   * REAL  → GET /reports
   */
  list: async (phone: string | null = null): Promise<ReportListItem[]> => {
    if (USE_MOCK) {
      console.log('[reportsApi.list] 🟢 MOCK — user:', phone ?? 'guest');
      const stored = await loadStoredReports(phone);
      const storedIds = new Set(stored.map(r => r.id));
      const base = MOCK_REPORTS.filter(r => !storedIds.has(r.id));
      return [...stored, ...base].sort(
        (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
      );
    }

    // 🔴 REAL — active
    try {
      const data: any = await reportsApiCall<any>(ENDPOINTS.listReports);
      // FIX: backend wraps the list in { success, reports, total } — it is
      // NOT a bare array. The old code did `Array.isArray(data) ? data : []`,
      // which was always false for this shape, silently returning an empty
      // list every time (no error, no log — just nothing rendered in the UI).
      const renames = await getReportRenames(phone);
      
      const rawList = data?.data?.reports || data?.reports || data;
      const list = Array.isArray(rawList) ? rawList : [];

      return list.map((r: any): ReportListItem => {
        const idStr = String(r.id ?? r.report_id);
        return {
          id: idStr,
          title: renames[idStr] || (r.title ?? r.report_type_full ?? r.report_type ?? 'Report'),
          reportType: r.report_type ?? r.reportType ?? '',
          reportTypeFull: r.report_type_full ?? r.reportTypeFull ?? r.report_type ?? '',
          category: deriveCategory(r.report_type ?? r.reportType ?? ''),
          date: r.date ?? (r.analyzed_at ? new Date(r.analyzed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
          labName: r.lab_name ?? r.hospital_name ?? r.labName ?? 'Lab',
          fileType: (r.file_type ?? r.fileType ?? 'PDF') as 'PDF' | 'IMAGE',
          healthScore: r.health_score ?? r.healthScore ?? 0,
          healthLabel: r.health_label ?? r.healthLabel ?? scoreToLabel(r.health_score ?? r.healthScore ?? 0),
          totalValues: r.total_values ?? r.totalValues ?? 0,
          abnormalCount: r.abnormal_count ?? r.abnormalCount ?? 0,
          borderlineCount: r.borderline_count ?? r.borderlineCount ?? 0,
          status: (r.status ?? ((r.abnormal_count ?? 0) > 2 ? 'attention' : 'good')) as 'good' | 'attention',
          thumbnailUri: r.thumbnail_uri ?? r.thumbnailUri ?? null,
          fileUri: r.file_uri ?? r.fileUri ?? null,
          analyzedAt: r.analyzed_at ?? r.analyzedAt ?? new Date().toISOString(),
        };
      }).sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
    } catch (e) {
      console.log('[reportsApi.list] 🔴 REAL call failed:', e);
      // Surface as an empty list rather than throwing — useReports() already
      // renders a friendly EmptyState, and a thrown error here would leave
      // the screen stuck on its loading spinner forever (catch in the hook
      // logs but never sets state). Empty + logged error is the safer default.
      return [];
    }

    // 🟢 MOCK
    // console.log('[reportsApi.list] 🟢 MOCK — user:', phone ?? 'guest');
    // const stored = await loadStoredReports(phone);
    // const storedIds = new Set(stored.map(r => r.id));
    // const base = MOCK_REPORTS.filter(r => !storedIds.has(r.id));
    // return [...stored, ...base].sort(
    //   (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
    // );
  },

  /**
   * ANALYZE REPORT
   * ───────────────
   * MOCK  → 1.5s delay + MOCK_ANALYZE_RESPONSE + saves to AsyncStorage list
   * REAL  → POST /analyze-report  (multipart/form-data, field name: "file")
   *
   * fileMeta: used to compute a hash (name + size + lastModified) so that
   * re-uploading the exact same file is detected and skipped (no duplicate
   * entry is created — the existing report is returned instead).
   */
  analyze: async (
    formData: FormData,
    fileName?: string,
    fileMeta?: { size?: number; lastModified?: number | string; fileUri?: string },
    phone: string | null = null,
    signal?: AbortSignal
  ): Promise<AnalyzeResult & { duplicate?: boolean }> => {
    if (USE_MOCK) {
      console.log('[reportsApi.analyze] 🟢 MOCK — user:', phone ?? 'guest');

      // ── Duplicate detection ──────────────────────────────────────────────
      const fileHash = fileName
        ? hashFileMeta(fileName, fileMeta?.size, fileMeta?.lastModified)
        : undefined;

      if (fileHash) {
        const stored = await loadStoredReports(phone);
        const existing = stored.find(r => r.fileHash === fileHash);
        if (existing) {
          console.log('[reportsApi.analyze] 🟡 Duplicate file detected — skipping save');
          const details = await loadStoredDetails(phone);
          const existingDetail = details[existing.id];
          if (existingDetail) {
            return { ...existingDetail, duplicate: true };
          }
          // Fall back: no stored detail (shouldn't normally happen) — re-analyze
          // but still mark as duplicate so caller can warn the user.
          const fallback = apiToAnalyzeResult(MOCK_ANALYZE_RESPONSE);
          return { ...fallback, duplicate: true };
        }
      }

      await new Promise(res => setTimeout(res, 1500));

      const result = apiToAnalyzeResult(MOCK_ANALYZE_RESPONSE);

      // Persist to AsyncStorage so it shows in list
      const stored = await loadStoredReports(phone);
      const newId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const newItem: ReportListItem = {
        id: newId,
        title: (fileName?.replace(/\.[^.]+$/, '') ?? result.reportTypeFull) || 'Report',
        reportType: result.reportType,
        reportTypeFull: result.reportTypeFull,
        category: result.category,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        labName: result.hospitalName || 'Lab',
        fileType: 'PDF',
        healthScore: result.healthScore,
        healthLabel: result.healthLabel,
        totalValues: result.totalValues,
        abnormalCount: result.abnormalCount,
        borderlineCount: 0,
        status: result.abnormalCount > 2 ? 'attention' : 'good',
        thumbnailUri: null,
        fileUri: fileMeta?.fileUri ?? null,
        analyzedAt: new Date().toISOString(),
        fileHash,
      };
      await saveReports([newItem, ...stored], phone);

      // Persist full result (values, summary, medicines) keyed by id
      await saveDetail(newId, { ...result, reportId: result.reportId }, phone);

      return { ...result, reportId: Number(newId.replace(/\D/g, '')) || result.reportId };
    }

    // 🔴 REAL
    const apiResult = await apiFileCall(ENDPOINTS.analyzeReport, formData, signal);
    return apiToAnalyzeResult(apiResult);
  },

  /**
   * GET REPORT DETAIL
   * ──────────────────
   * Returns the list item merged with the full AnalyzeResult (values,
   * summary, detected medicines) if it was stored at analyze-time.
   */
  getById: async (id: string, phone: string | null = null): Promise<(ReportListItem & Partial<AnalyzeResult>) | null> => {
    if (USE_MOCK) {
      const all = await reportsApi.list(phone);
      const item = all.find(r => r.id === id) ?? null;
      if (!item) return null;

      const details = await loadStoredDetails(phone);
      const detail = details[id];
      if (detail) {
        return { ...item, ...detail, id: item.id };
      }
      return item;
    }

    // 🔴 REAL — active
    // Wrapped in an outer try/catch: report-detail.tsx calls this with a bare
    // .then() and no .catch(), so an uncaught rejection here would leave that
    // screen stuck on its loading spinner forever. This function must resolve
    // to either a report or null, never reject.
    try {
      // Locally-analyzed reports (just uploaded this session) are cached in
      // AsyncStorage detail store first — avoids an extra round trip and works
      // even if the backend detail endpoint hasn't synced yet.
      const cachedDetails = await loadStoredDetails(phone);
      const cached = cachedDetails[id];

      let item: ReportListItem | null = null;
      try {
        const apiResp = await reportsApiCall<any>(ENDPOINTS.reportDetail(id));

        // ── Shape fix ────────────────────────────────────────────────────────
        // The detail endpoint returns  { success, data: { id, title, values,
        // summary, ... } }  — the actual report object lives inside
        // apiResp.data, NOT at the top level.  Previously the code was reading
        // apiResp.id / apiResp.title / etc., which are all undefined, so the
        // card rendered blank fields and the "View Full Analysis" button had
        // nothing to pass to /analysis.
        // We also need `values` (not `data`) for the lab-value array, and the
        // healthScore comes from the summary string instead of a top-level field.
        const raw = (apiResp?.data && typeof apiResp.data === 'object' && !Array.isArray(apiResp.data))
          ? apiResp.data  // { success, data: { ... } }  ← real shape
          : apiResp;      // bare object fallback (shouldn't normally happen)

        // Parse health score from the summary object/string when there is no
        // dedicated top-level health_score field (real API puts it in summary).
        const parsedHealthScore = parseHealthScore(raw.summary ?? raw.health_score);
        const finalHealthScore = raw.health_score ?? raw.healthScore ?? parsedHealthScore ?? 0;

        // The API returns `values` as the lab-value array; fall back to `data`
        // for any legacy shape that still uses the old key name.
        const labValuesRaw: any[] = Array.isArray(raw.values)
          ? raw.values
          : Array.isArray(raw.data)
            ? raw.data
            : [];

        // Derive abnormal/borderline counts from the lab values array when the
        // top-level count fields are missing or zero (real API omits them).
        const mappedValues = mapApiLabValues(labValuesRaw);
        const derivedAbnormal = mappedValues.filter(v => v.status === 'high' || v.status === 'low').length;
        const derivedBorderline = 0; // API doesn't return borderline separately yet
        const abnormalCount = raw.abnormal_count ?? raw.abnormalCount ?? derivedAbnormal;
        const borderlineCount = raw.borderline_count ?? raw.borderlineCount ?? derivedBorderline;

        // Parse date — API sends ISO string like "2026-06-18T11:22:15.096471+00:00"
        const rawDate = raw.date ?? raw.analyzed_at ?? raw.analyzedAt;
        const displayDate = rawDate
          ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '';

        // Thumbnail / file URI — backend stores a relative path; keep as-is
        // (the app renders it via a full base URL elsewhere).
        const thumbnailUri = raw.thumbnail_uri ?? raw.thumbnailUri ?? raw.thumbnailUri ?? null;

        item = {
          id: String(raw.id ?? raw.report_id ?? id),
          title: raw.title ?? raw.report_type_full ?? raw.reportTypeFull ?? raw.report_type ?? 'Report',
          reportType: raw.reportType ?? raw.report_type ?? '',
          reportTypeFull: raw.reportTypeFull ?? raw.report_type_full ?? raw.report_type ?? '',
          category: deriveCategory(raw.reportType ?? raw.report_type ?? ''),
          date: displayDate,
          labName: raw.labName ?? raw.lab_name ?? raw.hospitalName ?? raw.hospital_name ?? 'Unknown',
          fileType: (raw.fileType ?? raw.file_type ?? 'IMAGE') as 'PDF' | 'IMAGE',
          healthScore: finalHealthScore,
          healthLabel: raw.healthLabel ?? raw.health_label ?? scoreToLabel(finalHealthScore),
          totalValues: raw.totalValues ?? raw.total_values ?? mappedValues.length,
          abnormalCount,
          borderlineCount,
          status: (raw.status ?? (abnormalCount > 2 ? 'attention' : 'good')) as 'good' | 'attention',
          thumbnailUri,
          fileUri: raw.fileUri ?? raw.file_uri ?? null,
          analyzedAt: rawDate ?? new Date().toISOString(),
        };

        // Merge full analyze data (values + summary + medicines) when present.
        if (labValuesRaw.length > 0 || raw.summary) {
          const summaryStr = typeof raw.summary === 'string'
            ? raw.summary
            : raw.summary ? JSON.stringify(raw.summary) : '{}';

          const analyzeResult: AnalyzeResult = {
            reportId: Number(raw.id ?? raw.report_id) || 0,
            patientName: raw.patientName ?? raw.patient_name ?? labValuesRaw[0]?.['Patient Name'] ?? 'Unknown',
            hospitalName: raw.hospitalName ?? raw.hospital_name ?? labValuesRaw[0]?.['Hospital Name'] ?? 'Unknown',
            reportType: raw.reportType ?? raw.report_type ?? '',
            reportTypeFull: raw.reportTypeFull ?? raw.report_type_full ?? '',
            category: deriveCategory(raw.reportType ?? raw.report_type ?? ''),
            summary: summaryStr,
            values: mappedValues,
            healthScore: finalHealthScore,
            healthLabel: scoreToLabel(finalHealthScore),
            totalValues: mappedValues.length,
            abnormalCount,
            detectedMedicines: extractDetectedMedicines(raw.summary),
          };
          console.log('[reportsApi.getById] ✅ mapped report:', item.title, '| values:', mappedValues.length, '| score:', finalHealthScore);
          return { ...item, ...analyzeResult, id: item.id };
        }
      } catch (e) {
        console.log('[reportsApi.getById] detail endpoint failed, falling back to list + cache', e);
      }

      // Fall back to list() (covers case where dedicated detail endpoint 404s)
      if (!item) {
        const all = await reportsApi.list(phone);
        item = all.find(r => r.id === id) ?? null;
        if (!item) return null;
      }

      if (cached) {
        return { ...item, ...cached, id: item.id };
      }
      return item;
    } catch (e) {
      console.log('[reportsApi.getById] 🔴 unexpected error, returning null', e);
      return null;
    }

    // 🟢 MOCK
    // const all = await reportsApi.list(phone);
    // const item = all.find(r => r.id === id) ?? null;
    // if (!item) return null;
    // const details = await loadStoredDetails(phone);
    // const detail = details[id];
    // if (detail) {
    //   return { ...item, ...detail, id: item.id };
    // }
    // return item;
  },

  /**
   * DELETE REPORT
   * ──────────────
   */
  delete: async (id: string, phone: string | null = null): Promise<void> => {
    if (USE_MOCK) {
      const stored = await loadStoredReports(phone);
      await saveReports(stored.filter(r => r.id !== id), phone);
      await deleteDetail(id, phone);
      return;
    }

    // 🔴 REAL — active
    try {
      await reportsApiCall(ENDPOINTS.reportDelete(id), { method: 'DELETE' });
    } finally {
      // Always clear any locally-cached copy (e.g. from this session's analyze())
      // regardless of whether the backend call succeeded, so the UI doesn't
      // keep showing a stale entry the user already asked to remove.
      const stored = await loadStoredReports(phone);
      await saveReports(stored.filter(r => r.id !== id), phone);
      await deleteDetail(id, phone);
    }

    // 🟢 MOCK
    // const stored = await loadStoredReports(phone);
    // await saveReports(stored.filter(r => r.id !== id), phone);
    // await deleteDetail(id, phone);
  },

  /**
   * HEALTH SCORECARD
   * ─────────────────
   */
  getScorecard: async () => {
    if (USE_MOCK) {
      const all = await reportsApi.list();
      const latest = all[0];
      return {
        overallScore: latest?.healthScore ?? 85,
        scoreLabel: latest?.healthLabel ?? 'Good',
        riskIndicators: [
          { label: 'Diabetes', level: 'low' as const, disease: 'Diabetes' },
          { label: 'Heart Disease', level: 'low' as const, disease: 'Heart Disease' },
          { label: 'Vitamin D Deficiency', level: 'moderate' as const, disease: 'Vitamin D Deficiency' },
        ],
        trend: 'stable' as const,
        lastUpdated: latest?.date ?? 'Recently',
        totalReports: all.length,
        aiSummary: '',
        averageMetrics: [] as any[],
      };
    }

    // 🔴 REAL — active
    // scorecard.tsx calls this with a bare .then() and no .catch(), so this
    // must resolve to a value, never reject.
    try {
      try {
        const raw = await reportsApiCall<any>(ENDPOINTS.scorecardReport);
        const payload = (raw?.data && typeof raw.data === 'object') ? raw.data : raw;

        const overallScore = payload.health_score ?? payload.overall_score ?? payload.overallScore ?? payload.healthScore ?? 0;
        const scoreLabel = payload.health_status ?? payload.score_label ?? payload.scoreLabel ?? payload.healthLabel ?? scoreToLabel(overallScore);
        const totalReports = payload.total_reports ?? payload.totalReports ?? payload.totalReports ?? 0;
        const trend = payload.trend ?? 'stable';
        const lastUpdated = payload.last_updated ?? payload.lastUpdated ?? 'Recently';

        return {
          overallScore,
          scoreLabel,
          riskIndicators: (payload.risk_indicators ?? payload.riskIndicators ?? []).map((r: any) => ({
            label: r.label,
            level: r.level as 'low' | 'moderate' | 'high',
            disease: r.disease ?? r.label,
          })),
          trend: trend as 'improving' | 'stable' | 'declining',
          lastUpdated,
          totalReports,
          aiSummary: payload.ai_summary ?? '',
          averageMetrics: payload.average_metrics ?? [],
        };
      } catch (e) {
        console.log('[reportsApi.getScorecard] backend call failed, falling back to derived scorecard', e);
        // Backend scorecard endpoint unavailable — derive a best-effort
        // scorecard from the real reports list instead of failing outright.
        const all = await reportsApi.list();
        const latest = all[0];
        return {
          overallScore: latest?.healthScore ?? 0,
          scoreLabel: latest?.healthLabel ?? 'N/A',
          riskIndicators: [],
          trend: 'stable' as const,
          lastUpdated: latest?.date ?? 'Recently',
          totalReports: all.length,
          aiSummary: '',
          averageMetrics: [] as any[],
        };
      }
    } catch (e) {
      console.log('[reportsApi.getScorecard] 🔴 unexpected error, returning null', e);
      return null;
    }

    // 🟢 MOCK
    // const all = await reportsApi.list();
    // const latest = all[0];
    // return {
    //   overallScore:    latest?.healthScore ?? 85,
    //   scoreLabel:      latest?.healthLabel ?? 'Good',
    //   riskIndicators:  [
    //     { label: 'Diabetes',          level: 'low'      as const, disease: 'Diabetes' },
    //     { label: 'Heart Disease',     level: 'low'      as const, disease: 'Heart Disease' },
    //     { label: 'Vitamin D Deficiency', level: 'moderate' as const, disease: 'Vitamin D Deficiency' },
    //   ],
    //   trend:           'stable' as const,
    //   lastUpdated:     latest?.date ?? 'Recently',
    //   totalReports:    all.length,
    // };
  },
};