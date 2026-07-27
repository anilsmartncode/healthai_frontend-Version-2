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

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Dimensions,
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
import { LanguageSelectModal } from '@/components/ui/LanguageSelectModal';
import { ENDPOINTS } from '@/constants/api';
import { api } from '@/services/api';

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

  // Translation State
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedUses, setTranslatedUses] = useState<string | null>(null);
  const [translatedDosage, setTranslatedDosage] = useState<string | null>(null);
  const [translatedSideEffects, setTranslatedSideEffects] = useState<string[] | null>(null);

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
      Alert.alert(
        '✓ Saved',
        `${med.name} added to My Medicines.`,
        [
          { text: 'View My Medicines', onPress: () => router.push('/medicines/my-medicines') },
          { text: 'OK', style: 'cancel' },
        ],
      );
    } catch {
      Alert.alert('Error', 'Could not save medicine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetReminder = () => {
    onClose();
    router.push(`/medicines/reminders/new?medicineId=${med.id}&medicineName=${encodeURIComponent(med.name)}`);
  };

  const handleCheckInteractions = () => {
    onClose();
    router.push(`/medicines/check-interactions?medicineId=${med.id}&medicineName=${encodeURIComponent(med.name)}`);
  };

  const handleTranslate = async (langCode: string, langName: string) => {
    if (!med) return;
    setTranslating(true);
    try {
      const texts: string[] = [];
      const keys: { key: string, index?: number }[] = [];

      if (med.uses) { texts.push(med.uses); keys.push({ key: 'uses' }); }
      if (med.dosage) { texts.push(med.dosage); keys.push({ key: 'dosage' }); }
      if (med.sideEffects) {
        med.sideEffects.forEach((se, i) => {
          texts.push(se); keys.push({ key: 'sideEffect', index: i });
        });
      }

      if (texts.length > 0) {
        const combined = texts.join('\n|||\n');
        const res = await api.request<any>(ENDPOINTS.translateTextPath, {
          method: 'POST',
          body: JSON.stringify({ text: combined, language: langCode }),
        });
        const trText = res?.translate_text ?? res?.translated_text ?? combined;
        const pieces = trText.split(/\|\|\|/g).map((s: string) => s.trim());

        if (pieces.length === texts.length) {
          const newSideEffects: string[] = [];
          keys.forEach((meta, idx) => {
            const translated = pieces[idx];
            if (meta.key === 'uses') setTranslatedUses(translated);
            if (meta.key === 'dosage') setTranslatedDosage(translated);
            if (meta.key === 'sideEffect') newSideEffects.push(translated);
          });
          if (newSideEffects.length > 0) setTranslatedSideEffects(newSideEffects);
        }
      }
    } catch (e) {
      console.warn('[Browse] Translation failed:', e);
    } finally {
      setTranslating(false);
    }
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
            
            <Pressable 
              onPress={() => setLangModalOpen(true)}
              hitSlop={10}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: Colors.primary + '10', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 }}
              disabled={translating}
            >
              {translating ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="language" size={18} color={Colors.primary} />
              )}
              <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '700' }}>
                {translating ? 'Translating...' : 'Translate'}
              </Text>
            </Pressable>
          </View>

          {/* Detail rows */}
          {med.uses && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Uses</Text>
              <Text style={styles.infoValue}>{translatedUses ?? med.uses}</Text>
            </View>
          )}
          {med.dosage && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Dosage</Text>
              <Text style={styles.infoValue}>{translatedDosage ?? med.dosage}</Text>
            </View>
          )}
          {(translatedSideEffects || med.sideEffects) && (translatedSideEffects || med.sideEffects)!.length > 0 && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Side Effects</Text>
              <Text style={styles.infoValue}>
                {(translatedSideEffects ?? med.sideEffects)!.map((s) => `• ${s}`).join('\n')}
              </Text>
            </View>
          )}

          <Pressable onPress={() => { onClose(); router.push(`/medicine/${med.id}` as any); }}>
            <Text style={styles.viewMore}>View More</Text>
          </Pressable>

          {/* Extra actions */}
          <View style={styles.extraActions}>
            {[
              { icon: 'notifications-outline', label: 'Set Reminder', onPress: handleSetReminder },
              { icon: 'git-compare-outline', label: 'Check Interactions', onPress: handleCheckInteractions },
              {
                icon: 'sparkles-outline',
                label: 'Ask AI About Medicine',
                onPress: () => { onClose(); router.push('/ai-chat'); },
              },
              {
                icon: saved ? 'bookmark' : 'bookmark-outline',
                label: saved ? 'Saved to My Medicines' : 'Add to My Medicines',
                onPress: handleSave,
                disabled: saving || saved,
                saved,
              },
            ].map((a) => (
              <Pressable
                key={a.label}
                style={({ pressed }) => [styles.extraActionRow, pressed && { opacity: 0.7 }]}
                onPress={a.onPress}
                disabled={a.disabled}
              >
                {a.label === 'Add to My Medicines' && saving ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons
                    name={a.icon as any}
                    size={18}
                    color={a.saved ? '#16A34A' : Colors.primary}
                  />
                )}
                <Text style={[styles.extraActionLabel, a.saved && { color: '#16A34A' }]}>
                  {a.label}
                </Text>
                {!(a.label === 'Add to My Medicines' && saving) && (
                  <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <LanguageSelectModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        onSelect={handleTranslate}
      />
    </Modal>
  );
}

// ─── CATEGORY GRID ───────────────────────────────────────────────────────────
const COLS = 3;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;
const SCREEN_W = Dimensions.get('window').width;

function CategoryGrid({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: Category[];
  selectedCategory: Category | null;
  onSelect: (cat: Category) => void;
}) {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pageW = SCREEN_W;

  // Split into pages of 6
  const pages: Category[][] = [];
  for (let i = 0; i < categories.length; i += PER_PAGE) {
    pages.push(categories.slice(i, i + PER_PAGE));
  }

  const handleScroll = (e: any) => {
    const newPage = Math.round(e.nativeEvent.contentOffset.x / pageW);
    setPage(newPage);
  };

  return (
    <View style={styles.catGridWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
      >
        {pages.map((pageCats, pi) => {
          // Pad to full grid so last page aligns
          const padded = [...pageCats];
          while (padded.length < PER_PAGE) padded.push(null as any);
          const rows: (Category | null)[][] = [];
          for (let r = 0; r < ROWS; r++) {
            rows.push(padded.slice(r * COLS, r * COLS + COLS));
          }
          return (
            <View key={pi} style={[styles.catPage, { width: pageW }]}>
              {rows.map((row, ri) => (
                <View key={ri} style={styles.catRow2}>
                  {row.map((cat, ci) =>
                    cat ? (
                      <Pressable
                        key={cat.id}
                        style={[
                          styles.catCard,
                          selectedCategory?.id === cat.id && {
                            backgroundColor: cat.color + '18',
                            borderColor: cat.color,
                            borderWidth: 1.5,
                          },
                        ]}
                        onPress={() => onSelect(cat)}
                      >
                        <View style={[styles.catIconBox, { backgroundColor: cat.color + '18' }]}>
                          <Ionicons
                            name={cat.icon as any}
                            size={18}
                            color={cat.color ?? Colors.primary}
                          />
                        </View>
                        <Text style={[styles.catCardText, selectedCategory?.id === cat.id && { color: cat.color }]} numberOfLines={2}>
                          {cat.name}
                        </Text>
                      </Pressable>
                    ) : (
                      <View key={`empty-${ci}`} style={[styles.catCard, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
                    )
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {/* Pagination dots */}
      {pages.length > 1 && (
        <View style={styles.catDots}>
          {pages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.catDot,
                { backgroundColor: i === page ? Colors.primary : '#CBD5E1', width: i === page ? 16 : 6 },
              ]}
            />
          ))}
        </View>
      )}
    </View>
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
      } catch (e) {
        console.error('[Browse] search error', e);
        if (!cancelled) setMedicines([]);
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
      } catch (e) {
        console.error('[Browse] category load error', e);
        if (!cancelled) setMedicines([]);
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

          {/* ── Category grid with paging ── */}
          {!isSearching && categories.length > 0 && (
            <CategoryGrid
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={(cat) =>
                setSelectedCategory(selectedCategory?.id === cat.id ? null : cat)
              }
            />
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

              {/* Similar Results Banner */}
              {medicines.length > 0 && searchQ.trim() !== '' && !medicines.some(m => m.name.toLowerCase() === searchQ.toLowerCase().trim()) && (
                <View style={{ backgroundColor: '#FFFBEB', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#FEF3C7', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="bulb" size={20} color="#D97706" />
                  <Text style={{ flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 }}>
                    We couldn't find an exact match for "{searchQ}". Showing similar medicines instead.
                  </Text>
                </View>
              )}

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

                {/* Add Manually Button */}
                <Pressable
                  style={({ pressed }) => [
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed', marginTop: 4 },
                    pressed && { backgroundColor: Colors.primary + '10' }
                  ]}
                  onPress={() => {
                    router.push({
                      pathname: '/medicines/reminders/new',
                      params: { medicineId: `manual_${Date.now()}`, medicineName: searchQ }
                    });
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>
                    Can't find it? Add "{searchQ}" manually
                  </Text>
                </Pressable>
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

  catGridWrapper: { paddingVertical: 12 },
  catPage: { flexDirection: 'column', gap: 10, paddingHorizontal: 16 },
  catRow2: { flexDirection: 'row', gap: 10 },
  catCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCardText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  catDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },

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