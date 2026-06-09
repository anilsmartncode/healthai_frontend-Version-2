/**
 * app/medicines/browse.tsx
 *
 * Browse All Medicines — dedicated screen.
 *
 * Flow (matches design Image 1):
 *   1  Browse Home         → GET /api/medicines/categories        (~0.3–0.6s)
 *   2  Search Medicines    → GET /api/medicines/search?q=         (~0.4–0.8s)
 *   3  Filter by Category  → GET /api/medicines?category_id=      (~0.5–1.0s)
 *   4  Medicine Details    → GET /api/medicines/:id               (~0.6–1.2s)
 *   5  Save Medicine       → POST /api/user/medicines             (~0.3–0.6s)
 *   6  Actions from detail (Set Reminder → /medicines/reminders,
 *                           Check Interactions → /medicines/check-interactions)
 *   7  Recently Viewed     → GET /api/medicines/recent            (~0.3–0.6s)
 *
 * API Layer: services/medicinesApi.ts
 *   • Flip 🟢 MOCK → 🔴 REAL by editing that file only.
 *
 * Accepts route params (from medicines tab):
 *   • categoryId / categoryName  — pre-selects a category filter
 *   • query                      — pre-fills the search box
 *   • medicineId                 — opens the detail modal directly
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';

// ─── API SERVICE ─────────────────────────────────────────────────────────────
import {
  getCategories,
  searchMedicines,
  getMedicinesByCategory,
  getMedicineDetails,
  saveMedicine,
  getRecentlyViewed,
  getPopularMedicines,
  type Category,
  type Medicine,
} from '@/services/Medicinesapi';

// ─── MEDICINE ROW ─────────────────────────────────────────────────────────────
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
      <View style={[styles.medIcon, { backgroundColor: Colors.primary + '15' }]}>
        <Ionicons name="medical-outline" size={18} color={Colors.primary} />
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
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </View>
    </Pressable>
  );
}

// ─── MEDICINE DETAIL MODAL ────────────────────────────────────────────────────
function MedicineDetailModal({
  med,
  visible,
  onClose,
  onSave,
}: {
  med: Medicine | null;
  visible: boolean;
  onClose: () => void;
  onSave: (med: Medicine) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) setSaved(false);
  }, [visible, med?.id]);

  if (!med) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      // API 5 — POST /api/user/medicines { medicine_id }
      await saveMedicine(med.id);
      setSaved(true);
      onSave(med);
      Alert.alert('Medicine Saved Successfully!', `${med.name} added to My Medicines.`);
    } catch {
      Alert.alert('Error', 'Could not save medicine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetReminder = () => {
    onClose();
    router.push('/medicines/reminders');
  };

  const handleCheckInteractions = () => {
    onClose();
    router.push('/medicines/check-interactions');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#fff' }}
        edges={['top', 'bottom']}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.modalBackBtn}>
            <Ionicons name="chevron-back" size={20} color="#0F172A" />
          </Pressable>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {med.name}
          </Text>
          <Pressable onPress={handleSave} hitSlop={8}>
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={22}
              color={saved ? '#E11D48' : '#94A3B8'}
            />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          {/* Header card */}
          <View style={styles.detailCard}>
            <View style={styles.detailIconLg}>
              <Ionicons name="medical-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.detailNameLg}>{med.name}</Text>
            <Text style={styles.detailFormLg}>{med.form}</Text>
            {med.rx && (
              <View style={styles.rxBadge}>
                <Text style={styles.rxBadgeText}>Prescription Required</Text>
              </View>
            )}
          </View>

          {/* Detail rows */}
          {med.uses && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Uses</Text>
              <Text style={styles.infoValue}>{med.uses}</Text>
            </View>
          )}
          {med.dosage && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Dosage</Text>
              <Text style={styles.infoValue}>{med.dosage}</Text>
            </View>
          )}
          {med.sideEffects && med.sideEffects.length > 0 && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Side Effects</Text>
              <Text style={styles.infoValue}>
                {med.sideEffects.map((s) => `• ${s}`).join('\n')}
              </Text>
            </View>
          )}

          <Pressable onPress={() => Alert.alert('Full Info', 'View complete medicine information')}>
            <Text style={styles.viewMore}>View More</Text>
          </Pressable>

          {/* Action buttons */}
          <View style={styles.detailBtns}>
            <Pressable
              style={[styles.primaryBtn, saved && { backgroundColor: '#16A34A' }]}
              onPress={handleSave}
              disabled={saving || saved}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={saved ? 'checkmark' : 'bookmark-outline'}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.primaryBtnText}>
                    {saved ? 'Saved!' : 'Save Medicine'}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable style={styles.outlineBtn} onPress={handleSetReminder}>
              <Ionicons name="alarm-outline" size={16} color={Colors.primary} />
              <Text style={styles.outlineBtnText}>Set Reminder</Text>
            </Pressable>
          </View>

          {/* Extra actions */}
          <View style={styles.extraActions}>
            {[
              { icon: 'notifications-outline', label: 'Set Reminder', onPress: handleSetReminder },
              { icon: 'git-compare-outline',   label: 'Check Interactions', onPress: handleCheckInteractions },
              {
                icon: 'sparkles-outline',
                label: 'Ask AI About Medicine',
                onPress: () => Alert.alert('Ask AI', `Ask AI about ${med.name}`),
              },
              {
                icon: 'bookmark-outline',
                label: 'Add to My Medicines',
                onPress: handleSave,
              },
            ].map((a) => (
              <Pressable
                key={a.label}
                style={({ pressed }) => [styles.extraActionRow, pressed && { opacity: 0.7 }]}
                onPress={a.onPress}
              >
                <Ionicons name={a.icon as any} size={18} color={Colors.primary} />
                <Text style={styles.extraActionLabel}>{a.label}</Text>
                <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function BrowseMedicinesScreen() {
  const params = useLocalSearchParams<{
    categoryId?: string;
    categoryName?: string;
    query?: string;
    medicineId?: string;
  }>();

  const [searchQ, setSearchQ] = useState(params.query ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [popular, setPopular] = useState<Medicine[]>([]);
  const [recently, setRecently] = useState<Medicine[]>([]);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  // ── Load categories + popular + recently viewed on mount ─────────────────
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // API 1 — GET /api/medicines/categories
        // API 7 — GET /api/medicines/popular
        // API 6 — GET /api/medicines/recent
        const [cats, pop, rec] = await Promise.all([
          getCategories(),
          getPopularMedicines(6),
          getRecentlyViewed(1, 5),
        ]);
        setCategories(cats);
        setPopular(pop);
        setRecently(rec);

        // Handle deep-link params
        if (params.categoryId) {
          const cat = cats.find((c) => c.id === params.categoryId) ?? null;
          setSelectedCategory(cat);
        }
      } catch (e) {
        console.error('[Browse] init error', e);
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Open detail directly if medicineId passed ─────────────────────────────
  useEffect(() => {
    if (params.medicineId && !loading) {
      openDetail(params.medicineId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.medicineId, loading]);

  // ── Search whenever query changes ─────────────────────────────────────────
  useEffect(() => {
    if (!searchQ.trim()) {
      setMedicines([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setListLoading(true);
      try {
        // API 2 — GET /api/medicines/search?q=searchQ
        const results = await searchMedicines(searchQ, 1, 20);
        if (!cancelled) setMedicines(results);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }, 350); // debounce
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQ]);

  // ── Load medicines when category changes ──────────────────────────────────
  useEffect(() => {
    if (!selectedCategory) return;
    let cancelled = false;
    (async () => {
      setListLoading(true);
      try {
        // API 3 — GET /api/medicines?category_id=
        const results = await getMedicinesByCategory(selectedCategory.id, 1, 20);
        if (!cancelled) setMedicines(results);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCategory]);

  const openDetail = async (medId: string) => {
    setListLoading(true);
    try {
      // API 4 — GET /api/medicines/:id
      const med = await getMedicineDetails(medId);
      if (med) {
        setSelectedMed(med);
        setDetailVisible(true);
      }
    } catch {
      Alert.alert('Error', 'Could not load medicine details.');
    } finally {
      setListLoading(false);
    }
  };

  const openDetailFromMed = (med: Medicine) => {
    // If we already have full detail (uses/dosage), open directly
    if (med.uses) {
      setSelectedMed(med);
      setDetailVisible(true);
    } else {
      openDetail(med.id);
    }
  };

  const isSearching = searchQ.trim().length > 0;
  const isFiltered = !!selectedCategory && !isSearching;

  const headerTitle = selectedCategory
    ? `${selectedCategory.name} Medicines`
    : 'All Medicines';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <Pressable
          onPress={() => {
            setSelectedCategory(null);
            setSearchQ('');
            setMedicines([]);
          }}
          hitSlop={8}
          style={styles.filterIconBtn}
        >
          <Ionicons name="options-outline" size={22} color="#64748B" />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine…"
            placeholderTextColor="#94A3B8"
            value={searchQ}
            onChangeText={(t) => {
              setSearchQ(t);
              if (t.trim()) setSelectedCategory(null);
            }}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {(searchQ.length > 0 || selectedCategory) && (
            <Pressable
              onPress={() => {
                setSearchQ('');
                setSelectedCategory(null);
                setMedicines([]);
              }}
            >
              <Text style={{ fontSize: 12, color: '#64748B' }}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── Category filter chips ── */}
          {!isSearching && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}
            >
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.catChip,
                    selectedCategory?.id === cat.id && {
                      backgroundColor: cat.color + '20',
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory?.id === cat.id ? null : cat,
                    )
                  }
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={
                      selectedCategory?.id === cat.id ? cat.color : '#64748B'
                    }
                  />
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory?.id === cat.id && {
                        color: cat.color,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {listLoading && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}

          {/* ── Search results ── */}
          {isSearching && !listLoading && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              <View style={styles.medList}>
                {medicines.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="search-outline" size={28} color="#CBD5E1" />
                    <Text style={styles.emptyText}>
                      No results for "{searchQ}"
                    </Text>
                  </View>
                ) : (
                  medicines.map((m) => (
                    <MedicineRow
                      key={m.id}
                      med={m}
                      onPress={() => openDetailFromMed(m)}
                    />
                  ))
                )}
              </View>
            </View>
          )}

          {/* ── Category filtered results ── */}
          {isFiltered && !listLoading && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedCategory!.name} Medicines
              </Text>
              <View style={styles.medList}>
                {medicines.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="medical-outline" size={28} color="#CBD5E1" />
                    <Text style={styles.emptyText}>
                      No medicines in this category
                    </Text>
                  </View>
                ) : (
                  medicines.map((m) => (
                    <MedicineRow
                      key={m.id}
                      med={m}
                      onPress={() => openDetailFromMed(m)}
                    />
                  ))
                )}
              </View>
            </View>
          )}

          {/* ── Default home state ── */}
          {!isSearching && !isFiltered && !listLoading && (
            <>
              {/* Popular */}
              <View style={styles.section}>
                <View style={styles.secHeader}>
                  <Text style={styles.sectionTitle}>Popular Medicines</Text>
                  <Text style={styles.viewAll}>View All</Text>
                </View>
                <View style={styles.medList}>
                  {popular.map((m) => (
                    <MedicineRow
                      key={m.id}
                      med={m}
                      onPress={() => openDetailFromMed(m)}
                    />
                  ))}
                </View>
              </View>

              {/* Recently Viewed */}
              {recently.length > 0 && (
                <View style={[styles.section, { marginTop: 4 }]}>
                  <View style={styles.secHeader}>
                    <Text style={styles.sectionTitle}>Recently Viewed</Text>
                    {/* API 6 — GET /api/medicines/recent */}
                    <Text style={styles.viewAll}>View All</Text>
                  </View>
                  <View style={styles.medList}>
                    {recently.map((m) => (
                      <MedicineRow
                        key={m.id}
                        med={m}
                        onPress={() => openDetailFromMed(m)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Medicine Detail Modal */}
      <MedicineDetailModal
        med={selectedMed}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onSave={(_med) => {
          // Optionally refresh recently viewed
        }}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: 8,
  },
  filterIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },

  catRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  catChipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  section: { padding: 16 },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  viewAll: { fontSize: 13, fontWeight: '600', color: Colors.primary },

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
  medInfo: { flex: 1 },
  medName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  medSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  medRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rxPill: {
    backgroundColor: '#FEE2E2',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rxText: { fontSize: 10, fontWeight: '700', color: '#B91C1C' },

  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  emptyText: { fontSize: 14, color: '#94A3B8' },

  // Modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  modalBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0F172A' },
  detailCard: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
  },
  detailIconLg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailNameLg: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  detailFormLg: { fontSize: 14, color: '#94A3B8' },
  rxBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rxBadgeText: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  infoBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 14, color: '#334155', lineHeight: 21 },
  viewMore: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailBtns: { gap: 10 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  outlineBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  extraActions: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  extraActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  extraActionLabel: { flex: 1, fontSize: 14, color: '#334155', fontWeight: '500' },
});