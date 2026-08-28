import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { useReports } from '@/hooks/useReports';
import type { ReportListItem } from '@/services/reportsApi';

type VaultFilter = 'All' | 'Reports' | 'Prescriptions' | 'Scans';

export default function VaultPage() {
  const { allReports, refreshing, refresh } = useReports();
  const [activeFilter, setActiveFilter] = useState<VaultFilter>('All');

  const filteredItems = useMemo(() => {
    return allReports.filter(item => {
      const isPrescription = item.reportType?.toUpperCase() === 'PRESCRIPTION';
      const isScan = item.fileType === 'IMAGE' && !isPrescription;
      const isReport = !isPrescription && !isScan;

      if (activeFilter === 'Reports') return isReport;
      if (activeFilter === 'Prescriptions') return isPrescription;
      if (activeFilter === 'Scans') return isScan;
      return true;
    });
  }, [allReports, activeFilter]);

  // Stable pseudo-random size generator for mockup
  const getFakeSize = (id: string) => {
    const num = parseInt(id.replace(/\D/g, '')) || 0;
    const size = 0.8 + (num % 4) * 0.4; // Generates sizes between 0.8 and 2.0+
    return `${size.toFixed(1)} MB`;
  };

  const getFileExtension = (item: ReportListItem) => {
    return item.fileType === 'IMAGE' ? '.jpg' : '.pdf';
  };

  const getIconData = (item: ReportListItem) => {
    const isPrescription = item.reportType?.toUpperCase() === 'PRESCRIPTION';
    const isScan = item.fileType === 'IMAGE' && !isPrescription;

    if (isPrescription) return { emoji: '💊', bg: '#F0FDF4' };
    if (isScan) return { emoji: '📷', bg: '#EFF6FF' };
    return { emoji: '🩸', bg: '#FEF2F2' };
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Medical vault</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={styles.subtitle}>Every report, prescription and scan in one secure place</Text>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        {(['All', 'Reports', 'Prescriptions', 'Scans'] as VaultFilter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="folder-open-outline" size={44} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              No {activeFilter === 'All' ? 'files' : activeFilter.toLowerCase()} found
            </Text>
            <Text style={styles.emptySub}>
              {allReports.length === 0 
                ? 'Your secure medical vault is currently empty.'
                : 'Try selecting a different filter.'}
            </Text>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            {filteredItems.map((item, index) => {
              const icon = getIconData(item);
              const isPrescription = item.reportType?.toUpperCase() === 'PRESCRIPTION';
              
              let displayTitle = '';
              if (isPrescription) {
                displayTitle = item.labName || 'Prescription';
              } else {
                const cleanLabName = item.labName ? item.labName.trim().toLowerCase() : '';
                displayTitle = item.labName && !['unknown', 'lab', 'general', 'na', 'n/a'].includes(cleanLabName)
                  ? item.labName
                  : (item.category && item.category !== 'Others' ? item.category : "Report");
              }

              const isLast = index === filteredItems.length - 1;

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.row,
                    !isLast && styles.rowBorder,
                    pressed && { backgroundColor: '#F8FAFC' }
                  ]}
                  onPress={() => {
                    if (item.reportType?.toUpperCase() === 'PRESCRIPTION') {
                      router.push({ pathname: '/prescription/[id]', params: { id: item.id } } as any);
                    } else {
                      router.push({ pathname: '/report-detail', params: { id: item.id } } as any);
                    }
                  }}
                >
                  <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
                    <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                  </View>
                  <View style={styles.infoWrap}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {displayTitle}
                    </Text>
                    <Text style={styles.rowSub}>
                      {getFakeSize(item.id)} - {formatDate(item.analyzedAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    marginTop: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#059669',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  infoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  emptyState: { alignItems: 'center', paddingVertical: 64, gap: 12, paddingHorizontal: 32 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#E1F5EE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#9FE1CB' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
});
