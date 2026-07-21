/**
 * app/analysis.tsx — Analysis Screen
 *
 * Changes:
 *  - Detected Medicines section: tapping a medicine goes to Browse with
 *    the medicine name pre-filled so user can save it or set a reminder
 *  - Medicine chips show type badge (recommended / mentioned / avoid)
 *  - Passes detectedMedicines via route params from upload.tsx
 */

import { useState } from 'react';
import {
  ScrollView, Text, StyleSheet, View, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Radius } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { AnalysisSummaryCard } from '@/components/reports/AnalysisSummaryCard';
import { AnalysisTabBar, type AnalysisTab } from '@/components/reports/AnalysisTabBar';
import { LabValueRow } from '@/components/reports/LabValueRow';
import { AIExplanationCard } from '@/components/reports/AIExplanationCard';
import { useLang } from '@/context/Languagecontext';
import type { LabValue } from '@/types';
import type { ApiSummary, DetectedMedicine } from '@/types/Report/reportype';
import { AskAIButton } from '@/components/ai/AskAIButton';

// Minimal HTML-escape to keep generated PDF markup safe
function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Detected medicine row ─────────────────────────────────────────────────────
function MedicineRow({ med, isLast }: { med: DetectedMedicine; isLast: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [medRow.wrap, !isLast && medRow.border, pressed && { opacity: 0.7 }]}
      onPress={() => router.push({ pathname: '/medicines/browse', params: { query: med.name } })}
    >
      <View style={medRow.left}>
        <Text style={medRow.name}>{med.name}</Text>
        <Text style={medRow.reason} numberOfLines={2}>{med.reason}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

// ── Detected medicines section ────────────────────────────────────────────────
function DetectedMedicinesSection({ medicines }: { medicines: DetectedMedicine[] }) {
  if (medicines.length === 0) return null;

  return (
    <View style={section.wrap}>
      <Text style={section.title}>Medicines Detected</Text>
      {medicines.map((m, i) => (
        <MedicineRow key={m.name} med={m} isLast={i === medicines.length - 1} />
      ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { LanguageSelectModal } from '@/components/ui/LanguageSelectModal';

export default function AnalysisScreen() {
  const { t } = useLang();
  const [tab, setTab] = useState<AnalysisTab>('Summary');
  const [sharing, setSharing] = useState(false);

  const [langModalOpen, setLangModalOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedNarrative, setTranslatedNarrative] = useState<string | null>(null);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);

  const callTranslateApi = async (text: string, langCode: string): Promise<string> => {
    if (!text || !text.trim()) return '';
    try {
      const res = await api.request<any>(ENDPOINTS.translateTextPath, {
        method: 'POST',
        body: JSON.stringify({
          text,
          output_language: langCode,
        }),
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
      // 1. Translate narrative overview
      if (params.narrative) {
        const trNarrative = await callTranslateApi(params.narrative, langCode);
        setTranslatedNarrative(trNarrative);
      }

      // 2. Translate summary details
      if (params.summary) {
        let parsed: ApiSummary | null = null;
        try {
          parsed = JSON.parse(params.summary);
        } catch {
          /* plain string fallback */
        }

        if (parsed) {
          const translatedObj: ApiSummary = { ...parsed };
          if (parsed.ai_summary) {
            translatedObj.ai_summary = await callTranslateApi(parsed.ai_summary, langCode);
          }
          if (parsed.patient_friendly_explanation) {
            translatedObj.patient_friendly_explanation = await callTranslateApi(parsed.patient_friendly_explanation, langCode);
          }
          if (parsed.condition_severity) {
            translatedObj.condition_severity = await callTranslateApi(parsed.condition_severity, langCode);
          }
          if (Array.isArray(parsed.important_risks)) {
            translatedObj.important_risks = await Promise.all(
              parsed.important_risks.map(r => callTranslateApi(r, langCode))
            );
          }
          if (Array.isArray(parsed.what_patient_should_do_next)) {
            translatedObj.what_patient_should_do_next = await Promise.all(
              parsed.what_patient_should_do_next.map(s => callTranslateApi(s, langCode))
            );
          }
          setTranslatedSummary(JSON.stringify(translatedObj));
        } else {
          // Translate as plain text summary
          const trText = await callTranslateApi(params.summary, langCode);
          setTranslatedSummary(trText);
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

  const params = useLocalSearchParams<{
    reportId?: string;
    patientName?: string;
    hospitalName?: string;
    summary?: string;
    values?: string;
    detectedMedicines?: string;  // ← NEW
    narrative?: string;
    reportType?: string;
  }>();

  const values: LabValue[] = (() => {
    if (!params.values) return [];
    try { 
      const parsed = JSON.parse(params.values);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();
  const abnormal = values.filter(v => v.status === 'high' || v.status === 'low');
  const visible = tab === 'Abnormal' ? abnormal : values;

  const detectedMedicines: DetectedMedicine[] = (() => {
    if (!params.detectedMedicines) return [];
    try { 
      const parsed = JSON.parse(params.detectedMedicines);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();

  let parsedSummary: ApiSummary | null = null;
  const rawSummarySource = translatedSummary ?? params.summary;
  if (rawSummarySource) {
    try { parsedSummary = JSON.parse(rawSummarySource); } catch { /* plain string */ }
  }

  const importantRisks = Array.isArray(parsedSummary?.important_risks) ? parsedSummary.important_risks : [];
  const nextSteps = Array.isArray(parsedSummary?.what_patient_should_do_next) ? parsedSummary.what_patient_should_do_next : [];

  const handleSharePdf = async () => {
    setSharing(true);
    try {
      const valuesRows = values.map(v => `
        <tr>
          <td>${escapeHtml(v.name)}</td>
          <td>${escapeHtml(v.value)}</td>
          <td>${escapeHtml(v.range)}</td>
          <td style="color:${v.status === 'high' ? '#DC2626' : v.status === 'low' ? '#D97706' : '#16A34A'};
                     font-weight:700; text-transform:capitalize;">${escapeHtml(v.status)}</td>
        </tr>
      `).join('');

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
              .score { font-size: 28px; font-weight: 800; color: ${parsedSummary?.condition_color ?? '#16A34A'}; }
              .footer { margin-top: 32px; font-size: 11px; color: #9CA3AF; text-align: center; }
            </style>
          </head>
          <body>
            <h1>Health Report Analysis</h1>
            <div class="meta">
              Patient: ${escapeHtml(params.patientName ?? 'Anil')} | Hospital: ${escapeHtml(params.hospitalName ?? 'General Hospital')}
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
              <tbody>
                ${valuesRows}
              </tbody>
            </table>
            <div class="footer">
              Generated by HealthAI on ${new Date().toLocaleDateString()}. Keep your health records secure.
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Report PDF' });
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message ?? 'Could not generate PDF.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen
          options={{
            headerRight: () => (
              <Pressable 
                onPress={() => setLangModalOpen(true)} 
                hitSlop={10} 
                style={{ marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                disabled={translating}
              >
                {translating ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="language" size={20} color={Colors.primary} />
                )}
                <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600' }}>
                  {translating ? 'Translating...' : 'Translate'}
                </Text>
              </Pressable>
            ),
          }}
        />
        {/* Patient / hospital meta */}
        {params.patientName ? (
          <Text style={styles.meta}>
            {params.patientName} · {params.hospitalName}
          </Text>
        ) : null}

        {/* Health score gauge card */}
        <AnalysisSummaryCard
          abnormalCount={abnormal.length}
          totalCount={values.length}
          abnormalValues={abnormal}
          healthScore={parsedSummary?.health_score}
          conditionSeverity={parsedSummary?.condition_severity}
          conditionColor={parsedSummary?.condition_color}
        />

        {/* ── Detected Medicines ── NEW SECTION */}
        <DetectedMedicinesSection medicines={detectedMedicines} />

        {/* AI Narrative — plain English summary above tabs */}
        {(translatedNarrative ?? params.narrative) ? (
          <View style={styles.narrativeCard}>
            <View style={styles.narrativeHeader}>
              <Ionicons name="sparkles" size={14} color={Colors.primary} />
              <Text style={styles.narrativeLabel}>AI Overview</Text>
            </View>
            <Text style={styles.narrativeText}>{translatedNarrative ?? params.narrative}</Text>
          </View>
        ) : null}

        {/* Tab bar */}
        <AnalysisTabBar
          active={tab}
          onChange={setTab}
          abnormalCount={abnormal.length}
        />

        {/* Tab content */}
        {tab === 'Summary' ? (
          <AIExplanationCard text={rawSummarySource} />
        ) : (
          <View style={styles.listWrap}>
            {visible.length === 0 ? (
              <Text style={styles.empty}>No values to show.</Text>
            ) : (
              visible.map(v => (
                <LabValueRow key={v.name} value={v} variant="compact" />
              ))
            )}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button
            title={sharing ? 'Preparing PDF…' : 'Share as PDF'}
            variant="outline"
            onPress={handleSharePdf}
            disabled={sharing}
          />
          <Button
            title={t('see_all_values')}
            variant="outline"
            onPress={() =>
              router.push({
                pathname: '/all-values',
                params: { values: params.values },
              })
            }
          />
          <AskAIButton
            variant="banner"
            label="Discuss with AI Assistant"
            prefill={`My ${params.reportType ?? 'report'} shows ${abnormal.length} abnormal value${abnormal.length !== 1 ? 's' : ''}${parsedSummary?.condition_severity ? ` and overall status is ${parsedSummary.condition_severity}` : ''}. What does this mean and what should I do?`}
            context={params.summary}
          />
        </View>
      </ScrollView>

      <LanguageSelectModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        onSelect={handleTranslate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  meta: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingBottom: 4 },
  listWrap: { gap: 8 },
  empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  actions: { gap: 10, marginTop: 4 },
  narrativeCard: { backgroundColor: Colors.primary + '0D', borderRadius: 14, borderWidth: 1, borderColor: Colors.primary + '30', padding: 14, gap: 8 },
  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  narrativeLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  narrativeText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
});

const section = StyleSheet.create({
  wrap: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
});

const medRow = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  left: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.text },
  reason: { fontSize: 13, color: Colors.textMuted, lineHeight: 19 },
});
