/**
 * profileSubScreenApi.ts
 * ─────────────────────────────────────────────────────────────────────
 * All API contracts for the 6 Member Profile sub-screens:
 *   1. Health Summary
 *   2. Reports
 *   3. Medications
 *   4. Appointments
 *   5. AI Insights
 *   6. Emergency Details (contacts + medical info)
 *
 * ⚠️  MOCK ONLY – every function returns mock data with a simulated
 *     network delay.  When the backend is ready:
 *       1. Remove the `await delay()` line
 *       2. Uncomment the real fetch() block
 *       3. Delete the mock return statement
 * ─────────────────────────────────────────────────────────────────────
 */

// ── Network delay simulator ───────────────────────────────────────────
const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

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
  label:    string;
  value:    string;
  unit:     string;
  status:   VitalStatus;
  barPct:   number; // 0–100 for progress bar
}

export interface ScoreTrend {
  month: string;
  score: number;
}

export interface HealthSummaryResponse {
  member_id:   string;
  health_score: number;
  health_status: string;
  bmi:         number;
  spo2:        number;
  vitals:      Vital[];
  score_trend: ScoreTrend[];
  conditions:  { label: string; managed: boolean }[];
}

// ── Reports ────────────────────────────────────────────────────────────

export interface ReportItem {
  report_id:  string;
  title:      string;
  date:       string;
  type:       string;
  status:     ReportStatus;
  doctor:     string;
  hospital:   string;
  file_name:  string;
  key_values: { label: string; value: string; unit: string; status: VitalStatus }[];
}

export interface ReportsResponse {
  member_id: string;
  reports:   ReportItem[];
}

// ── Medications ────────────────────────────────────────────────────────

export interface Medication {
  med_id:      string;
  name:        string;
  dose:        string;
  frequency:   string;
  timing:      string;
  schedule:    string[];   // ["8:00 AM", "8:00 PM"]
  next_dose:   string;
  status:      MedStatus;
  color:       string;    // bg colour
  icon_color:  string;
}

export interface MedicationsResponse {
  member_id:         string;
  active_count:      number;
  medications:       Medication[];
}

// ── New Medication (add) ───────────────────────────────────────────────

export interface AddMedicationPayload {
  name:      string;
  dose:      string;
  frequency: string;
  timing:    string;
  schedule:  string[];
}

// ── Appointments ───────────────────────────────────────────────────────

export interface Appointment {
  appt_id:   string;
  doctor:    string;
  specialty: string;
  hospital:  string;
  date:      string;
  time:      string;
  status:    AppointmentStatus;
  notes:     string;
}

export interface AppointmentsResponse {
  member_id:   string;
  appointments: Appointment[];
}

// ── AI Insights ────────────────────────────────────────────────────────

export interface AIInsight {
  insight_id: string;
  title:      string;
  body:       string;
  severity:   InsightSeverity;
  date:       string;
  is_new:     boolean;
  action?:    string;
}

export interface AIInsightsResponse {
  member_id: string;
  new_count: number;
  insights:  AIInsight[];
}

// ── Emergency ─────────────────────────────────────────────────────────

export interface EmergencyContact {
  contact_id:   string;
  name:         string;
  phone:        string;
  relationship: ContactRelationship;
  note:         string;
  is_primary:   boolean;
}

export interface MedicalInfo {
  blood_group:      string;
  weight_kg:        number;
  height_cm:        number;
  allergies:        string[];
  conditions:       string[];
  emergency_notes:  string;
}

export interface EmergencyDetailsResponse {
  member_id:         string;
  medical_info:      MedicalInfo;
  emergency_contacts: EmergencyContact[];
}

// ════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════════════════════════════════════

const MOCK_HEALTH_SUMMARY: HealthSummaryResponse = {
  member_id:     'mem2',
  health_score:  78,
  health_status: 'Attention',
  bmi:           23.4,
  spo2:          98,
  vitals: [
    { label: 'Blood Pressure', value: '130/85', unit: 'mmHg', status: 'Elevated', barPct: 72 },
    { label: 'Blood Sugar',    value: '108',    unit: 'mg/dL', status: 'Elevated', barPct: 65 },
    { label: 'Heart Rate',     value: '74',     unit: 'bpm',   status: 'Normal',   barPct: 55 },
    { label: 'Cholesterol',    value: '195',    unit: 'mg/dL', status: 'Normal',   barPct: 48 },
  ],
  score_trend: [
    { month: 'Jan', score: 74 },
    { month: 'Feb', score: 77 },
    { month: 'Mar', score: 76 },
    { month: 'Apr', score: 73 },
    { month: 'May', score: 70 },
    { month: 'Jun', score: 78 },
  ],
  conditions: [
    { label: 'Hypertension',    managed: false },
    { label: 'Pre-diabetes',    managed: false },
    { label: 'Thyroid',         managed: true  },
  ],
};

const MOCK_REPORTS: ReportItem[] = [
  {
    report_id: 'rep1', title: 'CBC Report',     date: '05 Jun 2026', type: 'Blood test',
    status: 'Normal', doctor: 'Dr. Priya Sharma', hospital: 'Apollo Hospital',
    file_name: 'CBC_Report_Jun2026.pdf',
    key_values: [
      { label: 'Haemoglobin', value: '13.2', unit: 'g/dL',  status: 'Normal' },
      { label: 'WBC',         value: '7200', unit: '/µL',   status: 'Normal' },
      { label: 'Platelets',   value: '2.4L', unit: 'lakh',  status: 'Normal' },
      { label: 'RBC',         value: '4.6',  unit: 'M/µL',  status: 'Normal' },
    ],
  },
  {
    report_id: 'rep2', title: 'Thyroid Profile', date: '20 May 2026', type: 'Hormone',
    status: 'Review', doctor: 'Dr. Ramesh K.', hospital: 'Care Hospital',
    file_name: 'Thyroid_May2026.pdf',
    key_values: [
      { label: 'TSH',   value: '5.8',  unit: 'mIU/L', status: 'Elevated' },
      { label: 'T3',    value: '1.1',  unit: 'ng/mL', status: 'Normal'   },
      { label: 'T4',    value: '8.2',  unit: 'µg/dL', status: 'Normal'   },
    ],
  },
  {
    report_id: 'rep3', title: 'HbA1c Test', date: '12 May 2026', type: 'Diabetes',
    status: 'Elevated', doctor: 'Dr. Priya Sharma', hospital: 'Apollo Hospital',
    file_name: 'HbA1c_May2026.pdf',
    key_values: [
      { label: 'HbA1c',       value: '6.2', unit: '%',      status: 'Elevated' },
      { label: 'Avg Glucose', value: '131', unit: 'mg/dL',  status: 'Elevated' },
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
  {
    med_id: 'med3', name: 'Levothyroxine 25mcg', dose: '25mcg',
    frequency: 'Once daily', timing: 'Empty stomach',
    schedule: ['6:30 AM'], next_dose: 'Tomorrow 6:30 AM',
    status: 'Active', color: '#E8F5F0', icon_color: '#0D7B5F',
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
  {
    appt_id: 'apt3', doctor: 'Dr. Priya Sharma', specialty: 'General Physician',
    hospital: 'Apollo Hospital, Jubilee Hills', date: '05 May 2026', time: '10:00 AM',
    status: 'Completed', notes: 'CBC and routine check-up',
  },
];

const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    insight_id: 'ins1', is_new: true,
    severity: 'warning', date: 'Today',
    title: 'Blood pressure trending up',
    body: 'BP has been above 130/85 for the last 3 readings. Consider scheduling a cardiology consult and reviewing salt intake.',
    action: 'Book Appointment',
  },
  {
    insight_id: 'ins2', is_new: true,
    severity: 'warning', date: 'Today',
    title: 'Amlodipine missed this morning',
    body: 'Today\'s Amlodipine dose was not logged. Missing BP medication can cause sudden spikes. Please take it as soon as possible.',
    action: 'Mark as Taken',
  },
  {
    insight_id: 'ins3', is_new: false,
    severity: 'info', date: '3 days ago',
    title: 'HbA1c slightly elevated',
    body: 'HbA1c is at 6.2% — slightly above the normal range of 5.7%. Maintaining the Metformin schedule and a low-carb diet can help bring this down.',
    action: undefined,
  },
  {
    insight_id: 'ins4', is_new: false,
    severity: 'info', date: '1 week ago',
    title: 'Thyroid TSH above range',
    body: 'TSH at 5.8 mIU/L is above normal (0.4–4.0). The endocrinology appointment on 22 Jun is well-timed for a dosage review.',
    action: 'View Appointment',
  },
];

const MOCK_EMERGENCY: EmergencyDetailsResponse = {
  member_id: 'mem2',
  medical_info: {
    blood_group:     'B+',
    weight_kg:       62,
    height_cm:       158,
    allergies:       ['Penicillin', 'Shellfish'],
    conditions:      ['Hypertension', 'Pre-diabetes'],
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

/** GET /api/family/member/{member_id}/health-summary */
export async function getMemberHealthSummary(member_id: string): Promise<HealthSummaryResponse> {
  await delay(600);
  console.log(`💓 [profileSubScreenApi] getMemberHealthSummary id=${member_id} — MOCK`);

  // ── MOCK BLOCK (remove when API is ready) ─────────────────────────
  return { ...MOCK_HEALTH_SUMMARY, member_id };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK (uncomment when API is ready) ──────────────────────
  // const res = await fetch(`/api/family/member/${member_id}/health-summary`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // if (!res.ok) throw new Error('Failed to fetch health summary');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}

// ════════════════════════════════════════════════════════════════════════
// 2. REPORTS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/member/{member_id}/reports */
export async function getMemberReports(member_id: string): Promise<ReportsResponse> {
  await delay(650);
  console.log(`📋 [profileSubScreenApi] getMemberReports id=${member_id} — MOCK`);

  // ── MOCK BLOCK ────────────────────────────────────────────────────
  return { member_id, reports: MOCK_REPORTS };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK ────────────────────────────────────────────────────
  // const res = await fetch(`/api/family/member/${member_id}/reports`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // if (!res.ok) throw new Error('Failed to fetch reports');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}

// ════════════════════════════════════════════════════════════════════════
// 3. MEDICATIONS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/member/{member_id}/medications */
export async function getMemberMedications(member_id: string): Promise<MedicationsResponse> {
  await delay(600);
  console.log(`💊 [profileSubScreenApi] getMemberMedications id=${member_id} — MOCK`);

  // ── MOCK BLOCK ────────────────────────────────────────────────────
  return { member_id, active_count: MOCK_MEDICATIONS.filter(m => m.status === 'Active').length, medications: MOCK_MEDICATIONS };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK ────────────────────────────────────────────────────
  // const res = await fetch(`/api/family/member/${member_id}/medications`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // if (!res.ok) throw new Error('Failed to fetch medications');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}

/** POST /api/family/member/{member_id}/medications */
export async function addMemberMedication(
  member_id: string,
  payload: AddMedicationPayload,
): Promise<{ success: boolean; med_id: string; message: string }> {
  await delay(700);
  console.log(`💊 [profileSubScreenApi] addMemberMedication id=${member_id} — MOCK`);

  // ── MOCK BLOCK ────────────────────────────────────────────────────
  return { success: true, med_id: `med_${Date.now()}`, message: 'Medication added' };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK ────────────────────────────────────────────────────
  // const res = await fetch(`/api/family/member/${member_id}/medications`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error('Failed to add medication');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}

// ════════════════════════════════════════════════════════════════════════
// 4. APPOINTMENTS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/member/{member_id}/appointments */
export async function getMemberAppointments(member_id: string): Promise<AppointmentsResponse> {
  await delay(600);
  console.log(`📅 [profileSubScreenApi] getMemberAppointments id=${member_id} — MOCK`);

  // ── MOCK BLOCK ────────────────────────────────────────────────────
  return { member_id, appointments: MOCK_APPOINTMENTS };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK ────────────────────────────────────────────────────
  // const res = await fetch(`/api/family/member/${member_id}/appointments`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // if (!res.ok) throw new Error('Failed to fetch appointments');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}

// ════════════════════════════════════════════════════════════════════════
// 5. AI INSIGHTS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/member/{member_id}/ai-insights */
export async function getMemberAIInsights(member_id: string): Promise<AIInsightsResponse> {
  await delay(700);
  console.log(`🤖 [profileSubScreenApi] getMemberAIInsights id=${member_id} — MOCK`);

  // ── MOCK BLOCK ────────────────────────────────────────────────────
  return {
    member_id,
    new_count: MOCK_AI_INSIGHTS.filter(i => i.is_new).length,
    insights: MOCK_AI_INSIGHTS,
  };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK ────────────────────────────────────────────────────
  // const res = await fetch(`/api/family/member/${member_id}/ai-insights`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // if (!res.ok) throw new Error('Failed to fetch AI insights');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}

// ════════════════════════════════════════════════════════════════════════
// 6. EMERGENCY DETAILS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/member/{member_id}/emergency */
export async function getMemberEmergency(member_id: string): Promise<EmergencyDetailsResponse> {
  await delay(600);
  console.log(`🚨 [profileSubScreenApi] getMemberEmergency id=${member_id} — MOCK`);

  // ── MOCK BLOCK ────────────────────────────────────────────────────
  return { ...MOCK_EMERGENCY, member_id };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK ────────────────────────────────────────────────────
  // const res = await fetch(`/api/family/member/${member_id}/emergency`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // if (!res.ok) throw new Error('Failed to fetch emergency details');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}

/** POST /api/family/member/{member_id}/emergency/contacts */
export async function addEmergencyContact(
  member_id: string,
  payload: Omit<EmergencyContact, 'contact_id'>,
): Promise<{ success: boolean; contact_id: string; message: string }> {
  await delay(700);
  console.log(`🚨 [profileSubScreenApi] addEmergencyContact id=${member_id} — MOCK`);

  // ── MOCK BLOCK ────────────────────────────────────────────────────
  return { success: true, contact_id: `ec_${Date.now()}`, message: 'Contact added' };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK ────────────────────────────────────────────────────
  // const res = await fetch(`/api/family/member/${member_id}/emergency/contacts`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error('Failed to add emergency contact');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}

/** DELETE /api/family/member/{member_id}/emergency/contacts/{contact_id} */
export async function deleteEmergencyContact(
  member_id: string,
  contact_id: string,
): Promise<{ success: boolean; message: string }> {
  await delay(500);
  console.log(`🚨 [profileSubScreenApi] deleteEmergencyContact id=${member_id} contact=${contact_id} — MOCK`);

  // ── MOCK BLOCK ────────────────────────────────────────────────────
  return { success: true, message: 'Contact removed' };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK ────────────────────────────────────────────────────
  // const res = await fetch(
  //   `/api/family/member/${member_id}/emergency/contacts/${contact_id}`,
  //   { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  // );
  // if (!res.ok) throw new Error('Failed to delete contact');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}

/** PATCH /api/family/member/{member_id}/emergency/medical-info */
export async function updateMedicalInfo(
  member_id: string,
  payload: Partial<MedicalInfo>,
): Promise<{ success: boolean; message: string }> {
  await delay(700);
  console.log(`🚨 [profileSubScreenApi] updateMedicalInfo id=${member_id} — MOCK`);

  // ── MOCK BLOCK ────────────────────────────────────────────────────
  return { success: true, message: 'Medical info updated' };
  // ─────────────────────────────────────────────────────────────────

  // ── REAL BLOCK ────────────────────────────────────────────────────
  // const res = await fetch(`/api/family/member/${member_id}/emergency/medical-info`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error('Failed to update medical info');
  // return res.json();
  // ─────────────────────────────────────────────────────────────────
}
