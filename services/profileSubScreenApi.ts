/**
 * services/profileSubScreenApi.ts
 * ─────────────────────────────────────────────────────────────────────
 * All API contracts for the 6 Member Profile sub-screens:
 *   1. Health Summary    → app/family/health-summary.tsx
 *   2. Reports           → app/family/reports.tsx
 *   3. Medications       → app/family/medications.tsx
 *   4. Appointments      → app/family/appointments.tsx
 *   5. AI Insights       → app/family/ai-insights.tsx
 *   6. Emergency Details → app/family/emergency.tsx
 *
 * HOW TO USE:
 *   • Every function has TWO blocks — 🔴 REAL (active) and 🟢 MOCK (commented)
 *   • 🔴 REAL calls the backend via medicineApiCall (auth + decrypt + logging)
 *   • Endpoint URLs come from ENDPOINTS in constants/api.ts
 *   • All routes use BASE_URL + /api/api/family/member/{id}/... (double /api)
 *
 * ⚠️  If a specific endpoint misbehaves, comment the REAL block and
 *     uncomment the MOCK block to fall back gracefully.
 * ─────────────────────────────────────────────────────────────────────
 */

import { ENDPOINTS } from '@/constants/api';
import { medicineApiCall } from './Medicineapiclient';

// ── Network delay simulator (for mock blocks only) ────────────────────
const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

// ── Envelope unwrapper ────────────────────────────────────────────────
function unwrapList<T>(raw: any, ...keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  for (const key of keys) {
    if (Array.isArray(raw?.[key])) return raw[key] as T[];
  }
  return [];
}

// ════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════

export type VitalStatus = 'Normal' | 'Elevated' | 'High' | 'Low' | 'Critical';
export type ReportStatus = 'Normal' | 'Review' | 'Elevated' | 'Critical';
export type MedStatus = 'Active' | 'Missed' | 'Completed' | 'Stopped';
export type AppointmentStatus = 'Upcoming' | 'Completed' | 'Cancelled';
export type InsightSeverity = 'info' | 'warning' | 'critical';
export type ContactRelationship =
  | 'Son / Daughter' | 'Spouse' | 'Parent' | 'Sibling'
  | 'Doctor' | 'Neighbour' | 'Other';

// ── Health Summary ──────────────────────────────────────────────────────

export interface Vital {
  label: string;
  value: string;
  unit: string;
  status: VitalStatus;
  barPct: number;
}

export interface ScoreTrend {
  month: string;
  score: number;
}

export interface HealthSummaryResponse {
  member_id: string;
  health_score: number;
  health_status: string;
  bmi: number;
  spo2: number;
  vitals: Vital[];
  score_trend: ScoreTrend[];
  conditions: { label: string; managed: boolean }[];
  ai_insights?: any[];
}

// ── Reports ────────────────────────────────────────────────────────────

export interface ReportItem {
  report_id: string;
  title: string;
  date: string;
  type: string;
  status: ReportStatus;
  doctor: string;
  hospital: string;
  file_name: string;
  key_values: { label: string; value: string; unit: string; status: VitalStatus }[];
}

export interface ReportsResponse {
  member_id: string;
  reports: ReportItem[];
}

// ── Medications ────────────────────────────────────────────────────────

export interface Medication {
  med_id: string;
  name: string;
  dose: string;
  frequency: string;
  timing: string;
  schedule: string[];
  next_dose: string;
  status: MedStatus;
  color: string;
  icon_color: string;
}

export interface MedicationsResponse {
  member_id: string;
  active_count: number;
  medications: Medication[];
}

export interface AddMedicationPayload {
  name: string;
  dose: string;
  frequency: string;
  timing: string;
  schedule: string[];
}

// ── Appointments ───────────────────────────────────────────────────────

export interface Appointment {
  appt_id: string;
  doctor: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
}

export interface AppointmentsResponse {
  member_id: string;
  appointments: Appointment[];
}

// ── AI Insights ────────────────────────────────────────────────────────

export interface AIInsight {
  insight_id: string;
  title: string;
  body: string;
  severity: InsightSeverity;
  date: string;
  is_new: boolean;
  action?: string;
}

export interface AIInsightsResponse {
  member_id: string;
  new_count: number;
  insights: AIInsight[];
}

// ── Emergency ─────────────────────────────────────────────────────────

export interface EmergencyContact {
  contact_id: string;
  name: string;
  phone: string;
  relationship: ContactRelationship;
  note: string;
  is_primary: boolean;
}

export interface MedicalInfo {
  blood_group: string;
  weight_kg: number;
  height_cm: number;
  allergies: string[];
  conditions: string[];
  emergency_notes: string;
}

export interface EmergencyDetailsResponse {
  member_id: string;
  medical_info: MedicalInfo;
  emergency_contacts: EmergencyContact[];
}

// ════════════════════════════════════════════════════════════════════════
// MOCK DATA  (kept for fallback — do not delete)
// ════════════════════════════════════════════════════════════════════════

const MOCK_HEALTH_SUMMARY: HealthSummaryResponse = {
  member_id: 'mem2',
  health_score: 78,
  health_status: 'Attention',
  bmi: 23.4,
  spo2: 98,
  vitals: [
    { label: 'Blood Pressure', value: '130/85', unit: 'mmHg', status: 'Elevated', barPct: 72 },
    { label: 'Blood Sugar', value: '108', unit: 'mg/dL', status: 'Elevated', barPct: 65 },
    { label: 'Heart Rate', value: '74', unit: 'bpm', status: 'Normal', barPct: 55 },
    { label: 'Cholesterol', value: '195', unit: 'mg/dL', status: 'Normal', barPct: 48 },
  ],
  score_trend: [
    { month: 'Jan', score: 74 }, { month: 'Feb', score: 77 },
    { month: 'Mar', score: 76 }, { month: 'Apr', score: 73 },
    { month: 'May', score: 70 }, { month: 'Jun', score: 78 },
  ],
  conditions: [
    { label: 'Hypertension', managed: false },
    { label: 'Pre-diabetes', managed: false },
    { label: 'Thyroid', managed: true },
  ],
};

const MOCK_REPORTS: ReportItem[] = [
  {
    report_id: 'rep1', title: 'CBC Report', date: '05 Jun 2026', type: 'Blood test',
    status: 'Normal', doctor: 'Dr. Priya Sharma', hospital: 'Apollo Hospital',
    file_name: 'CBC_Report_Jun2026.pdf',
    key_values: [
      { label: 'Haemoglobin', value: '13.2', unit: 'g/dL', status: 'Normal' },
      { label: 'WBC', value: '7200', unit: '/µL', status: 'Normal' },
      { label: 'Platelets', value: '2.4L', unit: 'lakh', status: 'Normal' },
      { label: 'RBC', value: '4.6', unit: 'M/µL', status: 'Normal' },
    ],
  },
  {
    report_id: 'rep2', title: 'Thyroid Profile', date: '20 May 2026', type: 'Hormone',
    status: 'Review', doctor: 'Dr. Ramesh K.', hospital: 'Care Hospital',
    file_name: 'Thyroid_May2026.pdf',
    key_values: [
      { label: 'TSH', value: '5.8', unit: 'mIU/L', status: 'Elevated' },
      { label: 'T3', value: '1.1', unit: 'ng/mL', status: 'Normal' },
      { label: 'T4', value: '8.2', unit: 'µg/dL', status: 'Normal' },
    ],
  },
];

const MOCK_MEDICATIONS: Medication[] = [
  {
    med_id: 'med1', name: 'Metformin 500mg', dose: '500mg',
    frequency: 'Twice daily', timing: 'After meals',
    schedule: ['8:00 AM', '8:00 PM'], next_dose: 'Next in 2h',
    status: 'Active', color: '#E8F5F0', icon_color: '#0D7B5F',
  },
  {
    med_id: 'med2', name: 'Amlodipine 5mg', dose: '5mg',
    frequency: 'Once daily', timing: 'Morning',
    schedule: ['8:00 AM'], next_dose: 'Missed today',
    status: 'Missed', color: '#FEF9E8', icon_color: '#F59E0B',
  },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    appt_id: 'apt1', doctor: 'Dr. Priya Sharma', specialty: 'General Physician',
    hospital: 'Apollo Hospital, Jubilee Hills', date: '15 Jun 2026', time: '10:30 AM',
    status: 'Upcoming', notes: 'Follow-up for HbA1c and BP review',
  },
  {
    appt_id: 'apt2', doctor: 'Dr. Ramesh K.', specialty: 'Endocrinologist',
    hospital: 'Care Hospital, Banjara Hills', date: '22 Jun 2026', time: '11:00 AM',
    status: 'Upcoming', notes: 'Thyroid review, bring latest report',
  },
];

const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    insight_id: 'ins1', is_new: true, severity: 'warning', date: 'Today',
    title: 'Blood pressure trending up',
    body: 'BP has been above 130/85 for the last 3 readings. Consider scheduling a cardiology consult.',
    action: 'Book Appointment',
  },
  {
    insight_id: 'ins2', is_new: true, severity: 'warning', date: 'Today',
    title: 'Amlodipine missed this morning',
    body: "Today's Amlodipine dose was not logged. Missing BP medication can cause sudden spikes.",
    action: 'Mark as Taken',
  },
];

const MOCK_EMERGENCY: EmergencyDetailsResponse = {
  member_id: 'mem2',
  medical_info: {
    blood_group: 'B+', weight_kg: 62, height_cm: 158,
    allergies: ['Penicillin', 'Shellfish'],
    conditions: ['Hypertension', 'Pre-diabetes'],
    emergency_notes: 'Insulin sensitive — keep glucose tablets nearby',
  },
  emergency_contacts: [
    {
      contact_id: 'ec1', name: 'Arjun Kumar (Son)', phone: '+91 98765 43210',
      relationship: 'Son / Daughter', note: '', is_primary: true,
    },
    {
      contact_id: 'ec2', name: 'Dr. Priya Sharma', phone: '+91 98001 23456',
      relationship: 'Doctor', note: 'Apollo Hospital', is_primary: false,
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════
// 1. HEALTH SUMMARY
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/{member_id}/health-summary */
export async function getMemberHealthSummary(member_id: string): Promise<HealthSummaryResponse> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberHealthSummary(member_id));
  const d = raw?.data ?? raw;

  return {
    member_id: String(d.member_id ?? member_id),
    health_score: d.overall_score ?? d.health_score ?? 0,
    health_status: d.overall_status ?? d.health_status ?? 'Unknown',
    bmi: d.bmi ?? 0,
    spo2: d.spo2 ?? 0,
    vitals: d.vitals ?? [],
    score_trend: d.score_trend ?? [],
    conditions: d.conditions ?? [],
    ai_insights: d.ai_insights ?? [],
  };
}

// ════════════════════════════════════════════════════════════════════════
// 2. REPORTS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/{member_id}/reports */
export async function getMemberReports(member_id: string): Promise<ReportsResponse> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberReports(member_id));
  const d = raw?.data ?? raw;
  const reports = unwrapList<ReportItem>(d, 'reports', 'data');
  return { member_id: String(d.member_id ?? member_id), reports };

  // 🟢 MOCK
  // await delay(650);
  // console.log(`📋 [profileSubScreenApi] getMemberReports id=${member_id} — MOCK`);
  // return { member_id, reports: MOCK_REPORTS };
}

// ════════════════════════════════════════════════════════════════════════
// 3. MEDICATIONS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/{member_id}/medications */
export async function getMemberMedications(member_id: string): Promise<MedicationsResponse> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberMedications(member_id));
  const d = raw?.data ?? raw;
  const rawMeds = unwrapList<any>(d, 'medications', 'data');
  const medications: Medication[] = rawMeds.map((m: any) => {
    const rawStatus = (m.status || 'Active').toLowerCase();
    let status: MedStatus = 'Active';
    if (rawStatus === 'missed') status = 'Missed';
    else if (rawStatus === 'stopped') status = 'Stopped';
    else if (rawStatus === 'completed') status = 'Completed';
    // 'upcoming' or 'active' will map to 'Active'

    return {
      med_id: String(m.med_id ?? m.id ?? ''),
      name: m.name ?? 'Unknown',
      dose: m.dose ?? '',
      frequency: m.frequency ?? '',
      timing: m.timing ?? '',
      schedule: Array.isArray(m.schedule) ? m.schedule : (typeof m.schedule === 'string' ? m.schedule.split(',').map((s: string) => s.trim()) : []),
      next_dose: m.next_dose ?? '',
      status,
      color: m.color || (status === 'Active' ? '#E8F5F0' : status === 'Missed' ? '#FFE8E8' : '#F1F5F9'),
      icon_color: m.icon_color || (status === 'Active' ? '#0D7B5F' : status === 'Missed' ? '#991B1B' : '#64748B'),
    };
  });

  return {
    member_id: String(d.member_id ?? member_id),
    active_count: d?.active_count ?? medications.filter((m) => m.status === 'Active').length,
    medications,
  };

  // 🟢 MOCK
  // await delay(600);
  // console.log(`💊 [profileSubScreenApi] getMemberMedications id=${member_id} — MOCK`);
  // return { member_id, active_count: MOCK_MEDICATIONS.filter(m => m.status === 'Active').length, medications: MOCK_MEDICATIONS };
}

/** POST /api/api/family/member/{member_id}/medications */
export async function addMemberMedication(
  member_id: string,
  payload: AddMedicationPayload,
): Promise<{ success: boolean; med_id: string; message: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberMedications(member_id), {
    method: 'POST',
    body: payload,
  });
  return (raw?.data ?? raw) as { success: boolean; med_id: string; message: string };

  // 🟢 MOCK
  // await delay(700);
  // console.log(`💊 [profileSubScreenApi] addMemberMedication id=${member_id} — MOCK`);
  // return { success: true, med_id: `med_${Date.now()}`, message: 'Medication added' };
}

// ════════════════════════════════════════════════════════════════════════
// 4. APPOINTMENTS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/{member_id}/appointments */
export async function getMemberAppointments(member_id: string): Promise<AppointmentsResponse> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberAppointments(member_id));
  const d = raw?.data ?? raw;
  const appointments = unwrapList<Appointment>(d, 'appointments', 'data');
  return { member_id: String(d.member_id ?? member_id), appointments };

  // 🟢 MOCK
  // await delay(600);
  // console.log(`📅 [profileSubScreenApi] getMemberAppointments id=${member_id} — MOCK`);
  // return { member_id, appointments: MOCK_APPOINTMENTS };
}

// ════════════════════════════════════════════════════════════════════════
// 5. AI INSIGHTS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/{member_id}/ai-insights */
export async function getMemberAIInsights(member_id: string): Promise<AIInsightsResponse> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberAiInsights(member_id));
  const d = raw?.data ?? raw;
  const rawInsights = unwrapList<any>(d, 'insights', 'data');

  const insights: AIInsight[] = rawInsights.map((i: any) => ({
    insight_id: String(i.id ?? i.insight_id ?? ''),
    title: i.title ?? 'Health Insight',
    body: i.description ?? i.body ?? '',
    severity: i.severity === 'high' || i.severity === 'critical' ? 'critical' : i.severity === 'medium' ? 'warning' : 'info',
    date: i.created_at ? new Date(i.created_at).toLocaleDateString() : (i.date ?? 'Today'),
    is_new: i.is_new ?? false,
    action: i.data?.recommendation ?? i.action ?? undefined,
  }));

  return {
    member_id: String(d.member_id ?? member_id),
    new_count: d?.new_count ?? insights.filter((i) => i.is_new).length,
    insights,
  };

  // 🟢 MOCK
  // await delay(700);
  // console.log(`🤖 [profileSubScreenApi] getMemberAIInsights id=${member_id} — MOCK`);
  // return { member_id, new_count: MOCK_AI_INSIGHTS.filter(i => i.is_new).length, insights: MOCK_AI_INSIGHTS };
}

// ════════════════════════════════════════════════════════════════════════
// 6. EMERGENCY DETAILS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/{member_id}/emergency */
export async function getMemberEmergency(member_id: string): Promise<EmergencyDetailsResponse> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberEmergency(member_id));
  const d = raw?.data ?? raw;
  
  return {
    member_id: String(d.member_id ?? member_id),
    medical_info: {
      blood_group: d.blood_type ?? d.medical_info?.blood_group ?? 'Unknown',
      weight_kg: d.weight_kg ?? d.medical_info?.weight_kg ?? 0,
      height_cm: d.height_cm ?? d.medical_info?.height_cm ?? 0,
      allergies: d.allergies ?? d.medical_info?.allergies ?? [],
      conditions: d.conditions ?? d.medical_info?.conditions ?? [],
      emergency_notes: d.medical_notes ?? d.medical_info?.emergency_notes ?? 'No notes provided',
    },
    emergency_contacts: d.emergency_contacts ?? [],
  };

  // 🟢 MOCK
  // await delay(600);
  // console.log(`🚨 [profileSubScreenApi] getMemberEmergency id=${member_id} — MOCK`);
  // return { ...MOCK_EMERGENCY, member_id };
}

/** POST /api/api/family/member/{member_id}/emergency/contacts */
export async function addEmergencyContact(
  member_id: string,
  payload: Omit<EmergencyContact, 'contact_id'>,
): Promise<{ success: boolean; contact_id: string; message: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberEmergencyContacts(member_id), {
    method: 'POST',
    body: payload,
  });
  return (raw?.data ?? raw) as { success: boolean; contact_id: string; message: string };

  // 🟢 MOCK
  // await delay(700);
  // console.log(`🚨 [profileSubScreenApi] addEmergencyContact id=${member_id} — MOCK`);
  // return { success: true, contact_id: `ec_${Date.now()}`, message: 'Contact added' };
}

/** DELETE /api/api/family/member/{member_id}/emergency/contacts/{contact_id} */
export async function deleteEmergencyContact(
  member_id: string,
  contact_id: string,
): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(
    ENDPOINTS.familyMemberEmergencyContact(member_id, contact_id),
    { method: 'DELETE' },
  );
  return (raw?.data ?? raw) as { success: boolean; message: string };

  // 🟢 MOCK
  // await delay(500);
  // console.log(`🚨 [profileSubScreenApi] deleteEmergencyContact id=${member_id} contact=${contact_id} — MOCK`);
  // return { success: true, message: 'Contact removed' };
}

/** PATCH /api/api/family/member/{member_id}/emergency/medical-info */
export async function updateMedicalInfo(
  member_id: string,
  payload: Partial<MedicalInfo>,
): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL
  /*
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberMedicalInfo(member_id), {
    method: 'PATCH' as any,
    body: payload,
  });
  return (raw?.data ?? raw) as { success: boolean; message: string };
  */

  // 🟢 MOCK
  await new Promise(resolve => setTimeout(resolve, 600));
  console.log(`🚨 [profileSubScreenApi] updateMedicalInfo id=${member_id} — MOCK`);
  return { success: true, message: 'Medical info updated' };
}