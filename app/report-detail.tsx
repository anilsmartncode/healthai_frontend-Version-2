/**
 * app/report-detail.tsx  — Report Details Screen
 *
 * Shows: report preview card, health score, key findings.
 * "View Report" button opens the original PDF/image file.
 * Nav: Back → Reports List | Forward → Health Scorecard (/scorecard)
 */

import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Radius } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { reportsApi, renameReport, type ReportListItem, type AnalyzeResult } from '@/services/reportsApi';
import { AskAIButton } from '@/components/ai/AskAIButton';
import { AnalysisSummaryCard } from '@/components/reports/AnalysisSummaryCard';
import type { ApiSummary, LabValue } from '@/types/Report/reportype';

// ── View report helper ────────────────────────────────────────────────────────
async function openReportFile(
  fileUri: string | null | undefined,
  fileType: 'PDF' | 'IMAGE',
) {
  if (!fileUri) {
    Alert.alert(
      'File not available',
      'The original file for this report is no longer stored on this device. ' +
      'Re-upload the report to view it again.',
    );
    return;
  }

  try {
    // expo-sharing: opens the native share sheet (viewer + share options)
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: fileType === 'PDF' ? 'application/pdf' : 'image/jpeg',
        dialogTitle: 'Open report',
        UTI: fileType === 'PDF' ? 'com.adobe.pdf' : 'public.image',
      });
    } else {
      // Fallback for web / simulators — open in browser
      await WebBrowser.openBrowserAsync(fileUri);
    }
  } catch (e: any) {
    Alert.alert('Cannot open file', e?.message ?? 'Unknown error');
  }
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { phone } = useAuth();
  const [report, setReport] = useState<(ReportListItem & Partial<AnalyzeResult>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  // Rename state
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  useEffect(() => {
    reportsApi.getById(id ?? '', phone).then(r => {
      setReport(r);
      setLoading(false);
    });
  }, [id]);

  const handleViewReport = async () => {
    if (!report) return;
    setOpening(true);
    await openReportFile(report.fileUri, report.fileType);
    setOpening(false);
  };

  const handleSaveRename = async () => {
    if (!report || !newName.trim()) return;
    setSavingRename(true);
    await renameReport(report.id, newName, phone);
    setReport({ ...report, title: newName.trim() });
    setSavingRename(false);
    setShowRename(false);
  };

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

  const hasFile = !!report.fileUri;

  // Parse summary (JSON-stringified ApiSummary) the same way analysis.tsx does
  let parsedSummary: ApiSummary | null = null;
  if (report.summary) {
    try { parsedSummary = JSON.parse(report.summary as unknown as string); } catch { /* plain string */ }
  }
  const values: LabValue[] = report.values ?? [];
  const abnormalValues = values.filter(v => v.status === 'high' || v.status === 'low');
  const totalCount = report.totalValues ?? values.length;
  // Prefer the count derived directly from `values` when we have them — the
  // top-level report.abnormalCount has been observed to come back as 0 from
  // the API even when values clearly contain abnormal entries.
  const abnormalCount = values.length > 0 ? abnormalValues.length : (report.abnormalCount ?? 0);

  // health_score sometimes comes back from the API with extra trailing text
  // appended (e.g. "85/100, reflecting mostly normal results..."). Extract
  // just the "N/100" portion so downstream parsing stays reliable.
  const rawHealthScore = parsedSummary?.health_score ?? `${report.healthScore}/100`;
  const healthScoreMatch = rawHealthScore.match(/\d+\s*\/\s*\d+/);
  const healthScore = healthScoreMatch ? healthScoreMatch[0].replace(/\s+/g, '') : rawHealthScore;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Report Details</Text>
        <Pressable style={styles.editBtn} onPress={() => { setNewName(report.title); setShowRename(true); }}>
          <Ionicons name="pencil" size={20} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Report Preview Card */}
        <View style={styles.previewCard}>
          {/* File type thumbnail */}
          <Pressable
            style={[styles.previewIcon, !hasFile && styles.previewIconDim]}
            onPress={handleViewReport}
            disabled={opening}
          >
            {opening ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={report.fileType === 'PDF' ? 'document-text' : 'image'}
                  size={28}
                  color={hasFile ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.fileTypeLabel, !hasFile && { color: Colors.textMuted }]}>
                  {report.fileType}
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>{report.title}</Text>
            <Text style={styles.previewMeta}>{report.date} · {report.labName}</Text>
            <View style={[styles.typeBadge, { backgroundColor: Colors.primary + '15' }]}>
              <Text style={[styles.typeBadgeText, { color: Colors.primary }]}>
                {report.reportTypeFull}
              </Text>
            </View>

            {/* ── View Report button ── */}
            <Pressable
              style={[styles.viewFileBtn, !hasFile && styles.viewFileBtnDim]}
              onPress={handleViewReport}
              disabled={opening}
            >
              <Ionicons
                name={report.fileType === 'PDF' ? 'document-outline' : 'image-outline'}
                size={15}
                color={hasFile ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.viewFileBtnText, !hasFile && { color: Colors.textMuted }]}>
                {opening ? 'Opening…' : hasFile ? 'View Report' : 'File not on device'}
              </Text>
              {hasFile && (
                <Ionicons name="open-outline" size={13} color={Colors.primary} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Health Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Score</Text>
          <AnalysisSummaryCard
            abnormalCount={abnormalCount}
            totalCount={totalCount}
            abnormalValues={abnormalValues}
            healthScore={healthScore}
            conditionSeverity={parsedSummary?.condition_severity}
            conditionColor={parsedSummary?.condition_color}
          />
        </View>

        {/* Key Findings */}
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
            {(report.borderlineCount ?? 0) > 0 && (
              <View style={[styles.findingPill, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="warning" size={16} color={Colors.warning} />
                <Text style={[styles.findingText, { color: Colors.warning }]}>
                  {report.borderlineCount} Borderline
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* View Full Analysis CTA */}
        <Pressable
          style={styles.primaryBtn}
          onPress={() =>
            report.values
              ? router.push({
                  pathname: '/analysis',
                  params: {
                    reportId:         String(report.reportId ?? ''),
                    patientName:      report.patientName ?? '',
                    hospitalName:     report.hospitalName ?? report.labName,
                    summary:          report.summary ?? '',
                    values:           JSON.stringify(report.values ?? []),
                    detectedMedicines: JSON.stringify(report.detectedMedicines ?? []),
                  },
                })
              : router.push({ pathname: '/scorecard', params: { id: report.id } })
          }
        >
          <Text style={styles.primaryBtnText}>View Full Analysis</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>

        {/* Ask AI */}
        <AskAIButton
          variant="banner"
          label="Ask AI about this report"
          prefill={`My ${report.title} report (score: ${report.healthScore ?? '?'}/100) has ${report.abnormalCount ?? 0} abnormal values. What should I know about this?`}
        />
      </ScrollView>

      {/* RENAME MODAL */}
      <Modal visible={showRename} transparent animationType="fade" onRequestClose={() => setShowRename(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Report</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter custom report name..."
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setShowRename(false)} disabled={savingRename}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalBtnSave} onPress={handleSaveRename} disabled={savingRename || !newName.trim()}>
                {savingRename ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnSaveText}>Save Name</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.bg },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn:          { padding: 4 },
  headerTitle:      { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  editBtn:          { padding: 4 },
  body:             { padding: 16, gap: 16, paddingBottom: 40 },

  previewCard:      { flexDirection: 'row', gap: 14, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'flex-start' },
  previewIcon:      { width: 60, height: 72, backgroundColor: '#EDE9FE', borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 4 },
  previewIconDim:   { backgroundColor: Colors.surface },
  fileTypeLabel:    { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  previewInfo:      { flex: 1, gap: 4 },
  previewTitle:     { fontSize: 16, fontWeight: '700', color: Colors.text },
  previewMeta:      { fontSize: 12, color: Colors.textMuted },
  typeBadge:        { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill, marginTop: 2 },
  typeBadgeText:    { fontSize: 12, fontWeight: '600' },

  viewFileBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: '#EDE9FE', borderRadius: Radius.pill, alignSelf: 'flex-start' },
  viewFileBtnDim:   { backgroundColor: Colors.surface },
  viewFileBtnText:  { fontSize: 12, fontWeight: '600', color: Colors.primary },

  section:          { gap: 10 },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: Colors.text },
  findingsRow:      { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  findingPill:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill },
  findingText:      { fontSize: 13, fontWeight: '600', color: Colors.success },
  primaryBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 16, marginTop: 8 },
  primaryBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText:        { textAlign: 'center', marginTop: 60, color: Colors.textMuted },

  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent:     { backgroundColor: '#fff', padding: 24, borderRadius: Radius.lg, gap: 16 },
  modalTitle:       { fontSize: 18, fontWeight: '700', color: Colors.text },
  modalInput:       { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: 14, height: 48, fontSize: 16 },
  modalActions:     { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalBtnCancel:   { paddingVertical: 10, paddingHorizontal: 16 },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  modalBtnSave:     { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: Colors.primary, borderRadius: Radius.md, minWidth: 100, alignItems: 'center' },
  modalBtnSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});