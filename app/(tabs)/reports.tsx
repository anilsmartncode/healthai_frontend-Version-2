/**
 * app/(tabs)/reports.tsx — Reports tab (Care Hub style UI)
 * Keeps useReports: search, filters, delete, refresh, upload, detail nav.
 */

import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Animated,
  Alert,
  LayoutAnimation,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors, Radius } from '@/constants/Colors';
import { useReports, type FilterType } from '@/hooks/useReports';
import type { ReportListItem } from '@/services/reportsApi';
import { ChatInputBar } from '@/components/ui/ChatInputBar';


function statusTag(item: ReportListItem) {
  if (item.status === 'attention') {
    return { label: 'Active', bg: '#FFEDD5', color: '#C2410C' };
  }
  if (item.healthScore >= 80) {
    return { label: 'Analyzed', bg: '#DCFCE7', color: '#15803D' };
  }
  return { label: 'Reviewed', bg: '#DBEAFE', color: '#1D4ED8' };
}

function iconColorFor(item: ReportListItem) {
  if (item.fileType === 'IMAGE') return { bg: '#DBEAFE', color: '#2563EB' };
  if (item.status === 'attention') return { bg: '#FFEDD5', color: '#EA580C' };
  return { bg: '#DCFCE7', color: '#16A34A' };
}

function ReportRow({
  item,
  onDelete,
}: {
  item: ReportListItem;
  onDelete: (id: string) => void;
}) {
  const tag = statusTag(item);
  const icon = iconColorFor(item);
  const scoreColor =
    item.healthScore >= 80
      ? Colors.success
      : item.healthScore >= 60
        ? Colors.warning
        : Colors.danger;

  const handleDelete = () => {
    Alert.alert('Delete Report', `Remove "${item.title}" from your reports?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(item.id),
      },
    ]);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.reportRow, pressed && { opacity: 0.85 }]}
      onPress={() =>
        router.push({ pathname: '/report-detail', params: { id: item.id } })
      }
    >
      <View style={[styles.reportIcon, { backgroundColor: icon.bg }]}>
        <Ionicons name="document-text-outline" size={20} color={icon.color} />
      </View>
      <View style={styles.reportInfo}>
        <Text style={styles.reportTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.reportMeta} numberOfLines={1}>
          {item.date} • {item.labName || item.category}
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: tag.bg }]}>
        <Text style={[styles.statusPillText, { color: tag.color }]}>{tag.label}</Text>
      </View>
      {item.healthScore > 0 && (
        <View style={[styles.scoreCircle, { borderColor: scoreColor + '55' }]}>
          <Text style={[styles.scoreCircleText, { color: scoreColor }]}>
            {item.healthScore}
          </Text>
        </View>
      )}

      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [
          styles.deleteBtnInline,
          pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
        ]}
        hitSlop={12}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
      </Pressable>
    </Pressable>
  );
}

function FilterTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label === 'All' ? 'All Reports' : label}
      </Text>
    </Pressable>
  );
}

export default function ReportsScreen() {
  const {
    reports,
    allReports,
    loading,
    refreshing,
    refresh,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    availableFilters,
    deleteReport,
  } = useReports();

  const [showSearch, setShowSearch] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  const summary = useMemo(() => {
    const total = allReports.length;
    const imaging = allReports.filter((r) => r.fileType === 'IMAGE').length;
    const prescriptions = allReports.filter(
      (r) =>
        /prescrip|rx|medicine/i.test(r.title) ||
        /prescrip|rx/i.test(r.category) ||
        /prescrip|rx/i.test(r.reportTypeFull)
    ).length;
    const lab = Math.max(0, total - imaging - prescriptions);
    return { total, lab, prescriptions, imaging };
  }, [allReports]);

  const recent = showAllRecent ? reports : reports.slice(0, 8);
  const improvingCount = useMemo(
    () => allReports.filter((r) => r.healthScore >= 75 && r.status === 'good').length,
    [allReports]
  );

  const tools = [
    {
      key: 'trends',
      title: 'Trends',
      sub: 'Track your health trends',
      icon: 'bar-chart-outline' as const,
      bg: '#ECFDF5',
      color: '#16A34A',
      onPress: () => router.push('/(tabs)/home' as any),
    },
    {
      key: 'compare',
      title: 'Compare',
      sub: 'Compare reports side by side',
      icon: 'pie-chart-outline' as const,
      bg: '#F3E8FF',
      color: '#7C3AED',
      onPress: () => router.push('/all-values' as any),
    },
    {
      key: 'insights',
      title: 'Insights',
      sub: 'AI-powered health insights',
      icon: 'bulb-outline' as const,
      bg: '#FFF7ED',
      color: '#EA580C',
      onPress: () => router.push('/(tabs)/ai' as any),
    },
    {
      key: 'export',
      title: 'Export',
      sub: 'Download reports as PDF',
      icon: 'download-outline' as const,
      bg: '#EFF6FF',
      color: '#2563EB',
      onPress: () => {
        if (reports[0]) {
          router.push({ pathname: '/report-detail', params: { id: reports[0].id } });
        } else {
          Alert.alert('No reports', 'Upload a report first to export.');
        }
      },
    },
  ];

  const ListHeader = (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSub}>Manage and analyze your health reports</Text>
        </View>
      </View>



      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {availableFilters.map((f) => (
          <FilterTab
            key={f}
            label={f}
            active={activeFilter === f}
            onPress={() => setActiveFilter(f as FilterType)}
          />
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Reports Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="document-text" size={16} color="#16A34A" />
            </View>
            <Text style={[styles.summaryNum, { color: '#16A34A' }]}>
              {summary.total}
              {summary.total > 0 ? '+' : ''}
            </Text>
            <Text style={styles.summaryLabel}>Total Reports</Text>
            <Text style={styles.summaryHint}>All time</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="flask" size={16} color="#7C3AED" />
            </View>
            <Text style={[styles.summaryNum, { color: '#7C3AED' }]}>{summary.lab}</Text>
            <Text style={styles.summaryLabel}>Lab Reports</Text>
            <Text style={styles.summaryHint}>This year</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FFEDD5' }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#EA580C' }}>Rx</Text>
            </View>
            <Text style={[styles.summaryNum, { color: '#EA580C' }]}>{summary.prescriptions}</Text>
            <Text style={styles.summaryLabel}>Prescriptions</Text>
            <Text style={styles.summaryHint}>This year</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="image" size={16} color="#2563EB" />
            </View>
            <Text style={[styles.summaryNum, { color: '#2563EB' }]}>{summary.imaging}</Text>
            <Text style={styles.summaryLabel}>Imaging</Text>
            <Text style={styles.summaryHint}>This year</Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 16, marginBottom: 8 }}>
        <ChatInputBar />
      </View>

      {/* Recent header */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
      </View>
    </View>
  );

  const ListFooter = (
    <View style={{ paddingBottom: 28 }}>
      {reports.length > 8 && (
        <View style={styles.viewMoreContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.viewMoreBtn,
              showAllRecent && styles.viewMoreBtnActive,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            ]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowAllRecent((v) => !v);
            }}
          >
            <Text style={[styles.viewMoreText, showAllRecent && styles.viewMoreTextActive]}>
              {showAllRecent ? 'View less' : 'View More'}
            </Text>
            <View style={[styles.viewMoreIconBox, showAllRecent && styles.viewMoreIconBoxActive]}>
              <Ionicons
                name={showAllRecent ? 'chevron-up' : 'chevron-down'}
                size={15}
                color={showAllRecent ? '#047857' : Colors.primary}
              />
            </View>
          </Pressable>
        </View>
      )}

      {/* AI insight */}
      {/* <View style={styles.aiBanner}>
        <Ionicons name="sparkles" size={18} color="#16A34A" />
        <Text style={styles.aiText}>
          AI Insight:{' '}
          {improvingCount > 0
            ? `${improvingCount} report${improvingCount === 1 ? '' : 's'} look good! Keep up the good work.`
            : 'Upload reports to unlock personalized AI insights.'}{' '}
          <Text
            style={styles.aiLink}
            onPress={() => router.push('/(tabs)/ai' as any)}
          >
            View details →
          </Text>
        </Text>
        <Ionicons name="stats-chart-outline" size={18} color="#16A34A" />
      </View> */}

      {/* Tools */}
      {/* <View style={[styles.sectionCard, { marginTop: 14 }]}>
        <Text style={styles.sectionTitle}>Tools & Insights</Text>
        <View style={styles.toolsList}>
          {tools.map((t) => (
            <Pressable
              key={t.key}
              style={({ pressed }) => [
                styles.toolCard,
                { backgroundColor: t.bg },
                pressed && styles.toolCardPressed,
              ]}
              onPress={t.onPress}
            >
              <View style={styles.toolIconWrap}>
                <Ionicons name={t.icon} size={22} color={t.color} />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolTitle}>{t.title}</Text>
                <Text style={styles.toolSub}>{t.sub}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View> */}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <SafeAreaView style={styles.safe} edges={['top']}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={Colors.primary} />
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={44} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No reports found</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? 'Try a different search term'
                  : activeFilter !== 'All'
                    ? `No ${activeFilter} reports yet`
                    : 'Upload a report to get started'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ReportRow item={item} onDelete={deleteReport} />
          )}
        />
      )}
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
    marginBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  headerSub: { marginTop: 2, fontSize: 13, color: Colors.textMuted },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: Colors.text },

  searchInput: { flex: 1, height: 44, fontSize: 15, color: Colors.text },

  tabsScroll: { marginBottom: 14, maxHeight: 44 },
  tabsRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
  },
  tabActive: { backgroundColor: '#DCFCE7' },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#166534' },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },

  summaryRow: { flexDirection: 'row', gap: 6 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  summaryNum: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  summaryHint: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  viewAll: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginBottom: 12 },

  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  reportIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: { flex: 1, minWidth: 0 },
  reportTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  reportMeta: { marginTop: 2, fontSize: 11, color: Colors.textMuted },
  statusPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  scoreCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  scoreCircleText: { fontSize: 11, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    marginTop: 12,
  },
  aiText: { flex: 1, fontSize: 12, color: '#166534', lineHeight: 17, fontWeight: '500' },
  aiLink: { fontWeight: '700', color: Colors.primary },

  toolsList: {
    gap: 10,
    marginTop: 10,
  },
  toolCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  toolCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  toolIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toolInfo: {
    justifyContent: 'center',
    gap: 2,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  toolSub: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },

  deleteBtnInline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  viewMoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  viewMoreBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  viewMoreTextActive: {
    color: '#047857',
  },
  viewMoreIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreIconBoxActive: {
    backgroundColor: '#DCFCE7',
  },
});
