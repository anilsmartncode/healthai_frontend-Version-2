/**
 * app/(tabs)/medicines.tsx
 *
 * Medicine Hub — main tab screen.
 *
 * Layout:
 *   Top bar → Categories grid → Today's Reminder banner
 *   → Quick action cards (Scan + Check Interactions)
 *   → Recently Viewed
 *
 * API Layer: services/medicinesApi.ts
 *   • All real API calls are in that file (🔴 REAL block).
 *   • Currently the 🟢 MOCK block is active — flip when backend is ready.
 *   • This screen just calls the service functions; zero raw fetch() here.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView, RefreshControl,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

// ─── DATA LAYER ──────────────────────────────────────────────────────────────
// Screen no longer calls Medicinesapi directly — all fetching/state lives in
// the hook, matching the convention used by useReports (home) and useFamily.
import { useMedicines } from '@/hooks/useMedicines';
import type { Category, Medicine } from '@/services/Medicinesapi';

// ─── LAYOUT CONSTANTS ────────────────────────────────────────────────────────
const SCREEN_WIDTH   = Dimensions.get('window').width;
const H_PADDING      = 16;  // horizontal page padding
const CAT_COLUMNS    = 3;
const CAT_GAP        = 10;
// card width = available width divided evenly, minus gaps between columns
const CAT_CARD_WIDTH =
  (SCREEN_WIDTH - H_PADDING * 2 - CAT_GAP * (CAT_COLUMNS - 1)) / CAT_COLUMNS;

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function CategoryCard({
  item,
  onPress,
}: {
  item: Category;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.catItem, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={[styles.catIcon, { backgroundColor: item.bg }]}>
        <Ionicons name={item.icon as any} size={22} color={item.color} />
      </View>
      <Text style={styles.catLabel} numberOfLines={2}>
        {item.name}
      </Text>
    </Pressable>
  );
}

function MedicineRow({
  med,
  onPress,
}: {
  med: Medicine;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.medRow, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[styles.medIcon, { backgroundColor: Colors.primary + '18' }]}>
        <Ionicons name="medical-outline" size={18} color={Colors.primary} />
      </View>
      <View style={styles.medInfo}>
        <Text style={styles.medName} numberOfLines={1}>{med.name}</Text>
        <Text style={styles.medSub} numberOfLines={1}>
          {med.form} · {med.category}
        </Text>
      </View>
      <View style={styles.medRight}>
        {med.rx && (
          <View style={styles.rxPill}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>
    </Pressable>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function Medicines() {
  const [searchQ, setSearchQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [catPage, setCatPage] = useState(0);

  // All data-fetching (categories, recently viewed, today's reminders)
  // now lives in useMedicines() — this screen just renders what it returns.
  const { categories, recentlyViewed, todayBanner, loading, refetch } = useMedicines();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCategoryPress = (cat: Category) => {
    router.push({
      pathname: '/medicines/browse',
      params: { categoryId: cat.id, categoryName: cat.name },
    });
  };

  const handleViewReminder     = () => router.push('/medicines/reminders');
  const handleScanMedicine     = () => router.push('/medicines/scanner');
  const handleCheckInteractions = () => router.push('/medicines/check-interactions');
  const handleBrowseAll        = () => router.push('/medicines/browse');

  const handleSearch = () => {
    if (searchQ.trim()) {
      router.push({
        pathname: '/medicines/browse',
        params: { query: searchQ.trim() },
      });
    }
  };

  const handleMedicinePress = (med: Medicine) => {
    router.push({
      pathname: '/medicines/browse',
      params: { medicineId: med.id },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarRow}>
          <Text style={styles.topBarTitle}>All Medicines</Text>
          <View style={styles.topBarIcons}>
            <Pressable onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#64748B" />
            </Pressable>
            <Pressable onPress={handleScanMedicine}>
              <Ionicons name="scan-outline" size={24} color="#64748B" />
            </Pressable>
          </View>
        </View>
        <Pressable style={styles.searchBar} onPress={handleSearch}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine, category…"
            placeholderTextColor="#94A3B8"
            value={searchQ}
            onChangeText={setSearchQ}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQ.length > 0 && (
            <Pressable onPress={() => setSearchQ('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); refetch().finally(() => setRefreshing(false)); }}
              tintColor='#0F766E'
            />
          }
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Categories ── */}
          <View style={styles.section}>
            <View style={styles.secHeader}>
              <Text style={styles.secTitle}>Categories</Text>
              <Pressable onPress={handleBrowseAll}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            {/* Paginated grid wrapper */}
            <View style={{ marginHorizontal: -H_PADDING }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                onScroll={(e) => {
                  const newPage = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  if (newPage !== catPage) setCatPage(newPage);
                }}
                scrollEventThrottle={16}
              >
                {Array.from({ length: Math.ceil(categories.length / 6) }, (_, pageIdx) => {
                  const pageCats = categories.slice(pageIdx * 6, pageIdx * 6 + 6);
                  return (
                    <View key={pageIdx} style={{ width: SCREEN_WIDTH, paddingHorizontal: H_PADDING }}>
                      <View style={styles.catGrid}>
                        {Array.from({ length: 2 }, (_, rowIdx) => {
                          const rowCats = pageCats.slice(rowIdx * CAT_COLUMNS, rowIdx * CAT_COLUMNS + CAT_COLUMNS);
                          if (rowCats.length === 0) return null;
                          return (
                            <View key={rowIdx} style={styles.catRow}>
                              {rowCats.map((cat) => (
                                <CategoryCard
                                  key={cat.id}
                                  item={cat}
                                  onPress={() => handleCategoryPress(cat)}
                                />
                              ))}
                              {/* Fill empty slots in last row so cards don't stretch */}
                              {rowCats.length < CAT_COLUMNS &&
                                Array.from({ length: CAT_COLUMNS - rowCats.length }, (_, i) => (
                                  <View key={`placeholder-${i}`} style={styles.catItemPlaceholder} />
                                ))
                              }
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* Pagination dots */}
            {categories.length > 6 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                {Array.from({ length: Math.ceil(categories.length / 6) }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: catPage === i ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: catPage === i ? Colors.primary : '#CBD5E1',
                    }}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ── Today's Reminder Banner ── */}
          <Pressable style={styles.reminderBanner} onPress={handleViewReminder}>
            <View style={styles.reminderLeft}>
              <Text style={styles.reminderEyebrow}>TODAY'S REMINDER</Text>
              <Text style={styles.reminderTitle}>
                {todayBanner && todayBanner.count > 0 
                  ? `${todayBanner.count} medicine${todayBanner.count !== 1 ? 's' : ''} due` 
                  : "No medicines due"}
              </Text>
              {todayBanner && todayBanner.count > 0 ? (
                <Text style={styles.reminderSub}>
                  Next: {todayBanner.nextName} at {todayBanner.nextTime}
                </Text>
              ) : (
                <Text style={styles.reminderSub}>
                  Set up a schedule
                </Text>
              )}
              {todayBanner && todayBanner.count > 0 && (
                <View style={styles.dotRow}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              )}
            </View>
            <View style={styles.reminderBtn}>
              <Text style={styles.reminderBtnText}>{todayBanner && todayBanner.count > 0 ? "View" : "Add"}</Text>
            </View>
          </Pressable>

          {/* ── Upload Prescription Banner ── */}
          <Pressable style={styles.rxBanner} onPress={() => router.push({ pathname: '/upload', params: { context: 'prescription' } } as any)}>
            <View style={styles.rxBannerIconWrap}>
              <Ionicons name="document-text" size={24} color="#0284C7" />
            </View>
            <View style={styles.rxBannerTextWrap}>
              <Text style={styles.rxBannerTitle}>Upload Prescription</Text>
              <Text style={styles.rxBannerSub}>Extract all your medicines instantly</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>

          {/* ── Quick Action Cards: Scan + Check Interactions ── */}
          <View style={styles.quickRow}>
            <Pressable style={styles.quickCard} onPress={handleScanMedicine}>
              <View style={[styles.quickIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="scan-outline" size={20} color="#16A34A" />
              </View>
              <Text style={styles.quickTitle}>Scan Medicine</Text>
              <Text style={styles.quickSub}>
                Point camera to identify a medicine
              </Text>
            </Pressable>

            <Pressable style={styles.quickCard} onPress={handleCheckInteractions}>
              <View style={[styles.quickIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="git-compare-outline" size={20} color="#EA580C" />
              </View>
              <Text style={styles.quickTitle}>Check Interactions</Text>
              <Text style={styles.quickSub}>
                Check if medicines are safe together
              </Text>
            </Pressable>
          </View>

          {/* ── My Medicines shortcut ── */}
          <Pressable
            style={styles.myMedsBanner}
            onPress={() => router.push('/medicines/my-medicines')}
          >
            <View style={styles.myMedsIcon}>
              <Ionicons name="bookmark-outline" size={18} color="#2563EB" />
            </View>
            <View style={styles.myMedsText}>
              <Text style={styles.myMedsTitle}>My Medicines</Text>
              <Text style={styles.myMedsSub}>View all your saved medicines</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </Pressable>

          {/* ── Recently Viewed ── */}
          {recentlyViewed.length > 0 && (
            <View style={[styles.section, { marginTop: 20 }]}>
              <View style={styles.secHeader}>
                <Text style={styles.secTitle}>Recently Viewed</Text>
                <Pressable onPress={handleBrowseAll}>
                  <Text style={styles.viewAll}>View All</Text>
                </Pressable>
              </View>
              <View style={styles.medList}>
                {recentlyViewed.slice(0, 5).map((med) => (
                  <MedicineRow
                    key={med.id}
                    med={med}
                    onPress={() => handleMedicinePress(med)}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#fff' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    backgroundColor: '#fff',
    paddingHorizontal: H_PADDING,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topBarTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  topBarIcons: { flexDirection: 'row', gap: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', padding: 0 },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll:        { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingTop: 16, paddingBottom: 16 },

  // ── Section wrapper ──────────────────────────────────────────────────────
  section: { paddingHorizontal: H_PADDING },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  secTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  viewAll:  { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // ── Category grid — explicit row layout ──────────────────────────────────
  catGrid: { gap: CAT_GAP },
  catRow: {
    flexDirection: 'row',
    gap: CAT_GAP,
  },
  catItem: {
    width: CAT_CARD_WIDTH,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  // Invisible placeholder keeps last row cards left-aligned at correct width
  catItemPlaceholder: {
    width: CAT_CARD_WIDTH,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 15,
  },

  // ── Reminder banner ──────────────────────────────────────────────────────
  reminderBanner: {
    marginHorizontal: H_PADDING,
    marginTop: 18,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderLeft:    { flex: 1, paddingRight: 12 },
  reminderEyebrow: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  reminderSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  dotRow:   { flexDirection: 'row', gap: 5 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive:{ width: 18, backgroundColor: '#fff' },
  reminderBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexShrink: 0,
  },
  reminderBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ── Quick action cards ────────────────────────────────────────────────────
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: H_PADDING,
    marginTop: 18,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 8,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  quickSub:   { fontSize: 11, color: '#94A3B8', lineHeight: 16 },

  // ── Upload Prescription Banner ────────────────────────────────────────────
  rxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginHorizontal: H_PADDING,
    marginTop: 18,
  },
  rxBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rxBannerTextWrap: { flex: 1 },
  rxBannerTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  rxBannerSub: { fontSize: 12, color: '#475569', marginTop: 2 },

  // ── My Medicines banner ───────────────────────────────────────────────────
  myMedsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 13,
    marginHorizontal: H_PADDING,  // consistent with rest of page
    marginTop: 10,
  },
  myMedsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  myMedsText:  { flex: 1 },
  myMedsTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  myMedsSub:   { fontSize: 12, color: '#94A3B8', marginTop: 1 },

  // ── Recently viewed ───────────────────────────────────────────────────────
  medList: { gap: 8 },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  medInfo:  { flex: 1, minWidth: 0 },   // minWidth:0 lets flex child truncate text
  medName:  { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  medSub:   { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  medRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  rxPill: {
    backgroundColor: '#FEE2E2',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rxText: { fontSize: 10, fontWeight: '700', color: '#B91C1C' },
});