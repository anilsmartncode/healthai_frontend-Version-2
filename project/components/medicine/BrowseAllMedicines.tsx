/**
 * components/medicine/BrowseAllMedicines.tsx
 * Full Browse All Medicines screen:
 *  1. Home → Categories + Popular
 *  2. Search results
 *  3. Category filter list
 *  4. Medicine detail sheet
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getCategories,
  getPopularMedicines,
  searchMedicines,
  getMedicinesByCategory,
  getMedicineDetails,
  saveMedicine,
  getRecentlyViewed,
} from '@/services/medicineTabApi';
import type { Category, Medicine } from '@/services/medicineTabApi';

// ─── Category chip ────────────────────────────────────────────
function CategoryChip({
  cat,
  selected,
  onPress,
}: {
  cat: Category;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryChip, selected && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
    >
      <View style={[styles.categoryIcon, { backgroundColor: cat.color + '22' }]}>
        <Ionicons name={cat.icon as any} size={18} color={selected ? '#fff' : cat.color} />
      </View>
      <Text style={[styles.categoryLabel, selected && { color: '#fff' }]}>{cat.name}</Text>
    </Pressable>
  );
}

// ─── Medicine row card ────────────────────────────────────────
function MedRow({ med, onPress }: { med: Medicine; onPress: () => void }) {
  const badgeColor =
    med.prescriptionType === 'OTC'
      ? Colors.success
      : med.prescriptionType === 'High Risk'
      ? Colors.danger
      : Colors.warning;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.medRow}>
        <View style={styles.medIconWrap}>
          <Ionicons name="medkit-outline" size={22} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{med.name}</Text>
          <Text style={styles.medMeta}>{med.type}</Text>
        </View>
        <View style={[styles.prescBadge, { backgroundColor: badgeColor + '20' }]}>
          <Text style={[styles.prescText, { color: badgeColor }]}>{med.prescriptionType}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </Card>
    </Pressable>
  );
}

// ─── Medicine Detail Bottom Sheet ─────────────────────────────
function MedDetailSheet({
  medicine,
  visible,
  onClose,
}: {
  medicine: Medicine | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!medicine) return;
    setSaving(true);
    try {
      await saveMedicine(medicine.id);
      setSaved(true);
      Alert.alert('✓ Saved', 'Medicine saved to My Medicines.');
    } finally {
      setSaving(false);
    }
  };

  if (!medicine) return null;

  const badgeColor =
    medicine.prescriptionType === 'OTC'
      ? Colors.success
      : medicine.prescriptionType === 'High Risk'
      ? Colors.danger
      : Colors.warning;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.medIconLg}>
            <Ionicons name="medkit-outline" size={30} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>{medicine.name}</Text>
            <Text style={styles.sheetSub}>{medicine.type}</Text>
          </View>
          <Pressable onPress={onClose}>
            <Ionicons name="close-circle-outline" size={26} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Prescription badge */}
        <View style={[styles.prescBadge, { backgroundColor: badgeColor + '20', alignSelf: 'flex-start', marginBottom: 12 }]}>
          <Text style={[styles.prescText, { color: badgeColor }]}>{medicine.prescriptionType}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
          <DetailSection icon="flask-outline" title="Uses" body={medicine.uses} />
          <DetailSection icon="timer-outline" title="Dosage" body={medicine.dosage} />
          <DetailSection
            icon="warning-outline"
            title="Side Effects"
            body={medicine.sideEffects.map((s) => `• ${s}`).join('\n')}
          />
        </ScrollView>

        <View style={styles.sheetActions}>
          <Button
            title={saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Medicine'}
            onPress={handleSave}
            disabled={saved || saving}
            style={{ flex: 1 }}
          />
          <Button title="Set Reminder" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        </View>
      </View>
    </Modal>
  );
}

function DetailSection({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={styles.detailSection}>
      <View style={styles.detailRow}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
        <Text style={styles.detailTitle}>{title}</Text>
      </View>
      <Text style={styles.detailBody}>{body}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function BrowseAllMedicines() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Medicine[]>([]);
  const [recent, setRecent] = useState<Medicine[]>([]);
  const [results, setResults] = useState<Medicine[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Initial load
  useEffect(() => {
    (async () => {
      const [cats, pops, rec] = await Promise.all([
        getCategories(),
        getPopularMedicines(6),
        getRecentlyViewed(1, 4),
      ]);
      setCategories(cats);
      setPopular(pops);
      setRecent(rec);
      setLoading(false);
    })();
  }, []);

  // Search / category filter
  useEffect(() => {
    if (!query && !selectedCat) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const fetch = async () => {
      let data: Medicine[];
      if (query) {
        data = await searchMedicines(query);
      } else {
        data = await getMedicinesByCategory(selectedCat!);
      }
      if (!cancelled) {
        setResults(data);
        setSearching(false);
      }
    };
    const timer = setTimeout(fetch, 350); // debounce
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selectedCat]);

  const openDetail = async (med: Medicine) => {
    const full = await getMedicineDetails(med.id);
    setSelectedMed(full ?? med);
    setSheetOpen(true);
  };

  const onCategoryPress = (catId: string) => {
    setSelectedCat((prev) => (prev === catId ? null : catId));
    setQuery('');
  };

  const showingResults = !!(query || selectedCat);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Medicines…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medicine, category…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setSelectedCat(null);
          }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            cat={c}
            selected={selectedCat === c.id}
            onPress={() => onCategoryPress(c.id)}
          />
        ))}
      </ScrollView>

      {/* Results / Home content */}
      {showingResults ? (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>
            {searching ? 'Searching…' : `${results.length} Results`}
          </Text>
          {searching ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ padding: Spacing.md, gap: 8 }}
              renderItem={({ item }) => <MedRow med={item} onPress={() => openDetail(item)} />}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No medicines found. Try a different search.</Text>
              }
            />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.lg }}>
          {/* Popular medicines */}
          <View>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Popular Medicines</Text>
              <Pressable>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            <View style={{ gap: 8 }}>
              {popular.map((m) => (
                <MedRow key={m.id} med={m} onPress={() => openDetail(m)} />
              ))}
            </View>
          </View>

          {/* Recently Viewed */}
          {recent.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
              <View style={{ gap: 8 }}>
                {recent.map((m) => (
                  <MedRow key={m.id} med={m} onPress={() => openDetail(m)} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Detail Sheet */}
      <MedDetailSheet
        medicine={selectedMed}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: Colors.textMuted },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: 6,
  },
  searchIcon: { paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 10 },

  catScroll: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryIcon: { borderRadius: Radius.pill, padding: 4 },
  categoryLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginHorizontal: Spacing.md, marginTop: 4 },
  viewAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: 40 },

  medRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  medMeta: { fontSize: 12, color: Colors.textMuted },
  prescBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  prescText: { fontSize: 11, fontWeight: '700' },

  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  medIconLg: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sheetSub: { fontSize: 13, color: Colors.textMuted },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },

  detailSection: { marginBottom: Spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  detailBody: { fontSize: 14, color: Colors.text, lineHeight: 20 },
});
