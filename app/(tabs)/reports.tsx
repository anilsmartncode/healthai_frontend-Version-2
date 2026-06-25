/**
 * app/(tabs)/reports.tsx  — Reports List Screen
 *
 * Changes:
 *  - Filter chips are category-driven from actual report data (dynamic)
 *  - Each chip shows a count badge
 *  - FAB + empty state CTA both go to upload
 */

import React from 'react';
import {
  View, Text, StyleSheet, FlatList, SectionList, Pressable,
  TextInput, RefreshControl, ActivityIndicator, ScrollView, Animated, Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { useReports, type FilterType } from '@/hooks/useReports';
import type { ReportListItem } from '@/services/reportsApi';

// ── Swipe-to-delete wrapper ───────────────────────────────────────────────────
function DeleteAction({
  progress, onPress,
}: { progress: Animated.AnimatedInterpolation<number>; onPress: () => void }) {
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
    extrapolate: 'clamp',
  });
  return (
    <Pressable style={styles.deleteAction} onPress={onPress}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text style={styles.deleteActionText}>Delete</Text>
      </Animated.View>
    </Pressable>
  );
}

function SwipeableReportCard({ item, onDelete }: { item: ReportListItem; onDelete: (id: string) => void }) {
  const swipeRef = React.useRef<Swipeable>(null);

  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      `Remove "${item.title}" from your reports?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => swipeRef.current?.close() },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            swipeRef.current?.close();
            onDelete(item.id);
          },
        },
      ]
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={(progress) => (
        <DeleteAction progress={progress} onPress={handleDelete} />
      )}
      overshootRight={false}
    >
      <ReportCard item={item} />
    </Swipeable>
  );
}

// ── Report card ────────────────────────────────────────────────────────────────
function ReportCard({ item }: { item: ReportListItem }) {
  const isAttention = item.status === 'attention';
  const scoreColor  = item.healthScore >= 80 ? Colors.success : item.healthScore >= 60 ? Colors.warning : Colors.danger;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
      onPress={() =>
        router.push({ pathname: '/report-detail', params: { id: item.id } })
      }
    >
      {/* Left: icon */}
      <View style={[styles.iconWrap, { backgroundColor: isAttention ? '#FEF3C7' : '#DCFCE7' }]}>
        <Ionicons
          name="document-text-outline"
          size={22}
          color={isAttention ? Colors.warning : Colors.success}
        />
      </View>

      {/* Center: info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.date} · {item.labName}</Text>
        <View style={styles.cardStats}>
          {/* Category badge */}
          <View style={[styles.statChip, { backgroundColor: Colors.primary + '15' }]}>
            <Text style={[styles.statChipText, { color: Colors.primary }]}>{item.category}</Text>
          </View>
          {item.abnormalCount > 0 && (
            <View style={styles.statChipDanger}>
              <Text style={styles.statChipDangerText}>{item.abnormalCount} Abnormal</Text>
            </View>
          )}
          {item.borderlineCount > 0 && (
            <View style={[styles.statChip, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.statChipText, { color: Colors.warning }]}>
                {item.borderlineCount} Borderline
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right: score + badge */}
      <View style={styles.cardRight}>
        <Text style={[styles.scoreText, { color: scoreColor }]}>{item.healthScore}</Text>
        <Text style={styles.scoreLabel}>/100</Text>
        <View style={styles.fileBadge}>
          <Text style={styles.fileBadgeText}>{item.fileType}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Filter chip ────────────────────────────────────────────────────────────────
function FilterChip({
  label, active, count, onPress,
}: { label: string; active: boolean; count: number; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
        <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>{count}</Text>
      </View>
    </Pressable>
  );
}

// ChipBar — renders filter chips inside a ScrollView without inline .map()
// Uses a helper that builds children imperatively to avoid reconciler key warnings
function ChipBar({
  filters, activeFilter, categoryCounts, onSelect,
}: {
  filters: string[];
  activeFilter: string;
  categoryCounts: Record<string, number>;
  onSelect: (f: string) => void;
}) {
  const children: React.ReactNode[] = [];
  for (let i = 0; i < filters.length; i++) {
    const f = filters[i];
    children.push(
      <FilterChip
        key={f}
        label={f}
        active={activeFilter === f}
        count={categoryCounts[f] ?? 0}
        onPress={() => onSelect(f)}
      />
    );
  }
  return React.createElement(
    ScrollView,
    {
      horizontal: true,
      showsHorizontalScrollIndicator: false,
      contentContainerStyle: styles.filtersRow,
      style: styles.filtersScroll,
    },
    ...children
  );
}

function ReportSeparator() { return <View style={{ height: 10 }} />; }
function ReportListFooter() { return <View style={{ height: 20 }} />; }

function EmptyState({ searchQuery, activeFilter }: { searchQuery: string; activeFilter: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No reports found</Text>
      <Text style={styles.emptySub}>
        {searchQuery
          ? 'Try a different search term'
          : activeFilter !== 'All'
            ? `No ${activeFilter} reports yet`
            : 'Upload a report to get started'}
      </Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const {
    reports, sections, groupByMonth, setGroupByMonth, loading, refreshing, refresh,
    searchQuery, setSearchQuery,
    activeFilter, setActiveFilter,
    availableFilters, categoryCounts,
    deleteReport,
  } = useReports();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable
            style={styles.bellBtn}
            onPress={() => setGroupByMonth(g => !g)}
          >
            <Ionicons
              name={groupByMonth ? 'list' : 'calendar-outline'}
              size={22}
              color={Colors.text}
            />
          </Pressable>
          <Pressable
            style={styles.bellBtn}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Dynamic filter chips */}
      <ChipBar
        filters={availableFilters}
        activeFilter={activeFilter}
        categoryCounts={categoryCounts}
        onSelect={(f) => setActiveFilter(f as FilterType)}
      />

      {/* List */}
      <View style={styles.listContainer}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={Colors.primary} />
      ) : groupByMonth ? (
        <SectionList
          sections={sections}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
          }
          ItemSeparatorComponent={ReportSeparator}
          ListEmptyComponent={<EmptyState searchQuery={searchQuery} activeFilter={activeFilter} />}
          renderItem={({ item }) => <SwipeableReportCard item={item} onDelete={deleteReport} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          ListFooterComponent={ReportListFooter}
          stickySectionHeadersEnabled
        />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
          }
          ItemSeparatorComponent={ReportSeparator}
          ListEmptyComponent={<EmptyState searchQuery={searchQuery} activeFilter={activeFilter} />}
          renderItem={({ item }) => <SwipeableReportCard item={item} onDelete={deleteReport} />}
          ListFooterComponent={ReportListFooter}
        />
      )}

      </View>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/upload')}
      >
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabText}>Upload New Report</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.bg },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 },
  headerTitle:        { fontSize: 24, fontWeight: '700', color: Colors.text },
  bellBtn:            { padding: 6 },
  searchRow:          { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, marginBottom: 10 },
  searchIcon:         { marginRight: 8 },
  searchInput:        { flex: 1, height: 44, fontSize: 15, color: Colors.text },
  filtersScroll:      { maxHeight: 48, marginBottom: 12 },
  filtersRow:         { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  chip:               { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 12, paddingRight: 8, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive:         { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:           { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  chipTextActive:     { color: '#fff' },
  chipBadge:          { backgroundColor: Colors.border, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  chipBadgeActive:    { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipBadgeText:      { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  chipBadgeTextActive:{ color: '#fff' },
  listContent:        { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 90 },
  card:               { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12, gap: 12 },
  iconWrap:           { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardInfo:           { flex: 1, gap: 3, minWidth: 0 },
  cardTitle:          { fontSize: 14, fontWeight: '600', color: Colors.text },
  cardMeta:           { fontSize: 12, color: Colors.textMuted },
  cardStats:          { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  statChip:           { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statChipText:       { fontSize: 11, fontWeight: '600' },
  statChipDanger:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FEE2E2' },
  statChipDangerText: { fontSize: 11, fontWeight: '600', color: Colors.danger },
  cardRight:          { alignItems: 'center', gap: 4, flexShrink: 0 },
  scoreText:          { fontSize: 20, fontWeight: '700' },
  scoreLabel:         { fontSize: 10, color: Colors.textMuted, marginTop: -4 },
  fileBadge:          { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#EDE9FE' },
  fileBadgeText:      { fontSize: 10, fontWeight: '700', color: '#7C3AED' },
  emptyState:         { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle:         { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySub:           { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  listContainer:        { flex: 1 },
  fab:                { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: Colors.primary, borderRadius: Radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText:            { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionHeader:      { fontSize: 13, fontWeight: '700', color: Colors.textMuted, backgroundColor: Colors.bg, paddingVertical: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteAction:       { backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center', width: 76, borderRadius: Radius.md, marginLeft: 8 },
  deleteActionText:   { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'center' },
});
