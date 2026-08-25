/**
 * app/report-detail.tsx — Report Details (Summary / Results / Trends / About)
 * UI matched to Care Hub design. Keeps open file, rename, analysis navigation.
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Radius } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  reportsApi,
  renameReport,
  type ReportListItem,
  type AnalyzeResult,
} from '@/services/reportsApi';
import type { ApiSummary, LabValue } from '@/types/Report/reportype';

type TabKey = 'Summary' | 'Results';

const TABS: TabKey[] = ['Summary', 'Results'];

async function openReportFile(
  fileUri: string | null | undefined,
  fileType: 'PDF' | 'IMAGE',
) {
  if (!fileUri) {
    Alert.alert(
      'File not available',
      'The original file for this report is no longer stored on this device. Re-upload the report to view it again.',
    );
    return;
  }
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: fileType === 'PDF' ? 'application/pdf' : 'image/jpeg',
        dialogTitle: 'Open report',
        UTI: fileType === 'PDF' ? 'com.adobe.pdf' : 'public.image',
      });
    } else {
      await WebBrowser.openBrowserAsync(fileUri);
    }
  } catch (e: any) {
    Alert.alert('Cannot open file', e?.message ?? 'Unknown error');
  }
}

function statusLabel(status: LabValue['status']) {
  if (status === 'high') return { label: 'High', bg: '#FEE2E2', color: '#DC2626' };
  if (status === 'low') return { label: 'Low', bg: '#FEF3C7', color: '#D97706' };
  return { label: 'Normal', bg: '#DCFCE7', color: '#15803D' };
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { phone } = useAuth();
  const [report, setReport] = useState<(ReportListItem & Partial<AnalyzeResult>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [tab, setTab] = useState<TabKey>('Summary');

  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  useEffect(() => {
    reportsApi.getById(id ?? '', phone).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [id, phone]);

  const handleViewReport = async () => {
    if (!report) return;
    setOpening(true);
    await openReportFile(report.fileUri, report.fileType);
    setOpening(false);
  };

  const handleShare = async () => {
    if (!report) return;
    try {
      if (report.fileUri) {
        await openReportFile(report.fileUri, report.fileType);
      } else {
        await Share.share({
          message: `${report.title}\n${report.date} • ${report.labName}\nHealth score: ${report.healthScore}/100`,
        });
      }
    } catch {
      /* ignore */
    }
  };

  const handleMore = () => {
    Alert.alert(report?.title ?? 'Report', undefined, [
      {
        text: 'Rename',
        onPress: () => {
          setNewName(report?.title ?? '');
          setShowRename(true);
        },
      },
      {
        text: opening ? 'Opening…' : 'View original file',
        onPress: handleViewReport,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveRename = async () => {
    if (!report || !newName.trim()) return;
    setSavingRename(true);
    await renameReport(report.id, newName, phone);
    setReport({ ...report, title: newName.trim() });
    setSavingRename(false);
    setShowRename(false);
  };

  const goFullResults = () => {
    if (!report) return;
    if (report.values) {
      router.push({
        pathname: '/analysis',
        params: {
          reportId: String(report.reportId ?? ''),
          patientName: report.patientName ?? '',
          hospitalName: report.hospitalName ?? report.labName,
          summary: report.summary ?? '',
          values: JSON.stringify(report.values ?? []),
          detectedMedicines: JSON.stringify(report.detectedMedicines ?? []),
        },
      });
    } else {
      router.push({ pathname: '/scorecard', params: { id: report.id } });
    }
  };

  const parsed = useMemo(() => {
    if (!report?.summary) return null;
    try {
      return JSON.parse(report.summary as unknown as string) as ApiSummary;
    } catch {
      return null;
    }
  }, [report]);

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

  const values: LabValue[] = report.values ?? [];
  const normalValues = values.filter((v) => v.status === 'normal');
  const abnormalValues = values.filter((v) => v.status === 'high' || v.status === 'low');
  const overallNormal = abnormalValues.length === 0 && (report.status === 'good' || values.length > 0);

  const aiText =
    parsed?.patient_friendly_explanation ||
    parsed?.ai_summary ||
    parsed?.overall_health ||
    (typeof report.summary === 'string' && !report.summary.trim().startsWith('{')
      ? report.summary
      : null) ||
    (overallNormal
      ? `Your ${report.title} looks good! Most of your values are within the normal range.`
      : `Your ${report.title} has ${abnormalValues.length} value${abnormalValues.length === 1 ? '' : 's'} outside the normal range.`);

  const checklist: string[] = [];
  if (parsed?.abnormal_findings?.length) {
    // Show positive/normal notes from normal values when available
  }
  if (normalValues.length > 0) {
    normalValues.slice(0, 3).forEach((v) => {
      checklist.push(`${v.name} is normal.`);
    });
  }
  if (abnormalValues.length === 0 && checklist.length < 4) {
    checklist.push('No major abnormal findings detected.');
  }
  abnormalValues.slice(0, 2).forEach((v) => {
    checklist.push(`${v.name} is ${v.status} (${v.value}).`);
  });
  if (checklist.length === 0) {
    checklist.push('Open Results for a full parameter breakdown.');
  }

  const highlights = (values.length > 0 ? values : []).slice(0, 4);
  const normalCount = normalValues.length || Math.max(0, (report.totalValues ?? 0) - (report.abnormalCount ?? 0));
  const totalCount = values.length || report.totalValues || highlights.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Report Details</Text>
        <Pressable onPress={handleShare} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={Colors.text} />
        </Pressable>
        <Pressable onPress={handleMore} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={18} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Overview card */}
        <View style={styles.overviewCard}>
          <View style={styles.flaskIcon}>
            <Ionicons name="flask-outline" size={22} color="#E11D48" />
          </View>
          <View style={styles.overviewInfo}>
            <Text style={styles.overviewTitle}>
              {report.reportTypeFull || report.title}
            </Text>
            <Text style={styles.overviewMeta}>{report.date}</Text>
            <Text style={styles.overviewLab}>{report.labName || 'Lab report'}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: overallNormal ? '#DCFCE7' : '#FEE2E2',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: overallNormal ? '#15803D' : '#DC2626' },
                ]}
              >
                {overallNormal ? 'Normal' : 'Attention'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          style={styles.tabsScroll}
        >
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t}</Text>
                {active && <View style={styles.tabUnderline} />}
              </Pressable>
            );
          })}
        </ScrollView>

        {tab === 'Summary' && (
          <>
            {/* AI Summary */}
            <View style={styles.card}>
              <View style={styles.aiHeader}>
                <Text style={styles.cardTitle}>AI Summary</Text>
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={12} color="#fff" />
                  <Text style={styles.aiBadgeText}>HealthAI</Text>
                </View>
              </View>
              <Text style={styles.aiBody}>{aiText}</Text>
              <View style={styles.checkList}>
                {checklist.slice(0, 4).map((line, i) => {
                  const isAlert = /high|low|abnormal|outside/i.test(line);
                  return (
                    <View key={`${i}-${line}`} style={styles.checkRow}>
                      <Ionicons
                        name={isAlert ? 'alert-circle' : 'checkmark-circle'}
                        size={18}
                        color={isAlert ? Colors.warning : Colors.success}
                      />
                      <Text style={styles.checkText}>{line}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.consultNote}>
                <Text style={styles.consultNoteText}>
                  Always consult your doctor for personalized advice.
                </Text>
              </View>
            </View>

            {/* Key Highlights */}
            <View style={styles.card}>
              <View style={styles.hlHeader}>
                <Text style={styles.cardTitle}>Key Highlights</Text>
                <Text style={styles.hlMeta}>
                  {normalCount} of {totalCount || '—'} parameters normal
                </Text>
              </View>

              {highlights.length === 0 ? (
                <Text style={styles.emptyHint}>
                  Detailed parameters will appear after analysis completes.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hlRow}
                >
                  {highlights.map((v) => {
                    const st = statusLabel(v.status);
                    return (
                      <View key={v.name} style={styles.hlCard}>
                        <Text style={styles.hlName} numberOfLines={1}>
                          {v.name}
                        </Text>
                        <Text style={styles.hlValue}>
                          {v.value}
                          {v.range ? '' : ''}
                        </Text>
                        <View style={[styles.hlBadge, { backgroundColor: st.bg }]}>
                          <Text style={[styles.hlBadgeText, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              <Pressable style={styles.primaryBtn} onPress={goFullResults}>
                <Text style={styles.primaryBtnText}>View Full Results</Text>
              </Pressable>
            </View>

            <View style={{ marginTop: 16 }}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={handleViewReport}
              >
                <Text style={styles.secondaryBtnText}>
                  {opening ? 'Opening…' : 'View original report file'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {tab === 'Results' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>All Results</Text>
            {values.length === 0 ? (
              <Text style={styles.emptyHint}>No lab values available for this report.</Text>
            ) : (
              values.map((v, i) => {
                const st = statusLabel(v.status);
                return (
                  <View
                    key={`${v.name}-${i}`}
                    style={[styles.resultRow, i > 0 && styles.resultDivider]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{v.name}</Text>
                      <Text style={styles.resultRange}>Range: {v.range || '—'}</Text>
                    </View>
                    <Text style={styles.resultValue}>{v.value}</Text>
                    <View style={[styles.hlBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.hlBadgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                );
              })
            )}
            <Pressable style={[styles.primaryBtn, { marginTop: 16 }]} onPress={goFullResults}>
              <Text style={styles.primaryBtnText}>View Full Results</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>

      {/* Rename modal */}
      <Modal
        visible={showRename}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRename(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
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
              <Pressable
                style={styles.modalBtnCancel}
                onPress={() => setShowRename(false)}
                disabled={savingRename}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtnSave}
                onPress={handleSaveRename}
                disabled={savingRename || !newName.trim()}
              >
                {savingRename ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Save Name</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  errorText: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
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

  body: { padding: 16, paddingBottom: 40, gap: 14 },

  overviewCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  flaskIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewInfo: { flex: 1, gap: 3 },
  overviewTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  overviewMeta: { fontSize: 12, color: Colors.textMuted },
  overviewLab: { fontSize: 12, color: Colors.textMuted },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  tabsScroll: { marginHorizontal: -4 },
  tabsRow: { gap: 18, paddingHorizontal: 4, paddingBottom: 2 },
  tab: { paddingVertical: 8 },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  tabUnderline: {
    marginTop: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  aiBody: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  checkList: { marginTop: 14, gap: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checkText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19 },
  consultNote: {
    marginTop: 14,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  consultNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
  },

  hlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  hlMeta: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  hlRow: { gap: 10, paddingBottom: 4 },
  hlCard: {
    width: 130,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 6,
  },
  hlName: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  hlValue: { fontSize: 15, fontWeight: '800', color: Colors.text },
  hlBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hlBadgeText: { fontSize: 10, fontWeight: '700' },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },

  emptyHint: { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginTop: 8 },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  resultDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  resultName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  resultRange: { marginTop: 2, fontSize: 11, color: Colors.textMuted },
  resultValue: { fontSize: 14, fontWeight: '700', color: Colors.text },

  trendScore: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  trendScoreNum: { fontSize: 40, fontWeight: '800', color: Colors.primary },
  trendScoreLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: Radius.lg, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  modalBtnSave: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  modalBtnSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
