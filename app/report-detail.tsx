/**
 * app/report-detail.tsx  — Report Details Screen (Screen 2 in flow)
 *
 * Shows: report preview card, health score, key findings
 * Nav: Back → Reports List | Forward → Health Scorecard (/scorecard)
 */

import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Colors, Radius } from '@/constants/Colors';
import { reportsApi, type ReportListItem, type AnalyzeResult } from '@/services/reportsApi';
import { AskAIButton } from '@/components/ai/AskAIButton';

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? Colors.success : score >= 60 ? Colors.warning : Colors.danger;
  return (
    <View style={[badge.wrap, { borderColor: color + '40', backgroundColor: color + '12' }]}>
      <Text style={[badge.score, { color }]}>{score}</Text>
      <Text style={badge.slash}>/100</Text>
      <Text style={[badge.label, { color }]}>{label}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'baseline', gap: 2, borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  score: { fontSize: 36, fontWeight: '800' },
  slash: { fontSize: 16, color: Colors.textMuted },
  label: { fontSize: 14, fontWeight: '700', marginLeft: 6 },
});

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<(ReportListItem & Partial<AnalyzeResult>) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getById(id ?? '').then(r => {
      setReport(r);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Report not found.</Text>
      </SafeAreaView>
    );
  }

  const isAttention = report.status === 'attention';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Report Details</Text>
        <Pressable style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Report Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewIcon}>
            <Ionicons name="document-text" size={36} color={Colors.primary} />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>{report.title}</Text>
            <Text style={styles.previewMeta}>{report.date} · {report.labName}</Text>
            <View style={[styles.typeBadge, { backgroundColor: Colors.primary + '15' }]}>
              <Text style={[styles.typeBadgeText, { color: Colors.primary }]}>
                {report.reportTypeFull}
              </Text>
            </View>
          </View>
        </View>

        {/* Health Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Score</Text>
          <View style={styles.scoreRow}>
            <ScoreBadge score={report.healthScore} label={report.healthLabel} />
            <View style={styles.scoreFacts}>
              <View style={styles.factRow}>
                <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                <Text style={styles.factText}>
                  {report.totalValues - report.abnormalCount} Normal values
                </Text>
              </View>
              {report.abnormalCount > 0 && (
                <View style={styles.factRow}>
                  <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.factText}>{report.abnormalCount} Abnormal</Text>
                </View>
              )}
              {report.borderlineCount > 0 && (
                <View style={styles.factRow}>
                  <View style={[styles.dot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.factText}>{report.borderlineCount} Borderline</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Key Findings pill */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Findings</Text>
          <View style={styles.findingsRow}>
            <View style={styles.findingPill}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.findingText}>{report.totalValues - report.abnormalCount} Normal</Text>
            </View>
            {report.abnormalCount > 0 && (
              <View style={[styles.findingPill, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={[styles.findingText, { color: Colors.danger }]}>
                  {report.abnormalCount} Abnormal
                </Text>
              </View>
            )}
            {report.borderlineCount > 0 && (
              <View style={[styles.findingPill, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="warning" size={16} color={Colors.warning} />
                <Text style={[styles.findingText, { color: Colors.warning }]}>
                  {report.borderlineCount} Borderline
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={styles.primaryBtn}
          onPress={() =>
            report.values
              ? router.push({
                  pathname: '/analysis',
                  params: {
                    reportId: String(report.reportId ?? ''),
                    patientName: report.patientName ?? '',
                    hospitalName: report.hospitalName ?? report.labName,
                    summary: report.summary ?? '',
                    values: JSON.stringify(report.values ?? []),
                    detectedMedicines: JSON.stringify(report.detectedMedicines ?? []),
                  },
                })
              : router.push({ pathname: '/scorecard', params: { id: report.id } })
          }
        >
          <Text style={styles.primaryBtnText}>View Full Analysis</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>

        {/* Ask AI deep link */}
        <AskAIButton
          variant="banner"
          label="Ask AI about this report"
          prefill={`My ${report.title} report (score: ${report.healthScore ?? '?'}/100) has ${report.abnormalCount ?? 0} abnormal values. What should I know about this?`}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn:       { padding: 4 },
  headerTitle:   { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  shareBtn:      { padding: 4 },
  body:          { padding: 16, gap: 16, paddingBottom: 40 },
  previewCard:   { flexDirection: 'row', gap: 14, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  previewIcon:   { width: 56, height: 72, backgroundColor: '#EDE9FE', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  previewInfo:   { flex: 1, gap: 4 },
  previewTitle:  { fontSize: 16, fontWeight: '700', color: Colors.text },
  previewMeta:   { fontSize: 12, color: Colors.textMuted },
  typeBadge:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill, marginTop: 4 },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  section:       { gap: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: Colors.text },
  scoreRow:      { flexDirection: 'row', gap: 16, alignItems: 'center' },
  scoreFacts:    { flex: 1, gap: 8 },
  factRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:           { width: 8, height: 8, borderRadius: 4 },
  factText:      { fontSize: 14, color: Colors.text },
  findingsRow:   { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  findingPill:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill },
  findingText:   { fontSize: 13, fontWeight: '600', color: Colors.success },
  primaryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 16, marginTop: 8 },
  primaryBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText:     { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
});
