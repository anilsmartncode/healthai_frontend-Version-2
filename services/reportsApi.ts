/**
 * ============================================================
 * REPORTS API SERVICE  —  reportsApi.ts
 * ============================================================
 * Pattern: MOCK-FIRST  (identical to medicinesApi.ts / familyApi.ts)
 *
 * HOW TO SWITCH TO REAL API:
 *   1. Set USE_MOCK = false
 *   2. Ensure ENDPOINTS.listReports and ENDPOINTS.analyzeReport are set in constants/api.ts
 *   3. Backend: handle multipart/form-data upload for analyze
 *
 * ============================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptResponse } from '@/utils/encryption';
import { ENDPOINTS } from '@/constants/api';
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
const USE_MOCK = true; // 🟢 MOCK active | 🔴 set false when backend is ready
// ──────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'healthai_reports';
const DETAILS_STORAGE_KEY = 'healthai_report_details';

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

async function loadStoredReports(): Promise<ReportListItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveReports(reports: ReportListItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.warn('[reportsApi] AsyncStorage save failed', e);
  }
}

// ─── Detail storage (full AnalyzeResult per report id) ────────────────────────
async function loadStoredDetails(): Promise<Record<string, AnalyzeResult>> {
  try {
    const raw = await AsyncStorage.getItem(DETAILS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveDetail(id: string, detail: AnalyzeResult): Promise<void> {
  try {
    const all = await loadStoredDetails();
    all[id] = detail;
    await AsyncStorage.setItem(DETAILS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('[reportsApi] AsyncStorage detail save failed', e);
  }
}

async function deleteDetail(id: string): Promise<void> {
  try {
    const all = await loadStoredDetails();
    delete all[id];
    await AsyncStorage.setItem(DETAILS_STORAGE_KEY, JSON.stringify(all));
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
  const n = parseInt(summary.health_score.split('/')[0]);
  return isNaN(n) ? 0 : n;
}

function extractDetectedMedicines(summary?: ApiSummary | string): DetectedMedicine[] {
  if (!summary) return [];
  const s = typeof summary === 'string' ? (() => { try { return JSON.parse(summary) as ApiSummary; } catch { return null; } })() : summary;
  return s?.detected_medicines ?? [];
}

// Real API caller
async function apiFileCall(url: string, formData: FormData): Promise<ApiAnalyzeResponse> {
  console.log('[reportsApi] POST', url);
  const response = await fetch(url, { method: 'POST', body: formData });
  const rawData = await response.json();

  if (rawData?.iv && rawData?.data) {
    const decrypted = decryptResponse(rawData);
    if (!response.ok) throw new Error(decrypted?.message || 'Request failed');
    return decrypted as ApiAnalyzeResponse;
  }

  if (!response.ok) throw new Error(rawData?.message || rawData?.detail || 'Request failed');
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
    reportId:    result.report_id,
    patientName: result.data[0]?.['Patient Name'] ?? '',
    hospitalName: result.data[0]?.['Hospital Name'] ?? '',
    reportType:  result.report_type ?? '',
    reportTypeFull: result.report_type_full ?? '',
    category,
    summary:     summaryStr,
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
  list: async (): Promise<ReportListItem[]> => {
    if (USE_MOCK) {
      console.log('[reportsApi.list] 🟢 MOCK');
      const stored = await loadStoredReports();
      const storedIds = new Set(stored.map(r => r.id));
      const base = MOCK_REPORTS.filter(r => !storedIds.has(r.id));
      return [...stored, ...base].sort(
        (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
      );
    }

    // 🔴 REAL — uncomment when backend ready
    // const res = await fetch(ENDPOINTS.listReports, {
    //   headers: { Authorization: `Bearer ${await getToken()}` }
    // });
    // const data = await res.json();
    // return data.map((r: any): ReportListItem => ({
    //   id:            String(r.id),
    //   title:         r.title,
    //   reportType:    r.report_type,
    //   reportTypeFull: r.report_type_full,
    //   category:      deriveCategory(r.report_type),
    //   date:          r.date,
    //   labName:       r.lab_name,
    //   fileType:      r.file_type,
    //   healthScore:   r.health_score,
    //   healthLabel:   scoreToLabel(r.health_score),
    //   totalValues:   r.total_values,
    //   abnormalCount: r.abnormal_count,
    //   borderlineCount: r.borderline_count,
    //   status:        r.status,
    //   thumbnailUri:  r.thumbnail_uri ?? null,
    //   analyzedAt:    r.analyzed_at,
    // }));
    return [];
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
    fileMeta?: { size?: number; lastModified?: number | string }
  ): Promise<AnalyzeResult & { duplicate?: boolean }> => {
    if (USE_MOCK) {
      console.log('[reportsApi.analyze] 🟢 MOCK — simulating 1.5s delay');

      // ── Duplicate detection ──────────────────────────────────────────────
      const fileHash = fileName
        ? hashFileMeta(fileName, fileMeta?.size, fileMeta?.lastModified)
        : undefined;

      if (fileHash) {
        const stored = await loadStoredReports();
        const existing = stored.find(r => r.fileHash === fileHash);
        if (existing) {
          console.log('[reportsApi.analyze] 🟡 Duplicate file detected — skipping save');
          const details = await loadStoredDetails();
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
      const stored = await loadStoredReports();
      const newId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const newItem: ReportListItem = {
        id:            newId,
        title:         (fileName?.replace(/\.[^.]+$/, '') ?? result.reportTypeFull) || 'Report',
        reportType:    result.reportType,
        reportTypeFull: result.reportTypeFull,
        category:      result.category,
        date:          new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        labName:       result.hospitalName || 'Lab',
        fileType:      'PDF',
        healthScore:   result.healthScore,
        healthLabel:   result.healthLabel,
        totalValues:   result.totalValues,
        abnormalCount: result.abnormalCount,
        borderlineCount: 0,
        status:        result.abnormalCount > 2 ? 'attention' : 'good',
        thumbnailUri:  null,
        analyzedAt:    new Date().toISOString(),
        fileHash,
      };
      await saveReports([newItem, ...stored]);

      // Persist full result (values, summary, medicines) keyed by id
      await saveDetail(newId, { ...result, reportId: result.reportId });

      return { ...result, reportId: Number(newId.replace(/\D/g, '')) || result.reportId };
    }

    // 🔴 REAL
    const apiResult = await apiFileCall(ENDPOINTS.analyzeReport, formData);
    return apiToAnalyzeResult(apiResult);
  },

  /**
   * GET REPORT DETAIL
   * ──────────────────
   * Returns the list item merged with the full AnalyzeResult (values,
   * summary, detected medicines) if it was stored at analyze-time.
   */
  getById: async (id: string): Promise<(ReportListItem & Partial<AnalyzeResult>) | null> => {
    if (USE_MOCK) {
      const all = await reportsApi.list();
      const item = all.find(r => r.id === id) ?? null;
      if (!item) return null;

      const details = await loadStoredDetails();
      const detail = details[id];
      if (detail) {
        return { ...item, ...detail, id: item.id };
      }
      return item;
    }
    return null;
  },

  /**
   * DELETE REPORT
   * ──────────────
   */
  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      const stored = await loadStoredReports();
      await saveReports(stored.filter(r => r.id !== id));
      await deleteDetail(id);
      return;
    }
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
        overallScore:    latest?.healthScore ?? 85,
        scoreLabel:      latest?.healthLabel ?? 'Good',
        riskIndicators:  [
          { label: 'Diabetes',          level: 'low'      as const, disease: 'Diabetes' },
          { label: 'Heart Disease',     level: 'low'      as const, disease: 'Heart Disease' },
          { label: 'Vitamin D Deficiency', level: 'moderate' as const, disease: 'Vitamin D Deficiency' },
        ],
        trend:           'stable' as const,
        lastUpdated:     latest?.date ?? 'Recently',
        totalReports:    all.length,
      };
    }
    return null;
  },
};
