/**
 * app/family/reports.tsx — Member Reports sub-screen
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  Pressable, Modal, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import {
  getMemberReports,
  type ReportItem,
  type ReportStatus,
} from '@/services/profileSubScreenApi';
import { useLang } from '@/context/Languagecontext';

// ── Helpers ───────────────────────────────────────────────────────────

type FilterType = 'All' | 'Blood' | 'Scan' | 'Hormone' | 'Diabetes';
const FILTERS: FilterType[] = ['All', 'Blood', 'Scan', 'Hormone', 'Diabetes'];

function statusColor(s: ReportStatus) {
  switch (s) {
    case 'Normal': return { bg: '#E8F5F0', text: '#065F46' };
    case 'Review': return { bg: '#FEF9E8', text: '#92400E' };
    case 'Elevated': return { bg: '#FEF9E8', text: '#92400E' };
    case 'Critical': return { bg: '#FFE8E8', text: '#991B1B' };
    default: return { bg: Colors.border, text: Colors.textMuted };
  }
}

function typeIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type === 'Blood test') return 'flask-outline';
  if (type === 'Hormone') return 'cellular-outline';
  if (type === 'Diabetes') return 'nutrition-outline';
  return 'document-text-outline';
}

function typeIconBg(type: string) {
  if (type === 'Blood test') return { bg: '#E8F0FF', color: '#007AFF' };
  if (type === 'Hormone') return { bg: '#FEF9E8', color: Colors.warning };
  if (type === 'Diabetes') return { bg: '#F0EAFF', color: '#8B5CF6' };
  return { bg: '#E8F0FF', color: '#007AFF' };
}

// Group reports by month
function groupByMonth(reports: ReportItem[]) {
  const map: Record<string, ReportItem[]> = {};
  reports.forEach((r) => {
    const parts = r.date.split(' ');
    const key = parts.length === 3 ? `${parts[1]} ${parts[2]}` : r.date;
    if (!map[key]) map[key] = [];
    map[key].push(r);
  });
  return map;
}

// ── Screen ────────────────────────────────────────────────────────────

export default function MemberReportsScreen() {
  const { t, rowDirection, textAlign } = useLang();
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('All');
  const [selected, setSelected] = useState<ReportItem | null>(null);

  useEffect(() => {
    getMemberReports(id)
      .then((r) => setReports(r.reports))
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const filtered = filter === 'All'
    ? reports
    : reports.filter((r) => r.type.toLowerCase().includes(filter.toLowerCase()));

  const grouped = groupByMonth(filtered);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar
        title={t('nav_reports')}
        onBack={() => router.back()}
        rightIcon="cloud-upload-outline"
        onRight={() => router.push({ pathname: '/upload', params: { context: 'family', memberId: id, memberName: name } } as any)}
      />

      {/* ── Filter chips ───────────────────────────────────── */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipOn]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTxt, filter === f && styles.filterTxtOn]}>
              {f === 'All' ? t('all_reports') : f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        {Object.keys(grouped).length === 0 && (
          <View style={styles.centered}>
            <Ionicons name="document-outline" size={38} color={Colors.textMuted} style={{ opacity: 0.4 }} />
            <Text style={styles.emptyTxt}>{t('no_reports_found')}</Text>
          </View>
        )}

        {Object.entries(grouped).map(([month, items]) => (
          <View key={month}>
            <Text style={[styles.section, { textAlign }]}>{month}</Text>
            {items.map((r) => {
              const sc = statusColor(r.status);
              const ic = typeIconBg(r.type);
              return (
                <Pressable
                  key={r.report_id}
                  style={({ pressed }) => [styles.row, { flexDirection: rowDirection }, pressed && { backgroundColor: '#F5FDF9' }]}
                  onPress={() => setSelected(r)}
                >
                  <View style={[styles.rowIcon, { backgroundColor: ic.bg }]}>
                    <Ionicons name={typeIcon(r.type)} size={18} color={ic.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { textAlign }]}>{r.title}</Text>
                    <Text style={[styles.rowSub, { textAlign }]}>{r.date} · {r.type}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeTxt, { color: sc.text }]}>{r.status}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* ── Report Detail Modal ───────────────────────────── */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <View style={styles.modal}>
            <View style={[styles.modalBar, { flexDirection: rowDirection }]}>
              <Pressable onPress={() => setSelected(null)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </Pressable>
              <Text style={styles.modalTitle}>{selected.title}</Text>
              <Pressable style={styles.modalClose}>
                <Ionicons name="share-outline" size={20} color={Colors.primary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* File card */}
              <View style={styles.fileCard}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document-text-outline" size={30} color={Colors.textMuted} />
                </View>
                <Text style={[styles.fileName, { textAlign }]}>{selected.file_name}</Text>
                <Text style={[styles.fileSub, { textAlign }]}>{selected.doctor} · {selected.hospital}</Text>
              </View>

              {/* Key values */}
              <Text style={[styles.section, { textAlign }]}>{t('key_highlights')}</Text>
              <View style={styles.card}>
                <View style={styles.kvGrid}>
                  {selected.key_values.map((kv) => {
                    const vc = kv.status === 'Normal' ? Colors.success
                      : kv.status === 'Elevated' || kv.status === 'High' ? Colors.warning
                        : Colors.danger;
                    return (
                      <View key={kv.label || Math.random().toString()} style={styles.kvItem}>
                        <Text style={[styles.kvLabel, { textAlign }]}>{kv.label}</Text>
                        <Text style={[styles.kvVal, { color: vc, textAlign }]}>
                          {kv.value} <Text style={styles.kvUnit}>{kv.unit}</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <Pressable
                style={[styles.downloadBtn, { flexDirection: rowDirection }]}
                onPress={() => { Alert.alert(t('download_report'), `Downloading ${selected?.title ?? 'report'}…`); }}
              >
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.downloadTxt}>{t('download_report')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, minHeight: 160 },
  emptyTxt: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  filterBar: { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: Colors.border, maxHeight: 48, flexShrink: 0 },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 13, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterChipOn: { backgroundColor: Colors.primary },
  filterTxt: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  filterTxtOn: { color: '#fff', fontWeight: '600' },

  page: { padding: 12, paddingBottom: 40 },
  section: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 7, marginTop: 6 },

  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 7, gap: 10 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  rowSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  badgeTxt: { fontSize: 10, fontWeight: '600' },

  // Modal
  modal: { flex: 1, backgroundColor: '#F4F7F6' },
  modalBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  modalClose: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: Colors.text },
  modalBody: { padding: 16, paddingBottom: 40 },

  fileCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 12 },
  fileIcon: { width: 56, height: 68, backgroundColor: '#F1F5F9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  fileName: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  fileSub: { fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 12 },
  kvGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kvItem: { width: '45%' },
  kvLabel: { fontSize: 11, color: Colors.textMuted },
  kvVal: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  kvUnit: { fontSize: 10, fontWeight: '400' },

  downloadBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  downloadTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
