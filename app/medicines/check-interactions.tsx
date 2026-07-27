/**
 * app/medicines/check-interactions.tsx
 *
 * Check Interactions — real API integration, zero mocks.
 *
 * APIs used (all from medicineTabApi):
 *   searchMedicines(q)                     GET /api/medicines/search
 *   checkInteractions(medicineIds[])        POST /api/interactions/check
 *   getInteractionDetails(interactionId)    GET /api/interactions/:id
 *   saveInteractionReport(medicineIds[])    POST /api/interactions/save
 *   getInteractionHistory()                 GET /api/interactions/history
 */

import { useState, useRef, useCallback, useEffect } from 'react';
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
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { AskAIButton } from '@/components/ai/AskAIButton';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { LanguageSelectModal } from '@/components/ui/LanguageSelectModal';
import {
  searchMedicines,
  checkInteractions,
  getInteractionDetails,
  saveInteractionReport,
  getInteractionHistory,
  type Medicine,
  type InteractionResult,
  type InteractionHistoryItem,
} from '@/services/medicineTabApi';

// ─── SEVERITY CONFIG ──────────────────────────────────────────────────────────
type Severity = 'none' | 'low' | 'moderate' | 'high';

const SEV: Record<Severity, { label: string; color: string; bg: string; icon: string }> = {
  none:     { label: 'No Interaction',       color: '#16A34A', bg: '#F0FDF4', icon: 'checkmark-circle'  },
  low:      { label: 'Low Interaction',      color: '#2563EB', bg: '#EFF6FF', icon: 'information-circle' },
  moderate: { label: 'Moderate Interaction', color: '#EA580C', bg: '#FFF7ED', icon: 'warning'            },
  high:     { label: 'High Interaction',     color: '#DC2626', bg: '#FEF2F2', icon: 'alert-circle'       },
};

type ScreenView = 'checker' | 'result' | 'details' | 'saved' | 'history';

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ title, onBack, onHistory }: { title: string; onBack: () => void; onHistory: () => void }) {
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
function HistoryModal({
  visible,
  onClose,
  onSelectItem,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectItem: (item: InteractionHistoryItem) => void;
}) {
  const [items, setItems]           = useState<InteractionHistoryItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    console.log('[CheckInteractions] getInteractionHistory REQUEST', { isRefresh });
    isRefresh ? setRefreshing(true) : setLoading(true);
    const t0 = Date.now();
    try {
      const data = await getInteractionHistory();
      console.log('[CheckInteractions] getInteractionHistory RESPONSE', { count: data.length, ms: Date.now() - t0 });
      setItems(data);
    } catch (e: any) {
      console.error('[CheckInteractions] getInteractionHistory ERROR', e?.message ?? e);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  // Always re-fetch when modal opens
  const handleOpen = useCallback(() => { fetchHistory(false); }, [fetchHistory]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Interaction History</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color="#64748B" />
          </Pressable>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.interactionId || String(Math.random())}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} colors={[Colors.primary]} tintColor={Colors.primary} />
            }
            renderItem={({ item }) => {
              const sev = SEV[(item.severity as Severity) ?? 'none'];
              const medNames = item.medicines ?? [];
              const dateStr  = item.checkedAt
                ? new Date(item.checkedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <Pressable
                  style={styles.historyItem}
                  onPress={() => { onClose(); onSelectItem(item); }}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.historyMeds} numberOfLines={1}>
                      {medNames.join(' + ')}
                    </Text>
                    <Text style={styles.historyDate}>{dateStr}</Text>
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
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CheckInteractionsScreen() {
  const [currentView,        setCurrentView]        = useState<ScreenView>('checker');
  const [selectedMedicines,  setSelectedMedicines]  = useState<Medicine[]>([]);
  const [searchQuery,        setSearchQuery]        = useState('');
  const [searchResults,      setSearchResults]      = useState<Medicine[]>([]);
  const [searchLoading,      setSearchLoading]      = useState(false);
  const [searchVisible,      setSearchVisible]      = useState(false);
  const [isChecking,         setIsChecking]         = useState(false);
  const [isSaving,           setIsSaving]           = useState(false);
  const [result,             setResult]             = useState<InteractionResult | null>(null);
  const [detail,             setDetail]             = useState<InteractionResult | null>(null);
  const [detailLoading,      setDetailLoading]      = useState(false);
  const [historyVisible,     setHistoryVisible]     = useState(false);

  const [langModalOpen, setLangModalOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [translatedReco, setTranslatedReco] = useState<string | null>(null);

  // Clear translations when starting a new query
  useEffect(() => {
    setTranslatedSummary(null);
    setTranslatedReco(null);
  }, [result]);

  const handleTranslate = async (langCode: string, langName: string) => {
    if (!result) return;
    setTranslating(true);
    try {
      if (result.summary) {
        const res1 = await api.request<any>(ENDPOINTS.translateTextPath, {
          method: 'POST',
          body: JSON.stringify({
            text: result.summary,
            language: langCode,
          }),
        });
        setTranslatedSummary(res1?.translate_text ?? res1?.translated_text ?? result.summary);
      }
      if (result.recommendation) {
        const res2 = await api.request<any>(ENDPOINTS.translateTextPath, {
          method: 'POST',
          body: JSON.stringify({
            text: result.recommendation,
            language: langCode,
          }),
        });
        setTranslatedReco(res2?.translate_text ?? res2?.translated_text ?? result.recommendation);
      }
      Alert.alert('Success', `Translated details into ${langName}!`);
    } catch (err) {
      console.warn('[Translation] Interaction screen translation failed:', err);
      Alert.alert('Translation Error', 'Failed to translate details.');
    } finally {
      setTranslating(false);
    }
  };

  const params = useLocalSearchParams<{ medicineId?: string; medicineName?: string }>();

  // Pre-fill from params
  useEffect(() => {
    if (params.medicineId && params.medicineName) {
      setSelectedMedicines((prev) => {
        if (prev.find((m) => m.id === params.medicineId)) return prev;
        return [
          ...prev,
          {
            id: params.medicineId!,
            name: params.medicineName!,
            type: 'Tablet',
            category: '',
            uses: '',
            dosage: '',
            sideEffects: [],
            prescriptionType: 'OTC',
          },
        ];
      });
    }
  }, [params.medicineId, params.medicineName]);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search (debounced, real API) ─────────────────────────────────────────
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 2) {
      setSearchResults([]);
      setSearchVisible(false);
      return;
    }
    setSearchLoading(true);
    setSearchVisible(true);
    searchTimeout.current = setTimeout(async () => {
      console.log('[CheckInteractions] searchMedicines REQUEST', { query: text.trim() });
      const t0 = Date.now();
      try {
        const meds = await searchMedicines(text.trim());
        const filtered = meds.filter((m) => !selectedMedicines.find((s) => s.id === m.id));
        console.log('[CheckInteractions] searchMedicines RESPONSE', { total: meds.length, afterFilter: filtered.length, ms: Date.now() - t0 });
        setSearchResults(filtered);
      } catch (e: any) {
        console.error('[CheckInteractions] searchMedicines ERROR', e?.message ?? e);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSelectMedicine = (med: Medicine) => {
    console.log('[CheckInteractions] medicine selected', { id: med.id, name: med.name });
    setSelectedMedicines((prev) => [...prev, med]);
    setSearchQuery('');
    setSearchResults([]);
    setSearchVisible(false);
    setResult(null);
  };

  const handleRemoveMedicine = (id: string) => {
    const removed = selectedMedicines.find((m) => m.id === id);
    console.log('[CheckInteractions] medicine removed', { id, name: removed?.name });
    setSelectedMedicines((prev) => prev.filter((m) => m.id !== id));
    setResult(null);
    if (currentView !== 'checker') setCurrentView('checker');
  };

  // ── Analyze (real API) ───────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (selectedMedicines.length < 2) return;
    const ids   = selectedMedicines.map((m) => m.id);
    const names = selectedMedicines.map((m) => m.name);
    console.log('[CheckInteractions] checkInteractions REQUEST', { medicineIds: ids, medicineNames: names });
    setIsChecking(true);
    const t0 = Date.now();
    try {
      const res = await checkInteractions(ids);
      console.log('[CheckInteractions] checkInteractions RESPONSE', {
        interactionId: res.interactionId,
        severity: res.severity,
        medicineCount: res.medicines?.length,
        ms: Date.now() - t0,
      });
      setResult(res);
      setCurrentView('result');
    } catch (e: any) {
      console.error('[CheckInteractions] checkInteractions ERROR', e?.message ?? e);
      Alert.alert('Error', e?.message ?? 'Failed to check interactions. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  // ── View Details (real API — GET /api/interactions/:id) ──────────────────
  const handleViewDetails = async () => {
    if (!result?.interactionId) {
      console.log('[CheckInteractions] getInteractionDetails skipped (no interactionId) — using in-memory result');
      setDetail(result);
      setCurrentView('details');
      return;
    }
    console.log('[CheckInteractions] getInteractionDetails REQUEST', { interactionId: result.interactionId });
    setDetailLoading(true);
    const t0 = Date.now();
    try {
      const full = await getInteractionDetails(result.interactionId);
      console.log('[CheckInteractions] getInteractionDetails RESPONSE', { found: !!full, severity: full?.severity, ms: Date.now() - t0 });
      setDetail(full ?? result);
    } catch (e: any) {
      console.error('[CheckInteractions] getInteractionDetails ERROR', e?.message ?? e);
      setDetail(result);
    } finally {
      setDetailLoading(false);
      setCurrentView('details');
    }
  };

  // ── Save (real API) ──────────────────────────────────────────────────────
  const handleSave = async () => {
    let ids = selectedMedicines.map((m) => String(m.id));
    
    // If no medicines are selected (e.g. loaded from history), try to get them from the result object
    if (ids.length === 0) {
      const sourceMeds = detail?.medicines || result?.medicines || [];
      ids = sourceMeds.map((m: any) => String(m.id ?? m)); // handles both object array and string array
    }

    const interactionId = detail?.interactionId || result?.interactionId || '';

    if (ids.length === 0 && !interactionId) {
      Alert.alert('Error', 'No check available to save.');
      return;
    }

    console.log('[CheckInteractions] saveInteractionReport REQUEST', { medicineIds: ids, interactionId });
    setIsSaving(true);
    const t0 = Date.now();
    try {
      const res = await saveInteractionReport(ids, interactionId);
      console.log('[CheckInteractions] saveInteractionReport RESPONSE', { ...res, ms: Date.now() - t0 });
      setCurrentView('saved');
    } catch (e: any) {
      console.error('[CheckInteractions] saveInteractionReport ERROR', e?.message ?? e);
      Alert.alert('Error', e?.message ?? 'Could not save report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Load history item detail ─────────────────────────────────────────────
  const handleSelectHistoryItem = async (item: InteractionHistoryItem) => {
    console.log('[CheckInteractions] history item selected', { interactionId: item.interactionId, medicines: item.medicines, severity: item.severity });
    setIsChecking(true);

    // Only call API if we have a real ID
    if (item.interactionId && item.interactionId !== 'undefined' && item.interactionId !== '') {
      const t0 = Date.now();
      try {
        console.log('[CheckInteractions] getInteractionDetails REQUEST (from history)', { interactionId: item.interactionId });
        const full = await getInteractionDetails(item.interactionId);
        console.log('[CheckInteractions] getInteractionDetails RESPONSE (from history)', { found: !!full, severity: full?.severity, ms: Date.now() - t0 });
        if (full) {
          setResult(full);
          setCurrentView('result');
          setIsChecking(false);
          return;
        }
      } catch (e: any) {
        console.warn('[CheckInteractions] getInteractionDetails FALLBACK', e?.message ?? e);
      }
    } else {
      console.warn('[CheckInteractions] interactionId missing — skipping API call, using fallback');
    }
    setResult({
      interactionId: item.interactionId,
      medicines: (item.medicines ?? []).map((name, i) => ({ id: String(i), name, type: 'Tablet' })),
      severity: (item.severity as Severity) ?? 'none',
      summary: `Previous check for ${(item.medicines ?? []).join(' + ')}`,
      recommendation: 'Refer to the original interaction check for full details.',
      symptoms: [],
      checkedAt: item.checkedAt,
    } as InteractionResult);
    setCurrentView('result');
    setIsChecking(false);
  };

  const handleClear = () => {
    setSelectedMedicines([]);
    setResult(null);
    setDetail(null);
    setCurrentView('checker');
  };

  // ── Saved confirmation ───────────────────────────────────────────────────
  if (currentView === 'saved') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header title="Check Interactions" onBack={() => router.back()} onHistory={() => setHistoryVisible(true)} />
        <View style={styles.centeredView}>
          <View style={styles.savedCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          
          <View style={{ gap: 6, marginBottom: 24, marginTop: 8 }}>
            <Text style={styles.savedTitle}>Interaction Report Saved!</Text>
            <Text style={styles.savedSub}>You can view it anytime in your Interaction History.</Text>
          </View>

          <View style={{ width: '100%', gap: 14 }}>
            <Pressable style={[styles.primaryBtn, { width: '100%' }]} onPress={() => setHistoryVisible(true)}>
              <Text style={styles.primaryBtnText}>View History</Text>
            </Pressable>
            <Pressable style={[styles.ghostBtn, { width: '100%' }]} onPress={handleClear}>
              <Text style={styles.ghostBtnText}>Check Another</Text>
            </Pressable>
          </View>
        </View>
        <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} onSelectItem={handleSelectHistoryItem} />
      </SafeAreaView>
    );
  }

  // ── Full Details screen ──────────────────────────────────────────────────
  if (currentView === 'details' && (detail || result)) {
    const d   = detail ?? result!;
    const sev = SEV[(d.severity as Severity) ?? 'none'];
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header title="Interaction Details" onBack={() => setCurrentView('result')} onHistory={() => setHistoryVisible(true)} />
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={[styles.detailSevRow, { backgroundColor: sev.bg }]}>
            <Ionicons name={sev.icon as any} size={20} color={sev.color} />
            <Text style={[styles.detailSevText, { color: sev.color }]}>{sev.label}</Text>
          </View>

          {d.summary ? (
            <View style={styles.detailBlock}>
              <Text style={styles.detailBlockTitle}>Summary</Text>
              <Text style={styles.detailBlockBody}>{d.summary}</Text>
            </View>
          ) : null}

          {d.description ? (
            <View style={styles.detailBlock}>
              <Text style={styles.detailBlockTitle}>Description</Text>
              <Text style={styles.detailBlockBody}>{d.description}</Text>
            </View>
          ) : null}

          {d.recommendation ? (
            <View style={styles.detailBlock}>
              <Text style={styles.detailBlockTitle}>Recommendations</Text>
              <Text style={styles.detailBlockBody}>{d.recommendation}</Text>
            </View>
          ) : null}

          {(d.symptoms?.length ?? 0) > 0 && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailBlockTitle}>Possible Symptoms</Text>
              {d.symptoms!.map((s: string, i: number) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: sev.color }]} />
                  <Text style={styles.bulletText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {d.aiSummary ? (
            <View style={[styles.detailBlock, { borderColor: Colors.primary + '40', borderWidth: 1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
                <Text style={[styles.detailBlockTitle, { color: Colors.primary }]}>AI Summary</Text>
              </View>
              <Text style={styles.detailBlockBody}>{d.aiSummary}</Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.primaryBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Ionicons name="bookmark-outline" size={16} color="#fff" /><Text style={styles.primaryBtnText}>Save This Check</Text></>
              }
            </Pressable>
          </View>

          <AskAIButton
            variant="banner"
            label="Ask AI about these interactions"
            prefill={`My medicines have ${d.severity ?? 'some'} interactions. Can you explain what I should watch for and whether I need to talk to my doctor?`}
          />
          <Text style={styles.disclaimer}>
            ⚠ Always consult your healthcare provider before making changes to your medication.
          </Text>
        </ScrollView>
        <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} onSelectItem={handleSelectHistoryItem} />
      </SafeAreaView>
    );
  }

  // ── Result screen ────────────────────────────────────────────────────────
  if (currentView === 'result' && result) {
    const sev      = SEV[(result.severity as Severity) ?? 'none'];
    const medNames = (result.medicines ?? []).map((m: any) => (typeof m === 'string' ? m : m.name));
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header title="Interaction Result" onBack={() => setCurrentView('checker')} onHistory={() => setHistoryVisible(true)} />
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={[styles.resultCard, { backgroundColor: sev.bg, borderColor: sev.color + '40' }]}>
            <View style={styles.resultTopRow}>
              <View style={[styles.resultIconCircle, { backgroundColor: sev.color + '20' }]}>
                <Ionicons name={sev.icon as any} size={32} color={sev.color} />
              </View>
              <Text style={[styles.resultSevLabel, { color: sev.color, flex: 1 }]}>{sev.label} Found</Text>

              <Pressable 
                onPress={() => setLangModalOpen(true)}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: sev.color + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: sev.color + '30' }}
                disabled={translating}
              >
                {translating ? (
                  <ActivityIndicator size="small" color={sev.color} style={{ transform: [{ scale: 0.8 }] }} />
                ) : (
                  <Ionicons name="language" size={14} color={sev.color} />
                )}
                <Text style={{ fontSize: 11, fontWeight: '700', color: sev.color }}>
                  {translating ? 'Translating...' : 'Translate'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.resultMeds}>{medNames.join(' + ')}</Text>

            {(translatedSummary ?? result.summary) ? (
              <View style={styles.resultSummaryBlock}>
                <Text style={styles.resultSummaryTitle}>Summary</Text>
                <Text style={styles.resultSummaryText}>{translatedSummary ?? result.summary}</Text>
              </View>
            ) : null}

            {(translatedReco ?? result.recommendation) ? (
              <View style={styles.resultRecoBlock}>
                <Text style={styles.resultSummaryTitle}>Recommendation</Text>
                <Text style={styles.resultSummaryText}>{translatedReco ?? result.recommendation}</Text>
              </View>
            ) : null}
          </View>

          <LanguageSelectModal
            visible={langModalOpen}
            onClose={() => setLangModalOpen(false)}
            onSelect={handleTranslate}
          />

          <View style={styles.resultActions}>
            <Pressable
              style={[styles.outlineBtn, { flex: 1 }, detailLoading && { opacity: 0.6 }]}
              onPress={handleViewDetails}
              disabled={detailLoading}
            >
              {detailLoading
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <><Ionicons name="document-text-outline" size={16} color={Colors.primary} /><Text style={styles.outlineBtnText}>View Details</Text></>
              }
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, { flex: 1 }, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Ionicons name="bookmark-outline" size={16} color="#fff" /><Text style={styles.primaryBtnText}>Save This Check</Text></>
              }
            </Pressable>
          </View>

          <AskAIButton
            variant="banner"
            label="Ask AI about these interactions"
            prefill={`My medicines have ${result.severity ?? 'some'} interactions. Can you explain what I should watch for and whether I need to talk to my doctor?`}
          />
          <Text style={styles.disclaimer}>
            ⚠ Always consult your healthcare provider before making changes to your medication.
          </Text>
        </ScrollView>
        <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} onSelectItem={handleSelectHistoryItem} />
      </SafeAreaView>
    );
  }

  // ── Main checker ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Check Interactions" onBack={() => router.back()} onHistory={() => setHistoryVisible(true)} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Text style={styles.instructionText}>
            Add 2 or more medicines to check for drug interactions.
          </Text>

          {/* Selected medicines */}
          {selectedMedicines.length > 0 && (
            <View style={styles.chipsSection}>
              <Text style={styles.chipsSectionLabel}>Selected Medicines ({selectedMedicines.length})</Text>
              {selectedMedicines.map((med) => (
                <View key={med.id} style={styles.selectedChip}>
                  <Ionicons name="medical-outline" size={16} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedChipName}>{med.name}</Text>
                    <Text style={styles.selectedChipForm}>{med.type}</Text>
                  </View>
                  <Pressable hitSlop={8} onPress={() => handleRemoveMedicine(med.id)} style={styles.removeBtn}>
                    <Ionicons name="close" size={16} color="#64748B" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Search */}
          <View style={styles.searchSection}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search medicine…"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
              {searchLoading && <ActivityIndicator size="small" color={Colors.primary} />}
              {!searchLoading && searchQuery.length > 0 && (
                <Pressable onPress={() => { setSearchQuery(''); setSearchResults([]); setSearchVisible(false); }}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            {searchVisible && searchResults.length > 0 && (
              <View style={styles.dropdown}>
                {searchResults.slice(0, 6).map((m) => (
                  <Pressable key={m.id} style={styles.dropdownItem} onPress={() => handleSelectMedicine(m)}>
                    <Ionicons name="medical-outline" size={15} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownName}>{m.name}</Text>
                      <Text style={styles.dropdownForm}>{m.type}</Text>
                    </View>
                    {m.prescriptionType === 'Prescription' && (
                      <View style={styles.rxBadge}><Text style={styles.rxText}>Rx</Text></View>
                    )}
                    <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                  </Pressable>
                ))}
              </View>
            )}

            {searchVisible && !searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
              <View style={[styles.dropdown, { padding: 16, alignItems: 'center' }]}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>No medicine found</Text>
              </View>
            )}
          </View>

          {/* Add another hint */}
          {selectedMedicines.length > 0 && !searchVisible && (
            <Pressable style={styles.addAnotherRow} onPress={() => {}}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addAnotherText}>Add Another Medicine</Text>
            </Pressable>
          )}

          {/* Analyze button */}
          <Pressable
            style={[styles.analyzeBtn, (selectedMedicines.length < 2 || isChecking) && styles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={selectedMedicines.length < 2 || isChecking}
          >
            {isChecking
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
            }
            <Text style={styles.analyzeBtnText}>
              {isChecking ? 'Analyzing…' : 'Analyze Interactions'}
            </Text>
          </Pressable>

          {selectedMedicines.length < 2 && (
            <Text style={styles.needMoreText}>Add at least 2 medicines to check interactions</Text>
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

      <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} onSelectItem={handleSelectHistoryItem} />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  headerBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F1F5F9' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#0F172A', marginHorizontal: 8 },
  headerHistoryBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scrollPad: { padding: 16, gap: 16 },
  instructionText: { fontSize: 14, color: '#64748B', lineHeight: 21 },

  chipsSection: { gap: 8 },
  chipsSectionLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary + '40', padding: 12 },
  selectedChipName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  selectedChipForm: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  searchSection: { position: 'relative', zIndex: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primary + '50', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },

  dropdown: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#F1F5F9' },
  dropdownName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  dropdownForm: { fontSize: 12, color: '#94A3B8' },
  rxBadge: { backgroundColor: '#FEE2E2', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  rxText: { fontSize: 10, fontWeight: '700', color: '#B91C1C' },

  addAnotherRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.primary + '40', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, backgroundColor: Colors.primary + '05' },
  addAnotherText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15 },
  analyzeBtnDisabled: { backgroundColor: '#CBD5E1' },
  analyzeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  needMoreText: { textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: -8 },

  legendSection: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14, gap: 10, marginTop: 4 },
  legendTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  resultCard: { borderRadius: 16, borderWidth: 1.5, padding: 18, gap: 14 },
  resultTopRow: { alignItems: 'center', gap: 12 },
  resultIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  resultSevLabel: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  resultMeds: { fontSize: 14, color: '#64748B', textAlign: 'center', fontWeight: '500' },
  resultSummaryBlock: { gap: 4 },
  resultRecoBlock: { gap: 4 },
  resultSummaryTitle: { fontSize: 12, fontWeight: '700', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultSummaryText: { fontSize: 14, color: '#334155', lineHeight: 21 },
  resultActions: { flexDirection: 'row', gap: 10 },

  primaryBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, 
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 14 },
  outlineBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 14 },
  ghostBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  actionRow: { gap: 10 },
  disclaimer: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', lineHeight: 18 },

  detailSevRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  detailSevText: { fontSize: 15, fontWeight: '700' },
  detailBlock: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14, gap: 8 },
  detailBlockTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailBlockBody: { fontSize: 14, color: '#334155', lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  bulletText: { fontSize: 14, color: '#334155', flex: 1, lineHeight: 21 },

  centeredView: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  savedCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8, elevation: 6, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  savedTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  savedSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21, marginBottom: 8 },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14 },
  historyMeds: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  historyDate: { fontSize: 12, color: '#94A3B8' },
  sevChip: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  sevChipText: { fontSize: 12, fontWeight: '700' },
});
