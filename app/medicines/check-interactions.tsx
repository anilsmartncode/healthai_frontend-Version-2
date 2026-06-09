/**
 * app/medicines/check-interactions.tsx
 *
 * Check Interactions — dedicated screen.
 * Follows the interaction checker flow from the design doc:
 *   1. Search & Select medicines (GET /api/medicines/search)
 *   2. Analyze — tap button (POST /api/interactions/check)
 *   3. Results — severity + summary + recommendation
 *   4. View Details — full description, symptoms, recommendations
 *   5. Save interaction report (POST /api/interactions/save)
 *   6. History (GET /api/interactions/history)
 *
 * All data is mock; replace MOCK_* blocks with real API calls.
 * Look for ← plug in your API comments throughout.
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/Colors';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Severity = 'none' | 'low' | 'moderate' | 'high';

interface MedicineSearchResult {
  id: string;
  name: string;
  form: string;
  rx: boolean;
}

interface InteractionResult {
  severity: Severity;
  medicines: string[];
  summary: string;
  recommendation: string;
  description?: string;
  symptoms?: string[];
  recommendations?: string[];
}

interface HistoryItem {
  id: string;
  medicines: string[];
  severity: Severity;
  date: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// ← plug in your API: GET /api/medicines/search?q=...
const MOCK_SEARCH_RESULTS: MedicineSearchResult[] = [
  { id: 'm1', name: 'Metformin 500mg',    form: 'Tablet', rx: true  },
  { id: 'm2', name: 'Metformin 850mg',    form: 'Tablet', rx: true  },
  { id: 'm3', name: 'Metoprolol 25mg',    form: 'Tablet', rx: true  },
  { id: 'm4', name: 'Methotrexate 2.5mg', form: 'Tablet', rx: true  },
  { id: 'm5', name: 'Aspirin 75mg',       form: 'Tablet', rx: false },
  { id: 'm6', name: 'Aspirin 150mg',      form: 'Tablet', rx: false },
  { id: 'm7', name: 'Ibuprofen 400mg',    form: 'Tablet', rx: false },
  { id: 'm8', name: 'Paracetamol 500mg',  form: 'Tablet', rx: false },
  { id: 'm9', name: 'Amoxicillin 500mg',  form: 'Capsule',rx: true  },
];

// ← plug in your API: POST /api/interactions/check
const MOCK_CHECK = (drugs: string[]): InteractionResult => ({
  severity: 'moderate',
  medicines: drugs,
  summary: `${drugs[0]} may increase the risk of stomach irritation when combined with ${drugs[1]}.`,
  recommendation: 'Use with caution and take after food. Consult your doctor.',
  description:
    'Taking these medicines together may increase the risk of gastrointestinal discomfort. Aspirin can irritate the stomach lining, and combining it with other medications may amplify this effect.',
  symptoms: ['Stomach pain', 'Acid reflux', 'Nausea'],
  recommendations: [
    'Take after food',
    'Drink plenty of water',
    'Consult doctor if symptoms persist',
  ],
});

// ← plug in your API: GET /api/interactions/history
const MOCK_HISTORY: HistoryItem[] = [
  { id: 'h1', medicines: ['Metformin 500mg', 'Aspirin 75mg'],     severity: 'moderate', date: '02 Jun 2026, 10:30 AM' },
  { id: 'h2', medicines: ['Paracetamol 500mg', 'Ibuprofen 400mg'],severity: 'low',      date: '30 May 2026, 07:45 PM' },
  { id: 'h3', medicines: ['Amoxicillin 500mg'],                   severity: 'high',     date: '28 May 2026, 08:20 AM' },
];

// ─── SEVERITY CONFIG ──────────────────────────────────────────────────────────
const SEV: Record<Severity, { label: string; color: string; bg: string; icon: string }> = {
  none:     { label: 'No Interaction',        color: '#16A34A', bg: '#F0FDF4', icon: 'checkmark-circle' },
  low:      { label: 'Low Interaction',       color: '#2563EB', bg: '#EFF6FF', icon: 'information-circle' },
  moderate: { label: 'Moderate Interaction',  color: '#EA580C', bg: '#FFF7ED', icon: 'warning' },
  high:     { label: 'High Interaction',      color: '#DC2626', bg: '#FEF2F2', icon: 'alert-circle' },
};

// ─── VIEWS ───────────────────────────────────────────────────────────────────
type View = 'checker' | 'result' | 'details' | 'saved' | 'history';

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CheckInteractionsScreen() {
  const [currentView, setCurrentView] = useState<View>('checker');
  const [selectedMedicines, setSelectedMedicines] = useState<MedicineSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);

  // Filter search results based on query
  // ← plug in your API: replace with real search debounce + API call
  const filteredResults = MOCK_SEARCH_RESULTS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedMedicines.find((s) => s.id === m.id),
  );

  const handleSelectMedicine = (med: MedicineSearchResult) => {
    setSelectedMedicines((prev) => [...prev, med]);
    setSearchQuery('');
    setSearchVisible(false);
  };

  const handleRemoveMedicine = (id: string) => {
    setSelectedMedicines((prev) => prev.filter((m) => m.id !== id));
    setResult(null);
    if (currentView !== 'checker') setCurrentView('checker');
  };

  const handleAnalyze = async () => {
    if (selectedMedicines.length < 2) return;
    setIsChecking(true);
    setCurrentView('checker');

    // ← plug in your API: POST /api/interactions/check { medicine_ids: selectedMedicines.map(m => m.id) }
    await new Promise((r) => setTimeout(r, 1500));
    const res = MOCK_CHECK(selectedMedicines.map((m) => m.name));
    setResult(res);
    setIsChecking(false);
    setCurrentView('result');
  };

  const handleSave = async () => {
    // ← plug in your API: POST /api/interactions/save { medicine_ids: [...] }
    await new Promise((r) => setTimeout(r, 400));
    setCurrentView('saved');
  };

  const handleClear = () => {
    setSelectedMedicines([]);
    setResult(null);
    setCurrentView('checker');
  };

  // ── Render: Saved confirmation ──
  if (currentView === 'saved') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header title="Check Interactions" onBack={() => router.back()} onHistory={() => setHistoryVisible(true)} />
        <View style={styles.centeredView}>
          <View style={styles.savedCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.savedTitle}>Interaction Report Saved!</Text>
          <Text style={styles.savedSub}>You can view it anytime in Interaction History.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => setHistoryVisible(true)}>
            <Text style={styles.primaryBtnText}>View History</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={handleClear}>
            <Text style={styles.ghostBtnText}>Check Another</Text>
          </Pressable>
        </View>
        <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} />
      </SafeAreaView>
    );
  }

  // ── Render: Result Details (full screen) ──
  if (currentView === 'details' && result) {
    const sev = SEV[result.severity];
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header title="Interaction Details" onBack={() => setCurrentView('result')} onHistory={() => setHistoryVisible(true)} />
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          {/* Severity badge */}
          <View style={[styles.detailSevRow, { backgroundColor: sev.bg }]}>
            <Ionicons name={sev.icon as any} size={20} color={sev.color} />
            <Text style={[styles.detailSevText, { color: sev.color }]}>{sev.label}</Text>
          </View>

          {/* Description */}
          <View style={styles.detailBlock}>
            <Text style={styles.detailBlockTitle}>Description</Text>
            <Text style={styles.detailBlockBody}>{result.description}</Text>
          </View>

          {/* Possible Symptoms */}
          {result.symptoms && result.symptoms.length > 0 && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailBlockTitle}>Possible Symptoms</Text>
              {result.symptoms.map((s, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: sev.color }]} />
                  <Text style={styles.bulletText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailBlockTitle}>Recommendations</Text>
              {result.recommendations.map((r, i) => (
                <View key={i} style={styles.checkRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.bulletText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable style={styles.primaryBtn} onPress={handleSave}>
              <Ionicons name="bookmark-outline" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Save This Check</Text>
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>
            ⚠ Always consult your healthcare provider before making changes to your medication.
          </Text>
        </ScrollView>
        <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} />
      </SafeAreaView>
    );
  }

  // ── Render: Result screen ──
  if (currentView === 'result' && result) {
    const sev = SEV[result.severity];
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header title="Interaction Result" onBack={() => setCurrentView('checker')} onHistory={() => setHistoryVisible(true)} />
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          {/* Result card */}
          <View style={[styles.resultCard, { backgroundColor: sev.bg, borderColor: sev.color + '40' }]}>
            <View style={styles.resultTopRow}>
              <View style={[styles.resultIconCircle, { backgroundColor: sev.color + '20' }]}>
                <Ionicons name={sev.icon as any} size={32} color={sev.color} />
              </View>
              <Text style={[styles.resultSevLabel, { color: sev.color }]}>{sev.label} Found</Text>
            </View>

            <Text style={styles.resultMeds}>{result.medicines.join(' + ')}</Text>

            <View style={styles.resultSummaryBlock}>
              <Text style={styles.resultSummaryTitle}>Summary</Text>
              <Text style={styles.resultSummaryText}>{result.summary}</Text>
            </View>

            <View style={styles.resultRecoBlock}>
              <Text style={styles.resultSummaryTitle}>Recommendation</Text>
              <Text style={styles.resultSummaryText}>{result.recommendation}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.resultActions}>
            <Pressable style={[styles.outlineBtn, { flex: 1 }]} onPress={() => setCurrentView('details')}>
              <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
              <Text style={styles.outlineBtnText}>View Details</Text>
            </Pressable>
            <Pressable style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSave}>
              <Ionicons name="bookmark-outline" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Save This Check</Text>
            </Pressable>
          </View>

          <Text style={styles.disclaimer}>
            ⚠ Always consult your healthcare provider before making changes to your medication.
          </Text>
        </ScrollView>
        <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} />
      </SafeAreaView>
    );
  }

  // ── Render: Main checker ──
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header
        title="Check Interactions"
        onBack={() => router.back()}
        onHistory={() => setHistoryVisible(true)}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instructions */}
          <Text style={styles.instructionText}>
            Add 2 or more medicines to check for drug interactions.
          </Text>

          {/* Selected medicines chips */}
          {selectedMedicines.length > 0 && (
            <View style={styles.chipsSection}>
              <Text style={styles.chipsSectionLabel}>Selected Medicines ({selectedMedicines.length})</Text>
              {selectedMedicines.map((med) => (
                <View key={med.id} style={styles.selectedChip}>
                  <Ionicons name="medical-outline" size={16} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedChipName}>{med.name}</Text>
                    <Text style={styles.selectedChipForm}>{med.form}</Text>
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => handleRemoveMedicine(med.id)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="close" size={16} color="#64748B" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Search input */}
          <View style={styles.searchSection}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search medicine…"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  setSearchVisible(t.length > 0);
                }}
                onFocus={() => setSearchVisible(searchQuery.length > 0)}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => { setSearchQuery(''); setSearchVisible(false); }}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            {/* Dropdown results */}
            {searchVisible && filteredResults.length > 0 && (
              <View style={styles.dropdown}>
                {filteredResults.slice(0, 6).map((m) => (
                  <Pressable
                    key={m.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectMedicine(m)}
                  >
                    <Ionicons name="medical-outline" size={15} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownName}>{m.name}</Text>
                      <Text style={styles.dropdownForm}>{m.form}</Text>
                    </View>
                    {m.rx && (
                      <View style={styles.rxBadge}>
                        <Text style={styles.rxText}>Rx</Text>
                      </View>
                    )}
                    <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                  </Pressable>
                ))}
              </View>
            )}

            {searchVisible && filteredResults.length === 0 && searchQuery.length > 0 && (
              <View style={[styles.dropdown, { padding: 16, alignItems: 'center' }]}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>No medicine found</Text>
              </View>
            )}
          </View>

          {/* Add another medicine hint */}
          {selectedMedicines.length > 0 && !searchVisible && (
            <Pressable
              style={styles.addAnotherRow}
              onPress={() => setSearchVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addAnotherText}>Add Another Medicine</Text>
            </Pressable>
          )}

          {/* Analyze button */}
          <Pressable
            style={[
              styles.analyzeBtn,
              selectedMedicines.length < 2 && styles.analyzeBtnDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={selectedMedicines.length < 2 || isChecking}
          >
            {isChecking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
            )}
            <Text style={styles.analyzeBtnText}>
              {isChecking ? 'Analyzing…' : 'Analyze Interactions'}
            </Text>
          </Pressable>

          {selectedMedicines.length < 2 && (
            <Text style={styles.needMoreText}>
              Add at least 2 medicines to check interactions
            </Text>
          )}

          {/* Severity legend */}
          <View style={styles.legendSection}>
            <Text style={styles.legendTitle}>Severity Levels</Text>
            <View style={styles.legendRow}>
              {(Object.entries(SEV) as [Severity, typeof SEV[Severity]][]).map(([key, val]) => (
                <View key={key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: val.color }]} />
                  <Text style={styles.legendLabel}>{val.label.split(' ')[0]}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} />
    </SafeAreaView>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({
  title,
  onBack,
  onHistory,
}: {
  title: string;
  onBack: () => void;
  onHistory: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.headerBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color="#0F172A" />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <Pressable onPress={onHistory} style={styles.headerHistoryBtn} hitSlop={8}>
        <Ionicons name="time-outline" size={22} color="#64748B" />
      </Pressable>
    </View>
  );
}

// ─── HISTORY MODAL ────────────────────────────────────────────────────────────
function HistoryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Interaction History</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color="#64748B" />
          </Pressable>
        </View>

        <FlatList
          data={MOCK_HISTORY}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const sev = SEV[item.severity];
            return (
              <Pressable
                style={styles.historyItem}
                onPress={() => Alert.alert('History', `View detail for ${item.medicines.join(' + ')}`)}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.historyMeds} numberOfLines={1}>
                    {item.medicines.join(' + ')}
                  </Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
                <View style={[styles.sevChip, { backgroundColor: sev.bg }]}>
                  <Text style={[styles.sevChipText, { color: sev.color }]}>
                    {sev.label.split(' ')[0]}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
              <Ionicons name="time-outline" size={36} color="#CBD5E1" />
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>No history yet</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  headerBack: {
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
  headerHistoryBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollPad: {
    padding: 16,
    gap: 16,
  },

  instructionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
  },

  // Chips
  chipsSection: {
    gap: 8,
  },
  chipsSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    padding: 12,
  },
  selectedChipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  selectedChipForm: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchSection: {
    position: 'relative',
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.primary + '50',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownForm: {
    fontSize: 12,
    color: '#94A3B8',
  },
  rxBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rxText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
  },

  // Add another
  addAnotherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: Colors.primary + '05',
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Analyze button
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
  },
  analyzeBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  analyzeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  needMoreText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: -8,
  },

  // Legend
  legendSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Result
  resultCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
  },
  resultTopRow: {
    alignItems: 'center',
    gap: 12,
  },
  resultIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultSevLabel: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultMeds: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  resultSummaryBlock: {
    gap: 4,
  },
  resultRecoBlock: {
    gap: 4,
  },
  resultSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultSummaryText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  outlineBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 14,
  },
  ghostBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },

  actionRow: {
    gap: 10,
  },
  disclaimer: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Detail screen
  detailSevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailSevText: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 8,
  },
  detailBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailBlockBody: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
    lineHeight: 21,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  // Saved
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  savedCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  savedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  savedSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },

  // History modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  historyMeds: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  historyDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sevChip: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sevChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
