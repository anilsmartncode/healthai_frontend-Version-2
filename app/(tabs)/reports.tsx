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
  Platform,
  Share,
} from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors, Radius } from '@/constants/Colors';
import { useReports, type FilterType } from '@/hooks/useReports';
import type { ReportListItem } from '@/services/reportsApi';
import { ChatInputBar } from '@/components/ui/ChatInputBar';


function formatIndianDateTime(isoString: string | undefined | null, fallback: string): string {
  if (!isoString) return fallback;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return fallback;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    return `${day} ${month} ${year}, ${strTime}`;
  } catch {
    return fallback;
  }
}

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
      style={({ pressed }: { pressed: boolean }) => [styles.reportRow, pressed && { opacity: 0.85 }]}
      onPress={() =>
        router.push({ pathname: '/report-detail', params: { id: item.id } })
      }
    >
      <View style={[styles.reportIcon, { backgroundColor: icon.bg }]}>
        <Ionicons name="document-text-outline" size={16} color={icon.color} />
      </View>
      <View style={styles.reportInfo}>
        <Text style={styles.reportTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.reportMeta} numberOfLines={1}>
          {formatIndianDateTime(item.analyzedAt, item.date)} • {item.labName || item.category}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={async () => {
            if (!item.fileUri) {
              Alert.alert(
                'File not available',
                'The original file for this report is no longer stored on this device.'
              );
              return;
            }
            try {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(item.fileUri, {
                  mimeType: item.fileType === 'PDF' ? 'application/pdf' : 'image/jpeg',
                  dialogTitle: 'Share report',
                  UTI: item.fileType === 'PDF' ? 'com.adobe.pdf' : 'public.image',
                });
              } else {
                await WebBrowser.openBrowserAsync(item.fileUri);
              }
            } catch (e: any) {
              Alert.alert('Cannot share file', e?.message ?? 'Unknown error');
            }
          }}
          style={({ pressed }: { pressed: boolean }) => [
            styles.actionBtnInline,
            pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            { backgroundColor: Colors.primary + '15' }
          ]}
          hitSlop={12}
        >
          <Ionicons name="share-social-outline" size={16} color={Colors.primary} />
        </Pressable>

        <Pressable
          onPress={handleDelete}
          style={({ pressed }: { pressed: boolean }) => [
            styles.actionBtnInline,
            pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            { backgroundColor: '#FEF2F2' }
          ]}
          hitSlop={12}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function getDescriptiveFilterLabel(label: string) {
  switch (label) {
    case 'All': return 'All Reports';
    case 'CBC': return 'CBC (Blood Count)';
    case 'Lipid': return 'Lipid (Heart/Cholesterol)';
    case 'Thyroid': return 'Thyroid (T3/T4/TSH)';
    case 'Diabetes': return 'Diabetes (Sugar/HbA1c)';
    case 'Liver': return 'Liver (SGPT/SGOT)';
    case 'Kidney': return 'Kidney (Creatinine/Urea)';
    case 'Vitamins': return 'Vitamins (D/B12)';
    case 'Blood Test': return 'General Blood Tests';
    default: return label;
  }
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
        {getDescriptiveFilterLabel(label)}
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
    filterDate,
    setFilterDate,
    deleteReport,
  } = useReports();

  const [showSearch, setShowSearch] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      setFilterDate(selectedDate);
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const clearDate = () => setFilterDate(null);

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
    <View style={{ zIndex: 10 }}>

      {/* Recent header */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Your Reports</Text>
      </View>

      {/* Filter Label & Date Filter */}
      <View style={styles.filterHeaderRow}>
        <Text style={styles.filterLabel}>Filter by report category:</Text>
        <Pressable
          style={styles.dateFilterBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={14} color={filterDate ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.dateFilterText, filterDate && { color: Colors.primary, fontWeight: '700' }]}>
            {filterDate ? filterDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Filter by Date'}
          </Text>
          {filterDate && (
            <Pressable onPress={clearDate} hitSlop={8} style={{ marginLeft: 4 }}>
              <Ionicons name="close-circle" size={16} color={Colors.primary} />
            </Pressable>
          )}
        </Pressable>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={filterDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

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
    </View>
  );

  const ListFooter = (
    <View style={{ paddingBottom: 28 }}>
      {reports.length > 8 && (
        <View style={styles.viewMoreContainer}>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Fixed Header & Input Bar to prevent dropdown clipping by FlatList on Android */}
      <View style={{ zIndex: 999, elevation: 999, paddingHorizontal: 16, backgroundColor: '#F8FAFC' }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Reports</Text>
            <Text style={styles.headerSub}>Manage and analyze your health reports</Text>
          </View>
        </View>
        <View style={{ marginBottom: 16, zIndex: 100, elevation: 100 }}>
          <ChatInputBar />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={Colors.primary} />
      ) : (
        <KeyboardAwareFlatList
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 60 : 80}
          keyboardShouldPersistTaps="handled"
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
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 8,
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
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 4,
  },
  dateFilterText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },

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
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
  },
  reportIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: { flex: 1, minWidth: 0 },
  reportTitle: { fontSize: 14, fontWeight: '500', color: Colors.text },
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

  actionBtnInline: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
