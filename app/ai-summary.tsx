/**
 * app/ai-summary.tsx  — AI Summary & Analysis Screen (Screen 4 in flow)
 *
 * Receives `summary` (JSON string of ApiSummary) via route params.
 * Falls back to safe defaults if params are missing.
 */

import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors, Radius } from '@/constants/Colors';
import type { ApiSummary, DetectedMedicine } from '@/types/Report/reportype';

type Tab = 'AI Summary' | 'Explanation';

function MedicineRow({ med, isLast }: { med: DetectedMedicine; isLast: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [medStyles.row, !isLast && medStyles.border, pressed && { opacity: 0.7 }]}
      onPress={() => router.push({ pathname: '/medicines/browse', params: { query: med.name } })}
    >
      <View style={medStyles.iconWrap}>
        <Ionicons name="medkit-outline" size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={medStyles.name}>{med.name}</Text>
        <Text style={medStyles.reason}>{med.reason}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

const medStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  border:   { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  name:     { fontSize: 14, fontWeight: '600', color: Colors.text },
  reason:   { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});

export default function AISummaryScreen() {
  const params = useLocalSearchParams<{ id?: string; summary?: string; detectedMedicines?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('AI Summary');

  // Parse summary from params (passed from scorecard → ai-summary)
  const summary: ApiSummary | null = (() => {
    if (!params.summary) return null;
    try { return JSON.parse(params.summary); } catch { return null; }
  })();

  const detectedMedicines: DetectedMedicine[] = (() => {
    if (!params.detectedMedicines) return [];
    try { return JSON.parse(params.detectedMedicines); } catch { return []; }
  })();

  const aiSummary        = summary?.ai_summary        ?? summary?.overall_health ?? 'No summary available.';
  const explanation      = summary?.patient_friendly_explanation ?? '';
  const recommendations  = summary?.what_patient_should_do_next ?? summary?.recommendations ?? [];
  const importantRisks   = summary?.important_risks ?? summary?.abnormal_findings ?? [];
  const nextTests        = summary?.next_tests_recommended ?? [];
  const doctorNote       = summary?.doctor_consultation_needed ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>AI Summary</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['AI Summary', 'Explanation'] as Tab[]).map(t => (
          <Pressable
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {activeTab === 'AI Summary' ? (
          <>
            {/* AI Summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>AI Summary</Text>
              <Text style={styles.bodyText}>{aiSummary}</Text>
            </View>

            {/* Important risks */}
            {importantRisks.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Important Findings</Text>
                {importantRisks.map((r, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: Colors.warning }]} />
                    <Text style={styles.bulletText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recommendations</Text>
                {recommendations.map((r, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Doctor note */}
            {doctorNote ? (
              <View style={[styles.card, styles.doctorCard]}>
                <Ionicons name="medical-outline" size={16} color={Colors.primary} />
                <Text style={styles.doctorText}>{doctorNote}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            {/* Plain language explanation */}
            {explanation ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>What this means</Text>
                <Text style={styles.bodyText}>{explanation}</Text>
              </View>
            ) : null}

            {/* Detected Medicines — tappable to search */}
            {detectedMedicines.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Medicines Detected</Text>
                {detectedMedicines.map((m, i) => (
                  <MedicineRow key={m.name} med={m} isLast={i === detectedMedicines.length - 1} />
                ))}
              </View>
            )}

            {/* Next tests */}
            {nextTests.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Next Tests Recommended</Text>
                {nextTests.map((t, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* CTA */}
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push({
            pathname: '/medicine-actions',
            params: {
              id: params.id,
              detectedMedicines: params.detectedMedicines ?? '[]',
            },
          })}
        >
          <Text style={styles.primaryBtnText}>Medicine & Actions</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn:        { padding: 4 },
  headerTitle:    { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  tabRow:         { flexDirection: 'row', borderBottomWidth: 1.5, borderColor: Colors.border, marginHorizontal: 16, marginBottom: 4 },
  tab:            { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:      { borderBottomWidth: 2.5, borderColor: Colors.primary },
  tabText:        { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive:  { color: Colors.primary },
  body:           { padding: 16, gap: 14, paddingBottom: 40 },
  card:           { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 8 },
  cardTitle:      { fontSize: 15, fontWeight: '700', color: Colors.text },
  bodyText:       { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },
  bulletRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet:         { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 7, flexShrink: 0 },
  bulletText:     { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22 },
  doctorCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.primary + '08' },
  doctorText:     { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 16, marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
