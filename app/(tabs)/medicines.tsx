/**
 * app/(tabs)/medicines.tsx — Medicines hub (Care Hub style UI)
 * Keeps existing routes: browse, reminders, scanner, interactions, my-medicines, upload.
 */

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius } from '@/constants/Colors';
import { useMedicines } from '@/hooks/useMedicines';
import type { Category, Medicine, Reminder } from '@/services/Medicinesapi';

const H_PAD = 16;

function whenLabel(when: Reminder['whenToTake']): string {
  switch (when) {
    case 'before_food':
      return 'before food';
    case 'with_food':
      return 'with food';
    case 'bedtime':
      return 'at bedtime';
    default:
      return 'after food';
  }
}

function timeOfDayIcon(time: string): keyof typeof Ionicons.glyphMap {
  const t = time.toUpperCase();
  if (t.includes('AM') || t.startsWith('0') || t.startsWith('1')) {
    const hour = parseInt(time, 10);
    if (!Number.isNaN(hour) && hour >= 5 && hour < 12) return 'sunny-outline';
    if (!Number.isNaN(hour) && hour >= 12 && hour < 17) return 'partly-sunny-outline';
  }
  if (t.includes('PM')) return 'moon-outline';
  return 'alarm-outline';
}

function LibraryCard({
  cat,
  count,
  onPress,
}: {
  cat: Category;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.libCard, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={[styles.libIcon, { backgroundColor: cat.bg || '#ECFDF5' }]}>
        <Ionicons name={(cat.icon as any) || 'medical-outline'} size={20} color={cat.color || Colors.primary} />
      </View>
      <Text style={styles.libLabel} numberOfLines={2}>
        {cat.name}
      </Text>
      {count != null && <Text style={styles.libCount}>{count}</Text>}
    </Pressable>
  );
}

export default function Medicines() {
  const [searchQ, setSearchQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    categories,
    recentlyViewed,
    todayReminders,
    todayBanner,
    loading,
    refetch,
  } = useMedicines();

  const handleCategoryPress = (cat: Category) => {
    router.push({
      pathname: '/medicines/browse',
      params: { categoryId: cat.id, categoryName: cat.name },
    });
  };

  const handleViewReminder = () => router.push('/medicines/reminders');
  const handleScanMedicine = () => router.push('/medicines/scanner');
  const handleCheckInteractions = () => router.push('/medicines/check-interactions');
  const handleBrowseAll = () => router.push('/medicines/browse');

  const handleSearch = () => {
    if (searchQ.trim()) {
      router.push({
        pathname: '/medicines/browse',
        params: { query: searchQ.trim() },
      });
    } else {
      handleBrowseAll();
    }
  };

  const handleMedicinePress = (med: Medicine) => {
    router.push({
      pathname: '/medicine/[id]',
      params: { id: med.id },
    });
  };

  const stats = useMemo(() => {
    const active = todayReminders.filter((r) => r.status === 'upcoming' || r.status === 'taken').length;
    const missed = todayReminders.filter((r) => r.status === 'missed').length;
    const taken = todayReminders.filter((r) => r.status === 'taken').length;
    const week = Math.max(todayReminders.length * 7, todayBanner?.count ? todayBanner.count * 7 : 0);
    const denom = taken + missed;
    const adherence = denom === 0 ? 100 : Math.round((taken / denom) * 100);
    return {
      active: todayBanner?.count ?? active,
      missed,
      week: week || 0,
      adherence,
    };
  }, [todayReminders, todayBanner]);

  const scheduleItems = todayReminders.slice(0, 2);
  const refillMed = recentlyViewed[0] ?? null;

  const libraryCats: Category[] = [
    {
      id: 'all',
      name: 'All Medicines',
      icon: 'medical',
      color: '#16A34A',
      bg: '#DCFCE7',
    },
    ...categories.slice(0, 8),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Medicines</Text>
          <Text style={styles.subtitle}>Manage your medicines and reminders</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')} hitSlop={8}>
          <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          <View style={styles.notifDot} />
        </Pressable>
        <Pressable style={styles.scanBtn} onPress={handleScanMedicine}>
          <Ionicons name="scan-outline" size={16} color="#fff" />
          <Text style={styles.scanTxt}>Scan</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                refetch().finally(() => setRefreshing(false));
              }}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Search */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search medicines, conditions..."
              placeholderTextColor={Colors.textMuted}
              value={searchQ}
              onChangeText={setSearchQ}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Pressable onPress={handleSearch} hitSlop={8}>
              <Ionicons name="mic-outline" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* Promo banner */}
          <Pressable style={styles.promoBanner} onPress={handleViewReminder}>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>Stay on track with your medicines</Text>
              <Text style={styles.promoSub}>
                Get reminders, track intake and never miss a dose.
              </Text>
            </View>
            <View style={styles.promoArt}>
              <Ionicons name="medical" size={22} color={Colors.primary} />
              <View style={styles.promoClock}>
                <Ionicons name="time" size={14} color={Colors.primary} />
              </View>
            </View>
          </Pressable>

          {/* Today's Schedule */}
          <View style={styles.section}>
            <View style={styles.secHeader}>
              <Text style={styles.secTitle}>Today's Schedule</Text>
              <Pressable style={styles.linkRow} onPress={handleViewReminder} hitSlop={8}>
                <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                <Text style={styles.linkTxt}>View calendar</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              {scheduleItems.length === 0 ? (
                <Pressable style={styles.emptySchedule} onPress={handleViewReminder}>
                  <Ionicons name="alarm-outline" size={28} color={Colors.primary} />
                  <Text style={styles.emptyTitle}>No doses scheduled today</Text>
                  <Text style={styles.emptySub}>Add a reminder to stay on track</Text>
                </Pressable>
              ) : (
                scheduleItems.map((r, idx) => {
                  const taken = r.status === 'taken';
                  return (
                    <Pressable
                      key={r.id}
                      style={[styles.schedRow, idx > 0 && styles.schedDivider]}
                      onPress={handleViewReminder}
                    >
                      <View style={styles.schedTime}>
                        <Ionicons
                          name={timeOfDayIcon(r.time)}
                          size={14}
                          color={Colors.warning}
                        />
                        <Text style={styles.schedTimeTxt}>
                          {r.time.includes('AM') || r.time.includes('PM')
                            ? r.time
                            : `Morning ${r.time}`}
                        </Text>
                      </View>
                      <View style={styles.schedBody}>
                        <View style={styles.pillIcon}>
                          <Ionicons name="medical" size={18} color="#DB2777" />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.medName} numberOfLines={1}>
                            {r.medicineName}
                          </Text>
                          <Text style={styles.medHint} numberOfLines={1}>
                            1 dose {whenLabel(r.whenToTake)}
                          </Text>
                          <View style={styles.forTag}>
                            <Text style={styles.forTagTxt}>Reminder</Text>
                          </View>
                        </View>
                        <View style={styles.takenWrap}>
                          <View
                            style={[
                              styles.takenCircle,
                              taken ? styles.takenYes : styles.takenNo,
                            ]}
                          >
                            <Ionicons
                              name={taken ? 'checkmark' : 'ellipse-outline'}
                              size={16}
                              color={taken ? '#fff' : Colors.textMuted}
                            />
                          </View>
                          <Text style={[styles.takenLbl, taken && { color: Colors.success }]}>
                            {taken ? 'Taken' : r.status === 'missed' ? 'Missed' : 'Due'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}

              <Pressable style={styles.fullLink} onPress={handleViewReminder}>
                <Text style={styles.fullLinkTxt}>View full schedule ›</Text>
              </Pressable>
            </View>
          </View>

          {/* Medicine Reminders stats */}
          <View style={styles.section}>
            <View style={styles.secHeader}>
              <Text style={styles.secTitle}>Medicine Reminders</Text>
              <Pressable onPress={handleViewReminder} hitSlop={8}>
                <Text style={styles.linkTxt}>View all ›</Text>
              </Pressable>
            </View>
            <View style={styles.statsRow}>
              <Pressable style={styles.statCard} onPress={handleViewReminder}>
                <View style={[styles.statIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="alarm" size={16} color="#16A34A" />
                </View>
                <Text style={[styles.statNum, { color: '#16A34A' }]}>{stats.active}</Text>
                <Text style={styles.statLabel}>Active Reminders</Text>
                <Text style={styles.statHint}>On track</Text>
              </Pressable>
              <Pressable style={styles.statCard} onPress={handleViewReminder}>
                <View style={[styles.statIcon, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="alert-circle" size={16} color="#EA580C" />
                </View>
                <Text style={[styles.statNum, { color: '#EA580C' }]}>{stats.missed}</Text>
                <Text style={styles.statLabel}>Missed</Text>
                <Text style={styles.statHint}>{stats.missed === 0 ? 'Great!' : 'Review'}</Text>
              </Pressable>
              <Pressable style={styles.statCard} onPress={handleViewReminder}>
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="calendar" size={16} color="#2563EB" />
                </View>
                <Text style={[styles.statNum, { color: '#2563EB' }]}>{stats.week}</Text>
                <Text style={styles.statLabel}>This Week</Text>
                <Text style={styles.statHint}>Doses</Text>
              </Pressable>
              <Pressable style={styles.statCard} onPress={handleViewReminder}>
                <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="stats-chart" size={16} color="#7C3AED" />
                </View>
                <Text style={[styles.statNum, { color: '#7C3AED' }]}>{stats.adherence}%</Text>
                <Text style={styles.statLabel}>Adherence</Text>
                <Text style={styles.statHint}>
                  {stats.adherence >= 90 ? 'Excellent' : 'Keep going'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Refill & Orders */}
          <View style={styles.section}>
            <View style={styles.secHeader}>
              <Text style={styles.secTitle}>Refill & Orders</Text>
              <Pressable onPress={() => router.push('/medicines/my-medicines')} hitSlop={8}>
                <Text style={styles.linkTxt}>View all ›</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              {refillMed ? (
                <View style={styles.refillRow}>
                  <View style={styles.bottleIcon}>
                    <Ionicons name="flask-outline" size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.medName} numberOfLines={1}>
                      {refillMed.name}
                    </Text>
                    <Text style={styles.medHint}>
                      {refillMed.form} • {refillMed.category}
                    </Text>
                    <Text style={styles.refillNote}>Recently viewed medicine</Text>
                  </View>
                  <Pressable
                    style={styles.orderBtn}
                    onPress={() => handleMedicinePress(refillMed)}
                  >
                    <Text style={styles.orderBtnTxt}>Order Again</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.emptySchedule}
                  onPress={() => router.push('/medicines/my-medicines')}
                >
                  <Text style={styles.emptyTitle}>No refill items yet</Text>
                  <Text style={styles.emptySub}>Saved medicines will appear here</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Medicine Library */}
          <View style={styles.section}>
            <View style={styles.secHeader}>
              <Text style={styles.secTitle}>Medicine Library</Text>
              <Pressable onPress={handleBrowseAll} hitSlop={8}>
                <Text style={styles.linkTxt}>View all ›</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.libRow}
            >
              {libraryCats.map((cat) => (
                <LibraryCard
                  key={cat.id}
                  cat={cat}
                  onPress={() =>
                    cat.id === 'all' ? handleBrowseAll() : handleCategoryPress(cat)
                  }
                />
              ))}
            </ScrollView>
          </View>

          {/* Quick actions kept reachable */}
          <View style={styles.quickRow}>
            <Pressable style={styles.quickCard} onPress={handleScanMedicine}>
              <View style={[styles.quickIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="scan-outline" size={20} color="#16A34A" />
              </View>
              <Text style={styles.quickTitle}>Scan Medicine</Text>
              <Text style={styles.quickSub}>Identify with camera</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={handleCheckInteractions}>
              <View style={[styles.quickIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="git-compare-outline" size={20} color="#EA580C" />
              </View>
              <Text style={styles.quickTitle}>Check Interactions</Text>
              <Text style={styles.quickSub}>Safety check together</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.rxBanner}
            onPress={() =>
              router.push({ pathname: '/upload', params: { context: 'prescription' } } as any)
            }
          >
            <View style={styles.rxIcon}>
              <Ionicons name="document-text" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rxTitle}>Upload Prescription</Text>
              <Text style={styles.rxSub}>Extract medicines instantly</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>

          {/* Safety banner */}
          <View style={styles.safetyBanner}>
            <View style={styles.safetyIcon}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.safetyText}>
              <Text style={styles.safetyBold}>Safety First. </Text>
              We never share your medicine information. Your health data is 100% secure.
            </Text>
            <Ionicons name="lock-closed" size={18} color={Colors.primary} />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: H_PAD,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  subtitle: { marginTop: 2, fontSize: 13, color: Colors.textMuted },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scanTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: H_PAD,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },

  promoBanner: {
    marginHorizontal: H_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    marginBottom: 18,
  },
  promoTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  promoSub: { marginTop: 4, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  promoArt: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoClock: { position: 'absolute', right: 4, bottom: 4 },

  section: { marginBottom: 18, paddingHorizontal: H_PAD },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  secTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkTxt: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  emptySchedule: { alignItems: 'center', gap: 6, paddingVertical: 22, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 12, color: Colors.textMuted },

  schedRow: { padding: 14, gap: 10 },
  schedDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  schedTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  schedTimeTxt: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  schedBody: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pillIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  medHint: { marginTop: 2, fontSize: 12, color: Colors.textMuted },
  forTag: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  forTagTxt: { fontSize: 10, fontWeight: '700', color: '#15803D' },
  takenWrap: { alignItems: 'center', gap: 4 },
  takenCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takenYes: { backgroundColor: Colors.success },
  takenNo: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: Colors.border },
  takenLbl: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },
  fullLink: { alignItems: 'center', paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  fullLinkTxt: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  statHint: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  refillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  bottleIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refillNote: { marginTop: 4, fontSize: 11, color: Colors.textMuted },
  orderBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  orderBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  libRow: { gap: 10, paddingRight: 8 },
  libCard: {
    width: 104,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
  },
  libIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libLabel: { fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 15 },
  libCount: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: H_PAD,
    marginBottom: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 6,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  quickSub: { fontSize: 11, color: Colors.textMuted },

  rxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: H_PAD,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 12,
  },
  rxIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  rxSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  safetyBanner: {
    marginHorizontal: H_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
  },
  safetyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyText: { flex: 1, fontSize: 12, color: '#166534', lineHeight: 17 },
  safetyBold: { fontWeight: '800' },
});
