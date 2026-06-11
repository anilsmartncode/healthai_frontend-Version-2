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
  ScrollView, Text, StyleSheet, View, Pressable, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
export default function AnalysisScreen() {
  const { t } = useLang();
  const [tab, setTab] = useState<AnalysisTab>('Summary');

  const params = useLocalSearchParams<{
    reportId?: string;
    patientName?: string;
    hospitalName?: string;
    summary?: string;
    values?: string;
    detectedMedicines?: string;  // ← NEW
  }>();

  const values: LabValue[] = params.values ? JSON.parse(params.values) : [];
  const abnormal = values.filter(v => v.status === 'high' || v.status === 'low');
  const visible  = tab === 'Abnormal' ? abnormal : values;

  const detectedMedicines: DetectedMedicine[] = (() => {
    if (!params.detectedMedicines) return [];
    try { return JSON.parse(params.detectedMedicines); } catch { return []; }
  })();

  let parsedSummary: ApiSummary | null = null;
  if (params.summary) {
    try { parsedSummary = JSON.parse(params.summary); } catch { /* plain string */ }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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
      {params.narrative ? (
        <View style={styles.narrativeCard}>
          <View style={styles.narrativeHeader}>
            <Ionicons name="sparkles" size={14} color={Colors.primary} />
            <Text style={styles.narrativeLabel}>AI Overview</Text>
          </View>
          <Text style={styles.narrativeText}>{params.narrative}</Text>
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
        <AIExplanationCard text={params.summary} />
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
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: Colors.bg },
  content:  { padding: 16, gap: 12, paddingBottom: 40 },
  meta:     { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingBottom: 4 },
  listWrap: { gap: 8 },
  empty:    { color: Colors.textMuted, textAlign: 'center', paddingVertical: 32, fontSize: 14 },
  actions:  { gap: 10, marginTop: 4 },
  narrativeCard: { backgroundColor: Colors.primary + '0D', borderRadius: 14, borderWidth: 1, borderColor: Colors.primary + '30', padding: 14, gap: 8 },
  narrativeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  narrativeLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  narrativeText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
});

const section = StyleSheet.create({
  wrap:  { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
});

const medRow = StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  left:   { flex: 1, gap: 3 },
  name:   { fontSize: 14, fontWeight: '600', color: Colors.text },
  reason: { fontSize: 13, color: Colors.textMuted, lineHeight: 19 },
});
