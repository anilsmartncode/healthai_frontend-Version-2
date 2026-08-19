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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Radius } from '@/constants/Colors';
import { useMedicines } from '@/hooks/useMedicines';
import { useNotifications } from '@/hooks/useNotifications';
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

function getFormIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('syrup') || n.includes('suspension')) return 'bottle-tonic-plus';
  if (n.includes('injection') || n.includes('vaccine') || n.includes('pen')) return 'needle';
  if (n.includes('drop')) return 'water-outline';
  if (n.includes('cream') || n.includes('gel') || n.includes('ointment')) return 'lotion';
  if (n.includes('inhaler') || n.includes('spray')) return 'spray';
  if (n.includes('capsule')) return 'pill';
  return 'pill'; // default tablet/pill
}

function getFormColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('syrup') || n.includes('suspension')) return '#B45309'; // Clinical Bronze
  if (n.includes('injection') || n.includes('vaccine') || n.includes('pen')) return '#BE123C'; // Muted Rose
  if (n.includes('drop')) return '#0369A1'; // Ocean Blue
  if (n.includes('cream') || n.includes('gel') || n.includes('ointment')) return '#6D28D9'; // Soft Violet
  if (n.includes('inhaler') || n.includes('spray')) return '#64748B'; // Clinical Slate
  if (n.includes('capsule')) return '#C2410C'; // Burnt Orange
  return '#0F766E'; // Medical Teal for tablets
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

// ─── MEDICINE ROW ─────────────────────────────────────────────────────────────
function MedicineRow({
  med,
  onPress,
  onDelete,
}: {
  med: Medicine;
  onPress: () => void;
  onDelete?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.medRow, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[styles.medIcon, { backgroundColor: getFormColor(med.name) + '15' }]}>
        <MaterialCommunityIcons name={getFormIcon(med.name) as any} size={22} color={getFormColor(med.name)} />
      </View>
      <View style={styles.medInfo}>
        <Text style={styles.medName}>{med.name}</Text>
        <Text style={styles.medSub}>
          {med.form} · {med.category}
        </Text>
      </View>
      <View style={styles.medRight}>
        {med.rx && (
          <View style={styles.rxPill}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        )}
        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={10} style={{ paddingLeft: 8 }}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        )}
      </View>
    </Pressable>
  );
}

// ─── SAVED MEDICINE ROW ───────────────────────────────────────────────────────
function SavedMedicineRow({
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
      <View style={[styles.medIcon, { backgroundColor: getFormColor(med.name) + '15' }]}>
        <MaterialCommunityIcons name={getFormIcon(med.name) as any} size={22} color={getFormColor(med.name)} />
      </View>
      <View style={styles.medInfo}>
        <Text style={styles.medName}>{med.name}</Text>
        <Text style={styles.medSub}>
          {med.form || (med as any).type || 'Medicine'} · {med.category || 'General'}
        </Text>
      </View>
      <View style={styles.medRight}>
        {med.rx || (med as any).prescriptionType === 'Prescription' ? (
          <View style={styles.rxPill}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        ) : null}
        <Ionicons name="bookmark" size={16} color="#16A34A" />
      </View>
    </Pressable>
  );
}

export default function Medicines() {
  const [searchQ, setSearchQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount } = useNotifications();

  const {
    categories,
    recentlyViewed,
    savedMedicines,
    todayReminders,
    todayBanner,
    loading,
    refetch,
    removeRecentlyViewed,
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

  const handleUploadPrescription = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (r.canceled || !r.assets || r.assets.length === 0) return;
      const file = r.assets[0];
      
      router.push({
        pathname: '/upload',
        params: {
          context: 'prescription',
          fileUri: file.uri,
          fileName: file.name,
          mimeType: file.mimeType ?? 'application/pdf',
        }
      });
    } catch (err) {
      Alert.alert('Upload Error', 'Failed to pick document.');
    }
  };

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



  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Medicines</Text>
          <Text style={styles.subtitle}>Manage your medicines and reminders</Text>
        </View>
        <Pressable
          style={styles.iconBtn}
          onPress={() => router.push('/medicines/my-medicines')}
          hitSlop={8}
          accessibilityLabel="Saved Medicines"
        >
          <Ionicons name="bookmark-outline" size={20} color={Colors.text} />
          {savedMedicines.length > 0 && (
            <View style={[styles.badge, { backgroundColor: '#16A34A' }]}>
              <Text style={styles.badgeText}>{savedMedicines.length}</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')} hitSlop={8}>
          <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
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
          </View>


          {/* Today's Schedule */}
          <View style={styles.section}>
            <View style={styles.secHeader}>
              <Text style={styles.secTitle}>Today's Schedule</Text>
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
                      <View style={[styles.pillIcon, { backgroundColor: getFormColor(r.medicineName) + '15' }]}>
                        <MaterialCommunityIcons name={getFormIcon(r.medicineName) as any} size={22} color={getFormColor(r.medicineName)} />
                      </View>
                      
                      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                        <Text style={styles.medName} numberOfLines={1}>
                          {r.medicineName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Ionicons name="time-outline" size={12} color="#64748B" />
                          <Text style={styles.medHint} numberOfLines={1}>
                            {r.time} • {whenLabel(r.whenToTake)}
                          </Text>
                        </View>
                      </View>
                        <View style={styles.statusWrap}>
                          <Text style={[styles.statusLbl, taken && { color: Colors.success }]}>
                            {taken ? 'Taken' : r.status === 'missed' ? 'Missed' : 'Due'}
                          </Text>
                          <View
                            style={[
                              styles.takenCircle,
                              taken ? styles.takenYes : styles.takenNo,
                            ]}
                          >
                            <Ionicons
                              name={taken ? 'checkmark' : 'ellipse-outline'}
                              size={12}
                              color={taken ? '#fff' : Colors.textMuted}
                            />
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
            onPress={handleUploadPrescription}
          >
            <View style={styles.rxIcon}>
              <Ionicons name="document-text" size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rxTitle}>Upload Prescription</Text>
              <Text style={styles.rxSub}>Extract all your medicines instantly</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>

          {/* ── Saved Medicines ── */}
          <View style={[styles.section, { marginTop: 18 }]}>
            <View style={styles.secHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="bookmark" size={18} color="#16A34A" />
                <Text style={styles.secTitle}>Saved Medicines</Text>
              </View>
              <Pressable onPress={() => router.push('/medicines/my-medicines')} hitSlop={8}>
                <Text style={styles.linkTxt}>
                  {savedMedicines.length > 0 ? `View all (${savedMedicines.length}) ›` : 'View all ›'}
                </Text>
              </Pressable>
            </View>

            {savedMedicines.length === 0 ? (
              <Pressable
                style={[styles.card, styles.emptySchedule]}
                onPress={handleBrowseAll}
              >
                <Ionicons name="bookmark-outline" size={28} color="#16A34A" />
                <Text style={styles.emptyTitle}>No saved medicines yet</Text>
                <Text style={styles.emptySub}>Tap the bookmark icon on any medicine to save it here</Text>
              </Pressable>
            ) : (
              <View style={styles.medList}>
                {savedMedicines.slice(0, 4).map((med, idx) => (
                  <SavedMedicineRow
                    key={`saved_${med.id}_${idx}`}
                    med={med}
                    onPress={() =>
                      router.push({
                        pathname: '/medicine/[id]',
                        params: { id: med.id, isSaved: 'true' },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>

          {/* ── Recently Viewed ── */}
          {/* @ts-ignore - recentlyViewed might be defined in the original branch */}
          {typeof recentlyViewed !== 'undefined' && recentlyViewed.length > 0 && (
            <View style={[styles.section, { marginTop: 20 }]}>
              <View style={styles.secHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={18} color={Colors.textMuted} />
                  <Text style={styles.secTitle}>Recent Searches</Text>
                </View>
                <Pressable onPress={handleBrowseAll} hitSlop={8}>
                  <Text style={styles.linkTxt}>View all ›</Text>
                </Pressable>
              </View>
              <View style={styles.medList}>
                {recentlyViewed.slice(0, 5).map((med: any, idx: number) => (
                  <MedicineRow
                    key={`recent_${med.id}_${idx}`}
                    med={med}
                    onPress={() => handleMedicinePress(med)}
                    onDelete={() => {
                      Alert.alert(
                        'Remove from history',
                        'Remove this medicine from your recently viewed list?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => removeRecentlyViewed(med.id) }
                        ]
                      );
                    }}
                  />
                ))}
              </View>
            </View>
          )}



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
    alignItems: 'center',
    gap: 12,
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
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },


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
  viewAll: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  medList: { gap: 12 },
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
  medInfo: { flex: 1 },
  medSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  medRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rxPill: {
    backgroundColor: '#FEE2E2',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rxText: { fontSize: 10, fontWeight: '700', color: '#B91C1C' },
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

  schedRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  schedDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  pillIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  medHint: { fontSize: 12, color: '#64748B' },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusLbl: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  takenCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takenYes: { backgroundColor: Colors.success },
  takenNo: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1' },
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


});
