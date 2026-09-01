/**
 * app/analysis.tsx — Full Results
 * Opened from Report Details → View Full Results (and upload/home flows).
 * Keeps PDF export, translation, Ask AI, and detected medicines.
 */

import { useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Radius } from '@/constants/Colors';
import type { ApiSummary, DetectedMedicine, LabValue } from '@/types/Report/reportype';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { LanguageSelectModal } from '@/components/ui/LanguageSelectModal';
import { AnalysisSummaryCard, AbnormalChipsCard } from '@/components/reports/AnalysisSummaryCard';
import { AIExplanationCard } from '@/components/reports/AIExplanationCard';

type ViewMode = 'parameter' | 'category';

function isUsableValue(v: LabValue): boolean {
  if (!v || !v.value) return false;
  const val = String(v.value).trim().toLowerCase();

  if (val === '') return false;

  // Split by whitespace to handle cases like "N/A N/A" or "Unknown Unknown"
  const words = val.split(/\s+/);
  const dummyWords = new Set(['n/a', 'na', 'unknown', 'null', 'undefined', '-', '--']);

  const isAllDummy = words.every(
    (word) => dummyWords.has(word) || word === 'not' || word === 'available' || word === 'provided'
  );

  return !isAllDummy;
}

function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function categorizeParam(name: string): string {
  const n = name.toLowerCase();
  if (/neutrophil|lymphocyte|monocyte|eosinophil|basophil/.test(n)) {
    return 'White Blood Cells (Differential)';
  }
  if (/rbc|hematocrit|hct|mcv|mchc|mch\b|rdw|red blood|pcv/.test(n)) {
    return 'Red Blood Cells';
  }
  if (/hemoglobin|haemoglobin|hb\b|wbc|tlc|platelet|thrombocyte|total leucocyte|total leukocyte/.test(n)) {
    return 'Blood Cells';
  }
  if (/glucose|hba1c|sugar|insulin|fbs|ppbs|fasting/.test(n)) return 'Diabetes';
  if (/cholest|ldl|hdl|triglyc|lipid|vldl/.test(n)) return 'Lipid Profile';
  if (/tsh|t3|t4|thyroid|ft3|ft4/.test(n)) return 'Thyroid';
  if (/sgot|sgpt|alt|ast|bilirubin|alkaline|albumin|liver|ggt/.test(n)) return 'Liver';
  if (/creatinine|urea|uric|egfr|bun|kidney/.test(n)) return 'Kidney';
  if (/vitamin|b12|folate|iron|ferritin|calcium|d3/.test(n)) return 'Vitamins & Minerals';
  return 'Other Parameters';
}

function isAbnormalStatus(status?: string): boolean {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return s === 'high' || s === 'low' || s === 'abnormal';
}

function statusStyle(status: string) {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'high') return { label: 'High', color: '#DC2626' };
  if (s === 'low') return { label: 'Low', color: '#D97706' };
  if (s === 'abnormal') return { label: 'Abnormal', color: '#DC2626' };
  return { label: 'Normal', color: '#16A34A' };
}

function ResultRow({
  value,
  expanded,
  onToggle,
}: {
  value: LabValue;
  expanded: boolean;
  onToggle: () => void;
}) {
  const st = statusStyle(value.status);
  return (
    <View>
      <Pressable style={styles.resultRow} onPress={onToggle}>
        <View style={styles.resultLeft}>
          <Text style={styles.resultName} numberOfLines={expanded ? 3 : 1}>
            {value.name}
          </Text>
          <Text style={styles.resultValue}>{value.value}</Text>
        </View>
        <Text style={styles.resultRange}>
          Range: {value.range || '—'}
        </Text>
        <Text style={[styles.resultStatus, { color: st.color }]}>{st.label}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
        />
      </Pressable>
      {expanded && (
        <View style={styles.expandBox}>
          {!!value.simpleMeaning && (
            <Text style={styles.expandText}>{value.simpleMeaning}</Text>
          )}
          {!!value.possibleDisease && value.possibleDisease !== 'N/A' && (
            <View style={styles.expandMetaWrap}>
              <Text style={styles.expandMetaLabel}>Possible Condition: </Text>
              <Text style={styles.expandMetaVal}>{value.possibleDisease}</Text>
            </View>
          )}
          {!!value.symptoms?.length && (
            <View style={styles.symptomsWrap}>
              <Text style={styles.symptomsTitle}>Symptoms to watch for:</Text>
              <View style={styles.symptomsTags}>
                {value.symptoms.map((s, i) => (
                  <View key={i} style={styles.symptomPill}>
                    <Text style={styles.symptomText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {!!value.doctorAdvice && (
            <View style={styles.adviceBox}>
              <Ionicons name="medical-outline" size={14} color="#0369A1" />
              <Text style={styles.adviceText}>{value.doctorAdvice}</Text>
            </View>
          )}
          {!value.simpleMeaning && !value.possibleDisease && (
            <Text style={styles.expandText}>
              {value.name} is {st.label.toLowerCase()} at {value.value}
              {value.range ? ` (ref ${value.range})` : ''}.
            </Text>
          )}
          <Pressable
            style={styles.askChip}
            onPress={() =>
              router.push({
                pathname: '/ai-chat',
                params: {
                  prefill: `What does ${value.name} = ${value.value} mean? It is marked as ${value.status}.`,
                },
              })
            }
          >
            <Ionicons name="sparkles" size={12} color={Colors.primary} />
            <Text style={styles.askChipText}>Ask about this</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function CategorySection({
  title,
  items,
  expandedIds,
  toggleExpand,
  collapsed,
  onToggleCollapse,
}: {
  title: string;
  items: LabValue[];
  expandedIds: Set<string>;
  toggleExpand: (key: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const preview = collapsed ? items.slice(0, 3) : items;
  const more = Math.max(0, items.length - 3);

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {preview.map((v, i) => {
          const key = `${title}:${v.name}:${i}`;
          return (
            <View key={key}>
              {i > 0 && <View style={styles.rowDivider} />}
              <ResultRow
                value={v}
                expanded={expandedIds.has(key)}
                onToggle={() => toggleExpand(key)}
              />
            </View>
          );
        })}
        {more > 0 && (
          <Pressable style={styles.viewMore} onPress={onToggleCollapse}>
            <Text style={styles.viewMoreText}>
              {collapsed ? `View more (${more})` : 'Show less'}
            </Text>
            <Ionicons
              name={collapsed ? 'chevron-down' : 'chevron-up'}
              size={14}
              color={Colors.primary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AnalysisScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('parameter');
  const [sharing, setSharing] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedNarrative, setTranslatedNarrative] = useState<string | null>(null);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const params = useLocalSearchParams<{
    reportId?: string;
    patientName?: string;
    hospitalName?: string;
    summary?: string;
    values?: string;
    detectedMedicines?: string;
    narrative?: string;
    reportType?: string;
    userQuestionAnswer?: string;
  }>();

  const userQA = useMemo(() => {
    if (!params.userQuestionAnswer) return null;
    try {
      const parsed = JSON.parse(params.userQuestionAnswer);
      if (parsed?.question && (parsed?.answer || parsed?.answer === '')) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }, [params.userQuestionAnswer]);

  const values: LabValue[] = useMemo(() => {
    if (!params.values) return [];
    try {
      const parsed = JSON.parse(params.values);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.values]);

  const usableValues = useMemo(() => values.filter(isUsableValue), [values]);

  const abnormal = usableValues.filter((v) => isAbnormalStatus(v.status));

  const detectedMedicines: DetectedMedicine[] = useMemo(() => {
    if (!params.detectedMedicines) return [];
    try {
      const parsed = JSON.parse(params.detectedMedicines);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.detectedMedicines]);

  let parsedSummary: ApiSummary | null = null;
  const rawSummarySource = translatedSummary ?? params.summary;
  if (rawSummarySource) {
    try {
      parsedSummary = JSON.parse(rawSummarySource);
    } catch {
      /* plain string */
    }
  }

  // Merge rich details from values (e.g. Diet, Lifestyle, Exercise, Doctor Advice) into summary for AIExplanationCard
  const enrichedSummary: ApiSummary | null = useMemo(() => {
    if (!parsedSummary && !rawSummarySource && usableValues.length === 0) return null;
    const base: ApiSummary = parsedSummary ? { ...parsedSummary } : {};

    const collectUnique = (field: keyof LabValue): string[] => {
      const set = new Set<string>();
      // Prioritize abnormal findings first, then normal findings
      const sorted = [...usableValues].sort(
        (a, b) => (isAbnormalStatus(b.status) ? 1 : 0) - (isAbnormalStatus(a.status) ? 1 : 0)
      );
      sorted.forEach((v) => {
        const val = v[field];
        if (Array.isArray(val)) {
          val.forEach((item) => {
            if (item && typeof item === 'string' && item.trim()) {
              set.add(item.trim());
            }
          });
        }
      });
      return Array.from(set);
    };

    if (!base.recommended_diet?.length) {
      const diet = collectUnique('recommendedFoods');
      if (diet.length) base.recommended_diet = diet;
    }
    if (!base.foods_to_avoid?.length) {
      const avoid = collectUnique('foodsToAvoid');
      if (avoid.length) base.foods_to_avoid = avoid;
    }
    if (!base.recommended_fruits?.length) {
      const fruits = collectUnique('recommendedFruits');
      if (fruits.length) base.recommended_fruits = fruits;
    }
    if (!base.recommended_juices?.length) {
      const juices = collectUnique('recommendedJuices');
      if (juices.length) base.recommended_juices = juices;
    }
    if (!base.recommended_leafy_vegetables?.length) {
      const veg = collectUnique('recommendedVegetables');
      if (veg.length) base.recommended_leafy_vegetables = veg;
    }
    if (!base.protein_recommendations?.length) {
      const protein = collectUnique('proteinSuggestions');
      if (protein.length) base.protein_recommendations = protein;
    }
    if (!base.exercise_recommendations?.length) {
      const exercise = collectUnique('exercise');
      if (exercise.length) base.exercise_recommendations = exercise;
    }
    if (!base.sleep_recommendations?.length) {
      const sleep = collectUnique('sleepTips');
      if (sleep.length) base.sleep_recommendations = sleep;
    }
    if (!base.lifestyle_changes?.length) {
      const lifestyle = collectUnique('lifestyleTips');
      if (lifestyle.length) base.lifestyle_changes = lifestyle;
    }
    if (!base.precautions?.length) {
      const precautions = collectUnique('precautions');
      if (precautions.length) base.precautions = precautions;
    }
    if (!base.symptoms_patient_may_feel?.length) {
      const symptoms = collectUnique('symptoms');
      if (symptoms.length) base.symptoms_patient_may_feel = symptoms;
    }
    if (!base.water_intake) {
      const firstWater = usableValues.find((v) => v.waterIntake)?.waterIntake;
      if (firstWater) base.water_intake = firstWater;
    }
    if (!base.doctor_consultation_needed) {
      const abnormalWithDoc = usableValues.find((v) => isAbnormalStatus(v.status) && v.doctorAdvice);
      if (abnormalWithDoc?.doctorAdvice) {
        base.doctor_consultation_needed = abnormalWithDoc.doctorAdvice;
      }
    }

    return base;
  }, [parsedSummary, rawSummarySource, usableValues]);

  const summaryToRender = useMemo(() => {
    if (enrichedSummary) return JSON.stringify(enrichedSummary);
    return rawSummarySource;
  }, [enrichedSummary, rawSummarySource]);

  const isUnanalyzable = usableValues.length === 0 && detectedMedicines.length === 0;

  const grouped = useMemo(() => {
    if (viewMode === 'category') {
      const map = new Map<string, LabValue[]>();
      const order = ['Abnormal', 'Normal'];
      usableValues.forEach((v) => {
        const key = isAbnormalStatus(v.status) ? 'Abnormal' : 'Normal';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(v);
      });
      return order
        .filter((k) => map.has(k))
        .map((k) => ({ title: k, items: map.get(k)! }));
    }

    const map = new Map<string, LabValue[]>();
    usableValues.forEach((v) => {
      const key = categorizeParam(v.name);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    const preferred = [
      'Blood Cells',
      'Red Blood Cells',
      'White Blood Cells (Differential)',
      'Lipid Profile',
      'Diabetes',
      'Thyroid',
      'Liver',
      'Kidney',
      'Vitamins & Minerals',
      'Other Parameters',
    ];
    const titles = [
      ...preferred.filter((p) => map.has(p)),
      ...Array.from(map.keys()).filter((k) => !preferred.includes(k)),
    ];
    return titles.map((title) => ({ title, items: map.get(title)! }));
  }, [usableValues, viewMode]);

  const toggleExpand = (key: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isSectionCollapsed = (title: string) => collapsedSections[title] !== false;

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: prev[title] === false ? true : false,
    }));
  };

  const callTranslateApi = async (text: string, langCode: string): Promise<string> => {
    if (!text || !text.trim()) return '';
    try {
      const res = await api.request<any>(ENDPOINTS.translateTextPath, {
        method: 'POST',
        body: JSON.stringify({ text, language: langCode }),
      });
      return res?.translate_text ?? res?.translated_text ?? text;
    } catch (err) {
      console.warn('[Translation] API call error:', err);
      return text;
    }
  };

  const handleTranslate = async (langCode: string, langName: string) => {
    setTranslating(true);
    try {
      if (params.narrative) {
        setTranslatedNarrative(await callTranslateApi(params.narrative, langCode));
      }
      if (params.summary) {
        let parsed: ApiSummary | null = null;
        try {
          parsed = JSON.parse(params.summary);
        } catch {
          /* plain */
        }
        if (parsed) {
          const translatedObj: ApiSummary = { ...parsed };
          const keysToTranslate: { key: keyof ApiSummary; index?: number; subkey?: string }[] = [];
          const textToTranslate: string[] = [];
          const addText = (
            key: keyof ApiSummary,
            text: string,
            index?: number,
            subkey?: string,
          ) => {
            if (!text || typeof text !== 'string') return;
            keysToTranslate.push({ key, index, subkey });
            textToTranslate.push(text);
          };
          addText('overall_health', parsed.overall_health as string);
          addText('ai_summary', parsed.ai_summary as string);
          addText('condition_severity', parsed.condition_severity as string);
          addText('patient_friendly_explanation', parsed.patient_friendly_explanation as string);
          addText('doctor_consultation_needed', parsed.doctor_consultation_needed as string);
          addText('water_intake', parsed.water_intake as string);
          addText('emergency_warning', parsed.emergency_warning as string);
          (
            [
              'abnormal_findings',
              'important_risks',
              'what_patient_should_do_next',
              'symptoms_patient_may_feel',
              'next_tests_recommended',
              'questions_to_ask_doctor',
              'recommended_diet',
              'foods_to_avoid',
              'recommended_fruits',
              'recommended_juices',
              'recommended_leafy_vegetables',
              'protein_recommendations',
              'exercise_recommendations',
              'sleep_recommendations',
              'lifestyle_changes',
              'precautions',
            ] as (keyof ApiSummary)[]
          ).forEach((field) => {
            const arr = parsed![field];
            if (Array.isArray(arr)) arr.forEach((item, i) => addText(field, item as string, i));
          });
          if (textToTranslate.length > 0) {
            const delimiter = '\n|||\n';
            const translatedCombined = await callTranslateApi(
              textToTranslate.join(delimiter),
              langCode,
            );
            const translatedPieces = translatedCombined.split(/\|\|\|/g).map((s) => s.trim());
            if (translatedPieces.length === textToTranslate.length) {
              keysToTranslate.forEach((meta, idx) => {
                const trText = translatedPieces[idx];
                if (!trText) return;
                if (meta.index !== undefined) {
                  if (meta.subkey) {
                    if (!translatedObj[meta.key]) {
                      translatedObj[meta.key] = JSON.parse(JSON.stringify(parsed![meta.key]));
                    }
                    (translatedObj[meta.key] as any)[meta.index][meta.subkey] = trText;
                  } else {
                    if (!translatedObj[meta.key]) translatedObj[meta.key] = [] as any;
                    (translatedObj[meta.key] as any)[meta.index] = trText;
                  }
                } else {
                  (translatedObj as any)[meta.key] = trText;
                }
              });
            }
          }
          setTranslatedSummary(JSON.stringify(translatedObj));
        } else {
          setTranslatedSummary(await callTranslateApi(params.summary, langCode));
        }
      }
      Alert.alert('Success', `Translated details into ${langName}!`);
    } catch (e) {
      console.warn('[Translation] Failed to translate analysis:', e);
      Alert.alert('Translation Error', 'Failed to translate details. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSharePdf = async () => {
    setSharing(true);
    try {
      const valuesRows = usableValues
        .map(
          (v) => `
        <tr>
          <td>${escapeHtml(v.name)}</td>
          <td>${escapeHtml(v.value)}</td>
          <td>${escapeHtml(v.range)}</td>
          <td style="color:${isAbnormalStatus(v.status) ? '#DC2626' : '#16A34A'};
                     font-weight:700; text-transform:capitalize;">${escapeHtml(v.status)}</td>
        </tr>
      `,
        )
        .join('');

      const aiSummaryText =
        parsedSummary?.ai_summary ??
        parsedSummary?.patient_friendly_explanation ??
        translatedNarrative ??
        params.narrative ??
        (typeof rawSummarySource === 'string' ? rawSummarySource : '');

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #1F2937; }
              h1 { font-size: 22px; margin-bottom: 4px; }
              .meta { color: #6B7280; font-size: 13px; margin-bottom: 16px; }
              h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; }
              table { width: 100%; border-collapse: collapse; font-size: 13px; }
              th, td { text-align: left; padding: 8px; border-bottom: 1px solid #E5E7EB; }
              th { background: #F9FAFB; }
              .footer { margin-top: 32px; font-size: 11px; color: #9CA3AF; text-align: center; }
            </style>
          </head>
          <body>
            <h1>Full Results</h1>
            <div class="meta">
              Patient: ${escapeHtml(params.patientName ?? '—')} | Hospital: ${escapeHtml(params.hospitalName ?? '—')}
            </div>
            <h2>AI Overall Summary</h2>
            <p style="font-size:14px; line-height:1.6; margin-bottom:24px;">${escapeHtml(aiSummaryText)}</p>
            <h2>Lab Values Detail</h2>
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Value</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${valuesRows}</tbody>
            </table>
            <div class="footer">
              Generated by HealthAI on ${new Date().toLocaleDateString()}. Keep your health records secure.
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Report PDF',
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message ?? 'Could not generate PDF.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Full Results</Text>
        <Pressable
          style={styles.iconBtn}
          onPress={() => setLangModalOpen(true)}
          disabled={translating}
          hitSlop={8}
        >
          {translating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="language" size={20} color={Colors.text} />
          )}
        </Pressable>
        <Pressable
          style={styles.iconBtn}
          onPress={handleSharePdf}
          disabled={sharing}
          hitSlop={8}
        >
          {sharing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="share-outline" size={22} color={Colors.text} />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {params.patientName ? (
          <Text style={styles.meta}>
            {params.patientName}
            {params.hospitalName ? ` · ${params.hospitalName}` : ''}
          </Text>
        ) : null}

        {/* ── User's Question & AI Answer Card (Scenario 2 Unified Query) ── */}
        {userQA && userQA.question ? (
          <View style={styles.userQACard}>
            <View style={styles.qaHeader}>
              <View style={styles.qaHeaderLeft}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#0F6E56" />
                <Text style={styles.qaBadgeText}>YOUR QUESTION & AI ANSWER</Text>
              </View>
            </View>

            <View style={styles.userQuestionBox}>
              <Text style={styles.userQuestionLabel}>Q:</Text>
              <Text style={styles.userQuestionText}>"{userQA.question}"</Text>
            </View>

            <View style={styles.qaDivider} />

            <View style={styles.aiAnswerBox}>
              <View style={styles.aiAnswerIconRow}>
                <Ionicons name="sparkles" size={15} color="#0F6E56" />
                <Text style={styles.aiAnswerTitle}>AI Clinical Assessment:</Text>
              </View>
              <Text style={styles.aiAnswerText}>
                {userQA.answer ||
                  (usableValues.length > 0
                    ? `Based on the extracted lab parameters, we have analyzed this report regarding your inquiry. Please review the abnormal and normal parameters below.`
                    : `Your query has been recorded. Review the extracted report data below.`)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Health score overview (previous Report Analysis) */}
        {!isUnanalyzable && (
          <AnalysisSummaryCard
            abnormalCount={abnormal.length}
            totalCount={usableValues.length}
            abnormalValues={abnormal}
            healthScore={parsedSummary?.health_score}
            conditionSeverity={parsedSummary?.condition_severity}
            conditionColor={parsedSummary?.condition_color}
          />
        )}

        {/* AI insights: simple words, risks, next steps, symptoms, doctor, diet, etc. */}
        {(rawSummarySource || translatedNarrative || params.narrative) ? (
          <View style={styles.insightsWrap}>
            {(translatedNarrative ?? params.narrative) ? (
              <View style={styles.narrativeCard}>
                <View style={styles.narrativeHeader}>
                  <Ionicons name="sparkles" size={14} color={Colors.primary} />
                  <Text style={styles.narrativeLabel}>AI Overview</Text>
                </View>
                <Text style={styles.narrativeText}>
                  {translatedNarrative ?? params.narrative}
                </Text>
              </View>
            ) : null}
            {summaryToRender ? <AIExplanationCard text={summaryToRender} /> : null}
          </View>
        ) : null}

        {!isUnanalyzable && abnormal.length > 0 && (
          <AbnormalChipsCard
            abnormalValues={abnormal}
            abnormalCount={abnormal.length}
          />
        )}

        {isUnanalyzable && (
          <View style={styles.emptyStateCard}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.emptyStateTitle}>We couldn't analyze this report</Text>
            <Text style={styles.emptyStateText}>
              The provided file or text did not contain any readable lab values or medicines. Please upload a clear medical report or prescription.
            </Text>
            <Pressable style={styles.uploadBtn} onPress={() => router.replace('/(tabs)/reports')}>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload a new report</Text>
            </Pressable>
          </View>
        )}

        {!isUnanalyzable && (
          <>
            {/* Segmented control */}
            <View style={styles.segment}>
              <Pressable
                style={[styles.segmentBtn, viewMode === 'parameter' && styles.segmentBtnActive]}
                onPress={() => setViewMode('parameter')}
              >
                <Text
                  style={[styles.segmentTxt, viewMode === 'parameter' && styles.segmentTxtActive]}
                >
                  By Parameter
                </Text>
                {viewMode === 'parameter' && <View style={styles.segmentUnderline} />}
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, viewMode === 'category' && styles.segmentBtnActive]}
                onPress={() => setViewMode('category')}
              >
                <Text
                  style={[styles.segmentTxt, viewMode === 'category' && styles.segmentTxtActive]}
                >
                  By Category
                </Text>
                {viewMode === 'category' && <View style={styles.segmentUnderline} />}
              </Pressable>
            </View>

            {/* Guide/Legend */}
            {usableValues.length > 0 && (
              <View style={styles.guideBox}>
                <View style={styles.guideRow}>
                  <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.guideTitle}>How to read these values</Text>
                </View>
                <Text style={styles.guideText}>
                  <Text style={{ color: '#16A34A', fontWeight: '600' }}>Normal:</Text> Within the standard reference range.
                </Text>
                <Text style={styles.guideText}>
                  <Text style={{ color: '#D97706', fontWeight: '600' }}>Low</Text> / <Text style={{ color: '#DC2626', fontWeight: '600' }}>High:</Text> Outside the reference range; may require attention.
                </Text>
              </View>
            )}


            {usableValues.length === 0 ? (
              <Text style={styles.empty}>No values to show.</Text>
            ) : (
              grouped.map((g) => (
                <CategorySection
                  key={g.title}
                  title={g.title}
                  items={g.items}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  collapsed={isSectionCollapsed(g.title)}
                  onToggleCollapse={() => toggleSection(g.title)}
                />
              ))
            )}

            {detectedMedicines.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Medicines Detected</Text>
                <View style={styles.sectionCard}>
                  {detectedMedicines.map((m, i) => (
                    <View
                      key={m.name}
                      style={[styles.medRow, i > 0 && styles.rowDivider]}
                    >
                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() =>
                          router.push({
                            pathname: '/medicines/browse',
                            params: { query: m.name },
                          })
                        }
                      >
                        <Text style={styles.resultName}>{m.name}</Text>
                        <Text style={styles.expandText} numberOfLines={2}>
                          {m.reason}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.analysisReminderBtn}
                        onPress={() =>
                          router.push({
                            pathname: '/medicines/reminders/new',
                            params: {
                              medicineName: m.name,
                              frequency: 'daily',
                              whenToTake: 'after_food',
                              time: '08:00 AM',
                              totalCount: '10',
                            },
                          })
                        }
                      >
                        <Ionicons name="notifications-outline" size={13} color="#0284C7" />
                        <Text style={styles.analysisReminderBtnText}>Reminder</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Ask HealthAI CTA */}
            <View style={styles.askBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.askTitle}>Want to understand your results better?</Text>
                <Text style={styles.askSub}>Ask HealthAI for a detailed explanation.</Text>
                <Pressable
                  style={styles.askBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/ai-chat',
                      params: {
                        prefill: `My ${params.reportType ?? 'report'} shows ${abnormal.length} abnormal value${abnormal.length !== 1 ? 's' : ''}${parsedSummary?.condition_severity ? ` and overall status is ${parsedSummary.condition_severity}` : ''}. What does this mean and what should I do?`,
                        context: params.summary ?? '',
                      },
                    })
                  }
                >
                  <Text style={styles.askBtnText}>Ask HealthAI</Text>
                </Pressable>
              </View>
              <View style={styles.askArt}>
                <Ionicons name="chatbubbles" size={28} color={Colors.primary} />
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={Colors.primary}
                  style={{ position: 'absolute', top: 2, right: 2 }}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <LanguageSelectModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        onSelect={handleTranslate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },

  meta: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  insightsWrap: { gap: 12 },
  narrativeCard: {
    backgroundColor: Colors.primary + '0D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: 14,
    gap: 8,
  },
  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  narrativeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  narrativeText: { fontSize: 14, color: Colors.text, lineHeight: 22 },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
  },
  segmentTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  segmentTxtActive: {
    color: Colors.primary,
  },
  segmentUnderline: {
    marginTop: 6,
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },

  sectionWrap: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  guideBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  guideTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  guideText: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  resultLeft: { flex: 1.3, minWidth: 0, gap: 2 },
  resultName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  resultValue: { fontSize: 14, fontWeight: '800', color: Colors.text },
  resultRange: { flex: 1.1, fontSize: 11, color: Colors.textMuted },
  resultStatus: { fontSize: 12, fontWeight: '700', minWidth: 52, textAlign: 'right' },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 14,
  },

  expandMetaWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2 },
  expandMetaLabel: { fontSize: 12, fontWeight: '700', color: Colors.danger },
  expandMetaVal: { fontSize: 12, color: Colors.text, fontWeight: '500' },
  symptomsWrap: { gap: 4, marginTop: 4 },
  symptomsTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  symptomsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  symptomPill: {
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  symptomText: { fontSize: 11, fontWeight: '600', color: Colors.danger },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 2,
  },
  adviceText: { fontSize: 11, color: '#0369A1', lineHeight: 16, flex: 1 },
  expandBox: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: '#F8FAFC',
  },
  expandText: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  expandMeta: { fontSize: 12, color: Colors.text, fontWeight: '500' },
  askChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '14',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  askChipText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  viewMoreText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  analysisReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  analysisReminderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  askBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 16,
  },
  askTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  askSub: { marginTop: 4, fontSize: 12, color: '#15803D', lineHeight: 17 },
  askBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  askBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  askArt: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
  },

  emptyStateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── User Question & AI Answer Card ──
  userQACard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C6E7DE',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F6E56',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  qaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 110, 86, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qaBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F6E56',
    letterSpacing: 0.5,
  },
  userQuestionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 4,
  },
  userQuestionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F6E56',
  },
  userQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B2A',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  qaDivider: {
    height: 1,
    backgroundColor: '#E4E8E6',
    marginVertical: 10,
  },
  aiAnswerBox: {
    gap: 6,
  },
  aiAnswerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiAnswerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F6E56',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  aiAnswerText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#2C3E3A',
    lineHeight: 20,
  },
});
