// Raw shape from API
export interface ApiLabValue {
  'Patient Name': string;
  'Hospital Name': string;
  'Test Name': string;
  'Value': string;
  'Units'?: string;
  'Normal Range': string;
  'Status': string;
  'Possible Disease'?: string | null;
  'Medical Explanation'?: string;
  'Simple Meaning'?: string;
  'Symptoms'?: string[];
  'Recommended Foods'?: string[];
  'Foods To Avoid'?: string[];
  'Recommended Fruits'?: string[];
  'Recommended Juices'?: string[];
  'Recommended Vegetables'?: string[];
  'Protein Suggestions'?: string[];
  'Exercise'?: string[];
  'Sleep Tips'?: string[];
  'Water Intake'?: string;
  'Precautions'?: string[];
  'Lifestyle Tips'?: string[];
  'Medicine Guidance'?: string;
  'Doctor Advice'?: string;
}

export interface MedicalTerm {
  term: string;
  simple_meaning: string;
}

/** A medicine detected in the AI analysis of a report */
export interface DetectedMedicine {
  name: string;
  reason: string; // e.g. "Recommended for high LDL"
  type: 'recommended' | 'mentioned' | 'avoid';
}

export interface ApiSummary {
  // Original fields
  overall_health?: string;
  ai_summary?: string;
  abnormal_findings?: string[];
  recommendations?: string[];

  // New fields
  report_description?: {
    what_this_report_is?: string;
    what_was_checked?: string;
  };
  health_score?: string;
  condition_severity?: string;
  condition_color?: string;
  patient_friendly_explanation?: string;
  voice_explanation_english?: string;
  voice_explanation_telugu?: string;
  is_emergency?: boolean;
  emergency_warning?: string;
  important_risks?: string[];
  symptoms_patient_may_feel?: string[];
  what_patient_should_do_next?: string[];
  what_patient_should_do_next_telugu?: string[];
  recommended_diet?: string[];
  foods_to_avoid?: string[];
  recommended_fruits?: string[];
  recommended_juices?: string[];
  recommended_leafy_vegetables?: string[];
  protein_recommendations?: string[];
  exercise_recommendations?: string[];
  sleep_recommendations?: string[];
  water_intake?: string;
  lifestyle_changes?: string[];
  precautions?: string[];
  doctor_consultation_needed?: string;
  questions_to_ask_doctor?: string[];
  next_tests_recommended?: string[];
  general_medicine_guidance?: string[];
  emergency_warning_signs?: string[];
  medical_terms_translated?: MedicalTerm[];
  /** Medicines the AI detected / recommended — new field */
  detected_medicines?: DetectedMedicine[];
}

export interface UserQuestionAnswer {
  question: string;
  answer: string;
  relevant_biomarkers?: string[];
}

export interface ApiAnalyzeResponse {
  success: boolean;
  report_id: number;
  report_type?: string;
  report_type_full?: string;
  summary?: ApiSummary | string;
  data: ApiLabValue[];
  prescription?: ApiPrescription;
  user_question_answer?: UserQuestionAnswer;
}

export interface ApiPrescriptionMedicine {
  name: string;
  generic_name?: string;
  dosage?: string;
  units?: string;
  frequency?: string;
  duration?: string;
  route?: string;
  instructions?: string;
  why_prescribed?: string;
  usage_explanation?: string;
  precautions?: string[];
  side_effects_to_watch?: string[];
}

export interface ApiPrescription {
  prescription_available?: boolean;
  prescription_id?: number | null;
  prescription_date?: string;
  doctor_name?: string;
  hospital_name?: string;
  diagnosis?: string;
  instructions?: string[];
  precautions?: string[];
  follow_up?: string;
  disclaimer?: string;
  medicines?: ApiPrescriptionMedicine[];
}

// App-internal shape used by LabValueRow, etc.
export interface LabValue {
  name: string;
  value: string;
  range: string;
  status: 'normal' | 'high' | 'low' | 'abnormal';
  possibleDisease?: string;
  simpleMeaning?: string;
  symptoms?: string[];
  recommendedFoods?: string[];
  foodsToAvoid?: string[];
  recommendedFruits?: string[];
  recommendedJuices?: string[];
  recommendedVegetables?: string[];
  proteinSuggestions?: string[];
  exercise?: string[];
  sleepTips?: string[];
  waterIntake?: string;
  precautions?: string[];
  lifestyleTips?: string[];
  medicineGuidance?: string;
  doctorAdvice?: string;
}

export interface Report {
  id: string;
  title: string;
  date: string;
  status: 'good' | 'attention';
}

/** Canonical category slugs used across reports module */
export type ReportCategory =
  | 'Blood Test'
  | 'CBC'
  | 'Thyroid'
  | 'Lipid'
  | 'Diabetes'
  | 'Vitamins'
  | 'Liver'
  | 'Kidney'
  | 'Others';

// Map API response → internal LabValue[]
export function mapApiLabValues(raw: ApiLabValue[]): LabValue[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    name:   item['Test Name'],
    value:  item['Units'] ? `${item['Value']} ${item['Units']}` : item['Value'],
    range:  item['Units'] ? `${item['Normal Range']} ${item['Units']}` : item['Normal Range'],
    status: (item['Status'] ? String(item['Status']).toLowerCase() : 'normal') as 'normal' | 'high' | 'low',
    possibleDisease: item['Possible Disease'] ?? undefined,
    simpleMeaning: item['Simple Meaning'],
    symptoms: item['Symptoms'],
    recommendedFoods: item['Recommended Foods'],
    foodsToAvoid: item['Foods To Avoid'],
    recommendedFruits: item['Recommended Fruits'],
    recommendedJuices: item['Recommended Juices'],
    recommendedVegetables: item['Recommended Vegetables'],
    proteinSuggestions: item['Protein Suggestions'],
    exercise: item['Exercise'],
    sleepTips: item['Sleep Tips'],
    waterIntake: item['Water Intake'],
    precautions: item['Precautions'],
    lifestyleTips: item['Lifestyle Tips'],
    medicineGuidance: item['Medicine Guidance'],
    doctorAdvice: item['Doctor Advice'],
  }));
}

/** Derive a ReportCategory from the raw report_type string */
export function deriveCategory(reportType: string): ReportCategory {
  const t = reportType.toLowerCase();
  if (t.includes('cbc') || t.includes('blood count')) return 'CBC';
  if (t.includes('thyroid') || t.includes('tsh') || t.includes('t3') || t.includes('t4')) return 'Thyroid';
  if (t.includes('lipid') || t.includes('cholesterol') || t.includes('ldl') || t.includes('hdl')) return 'Lipid';
  if (t.includes('hba1c') || t.includes('glucose') || t.includes('diabetes') || t.includes('sugar')) return 'Diabetes';
  if (t.includes('vitamin') || t.includes('vit')) return 'Vitamins';
  if (t.includes('liver') || t.includes('sgpt') || t.includes('sgot') || t.includes('alt') || t.includes('ast')) return 'Liver';
  if (t.includes('kidney') || t.includes('creatinine') || t.includes('urea') || t.includes('renal')) return 'Kidney';
  if (t.includes('blood')) return 'Blood Test';
  return 'Others';
}
