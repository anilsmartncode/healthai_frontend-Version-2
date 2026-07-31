/**
 * components/medicine/CheckInteraction.tsx
 * Full Medicine Interaction Checker feature:
 *  1. Search & Select medicines
 *  2. Analyze Interactions
 *  3. Results (severity, summary, recommendation)
 *  4. View Details (symptoms, full info)
 *  5. Save report
 *  6. Interaction History
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  searchMedicinesForInteraction,
  checkInteractions,
  getInteractionDetails,
  saveInteractionReport,
  getInteractionHistory,
  deleteInteractionReport,
  getAiInteractionSummary,
} from '@/services/medicineTabApi';
import type {
  Medicine,
  InteractionResult,
  InteractionHistoryItem,
  SeverityLevel,
} from '@/services/medicineTabApi';

// ─── Severity config ──────────────────────────────────────────
const SEVERITY: Record<SeverityLevel, { color: string; bg: string; icon: string; label: string }> = {
  none: { color: Colors.success, bg: Colors.success + '18', icon: 'checkmark-circle-outline', label: 'None – Safe' },
  low: { color: '#16A34A', bg: '#DCFCE7', icon: 'information-circle-outline', label: 'Low – Minor interaction' },
  moderate: { color: '#F59E0B', bg: '#FEF3C7', icon: 'warning-outline', label: 'Moderate – Use with caution' },
  high: { color: Colors.danger, bg: Colors.danger + '18', icon: 'alert-circle-outline', label: 'High – Avoid combination' },
};

// ─── Severity badge ───────────────────────────────────────────
function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  const cfg = SEVERITY[severity];
  return (
    <View style={[styles.severityBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
      <Ionicons name={cfg.icon as any} size={15} color={cfg.color} />
      <Text style={[styles.severityText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Medicine search suggestion row ──────────────────────────
function SuggestionRow({ med, onPress }: { med: Medicine; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.suggRow}>
      <Ionicons name="medkit-outline" size={16} color={Colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.suggName}>{med.name}</Text>
        <Text style={styles.suggMeta}>{med.type}</Text>
      </View>
    </Pressable>
  );
}

// ─── Selected medicine chip ───────────────────────────────────
function SelectedChip({ med, onRemove }: { med: Medicine; onRemove: () => void }) {
  return (
    <View style={styles.chip}>
      <Ionicons name="medical-outline" size={14} color={Colors.primary} />
      <Text style={styles.chipText}>{med.name}</Text>
      <Pressable onPress={onRemove}>
        <Ionicons name="close-circle" size={18} color={Colors.danger} />
      </Pressable>
    </View>
  );
}

// ─── History row ──────────────────────────────────────────────
function HistoryRow({
  item,
  onPress,
  onDelete,
}: {
  item: InteractionHistoryItem;
  onPress: () => void;
  onDelete: () => void;
}) {
  const cfg = SEVERITY[item.severity];
  const date = new Date(item.checkedAt);
  const formatted = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.histRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.histMeds}>{item.medicines.join(' + ')}</Text>
          <Text style={styles.histDate}>{formatted}</Text>
        </View>
        <View style={[styles.histBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.histSeverity, { color: cfg.color }]}>{cfg.label.split(' – ')[0]}</Text>
        </View>
        <Pressable onPress={onDelete} style={{ marginLeft: 8 }}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </Pressable>
      </Card>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
type Step = 'search' | 'analyzing' | 'result' | 'detail' | 'history';

export default function CheckInteraction() {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [selectedMeds, setSelectedMeds] = useState<Medicine[]>([]);
  const [interactionResult, setInteractionResult] = useState<InteractionResult | null>(null);
  const [history, setHistory] = useState<InteractionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Search suggestions
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const results = await searchMedicinesForInteraction(query);
      if (!cancelled) setSuggestions(results.medicines.slice(0, 5));
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  const addMed = (med: Medicine) => {
    if (selectedMeds.find((m) => m.id === med.id)) return;
    if (selectedMeds.length >= 5) { Alert.alert('Max 5 medicines allowed.'); return; }
    setSelectedMeds((prev) => [...prev, med]);
    setQuery('');
    setSuggestions([]);
  };

  const removeMed = (id: string) => setSelectedMeds((prev) => prev.filter((m) => m.id !== id));

  const analyze = async () => {
    if (selectedMeds.length < 2) {
      Alert.alert('Please select at least 2 medicines to check interactions.');
      return;
    }
    setStep('analyzing');
    const result = await checkInteractions(selectedMeds.map((m) => m.id));
    setInteractionResult(result);
    setSaved(false);
    setAiSummary(null);
    setStep('result');
  };

  const handleSave = async () => {
    if (!interactionResult) return;
    setSaving(true);
    await saveInteractionReport(selectedMeds.map((m) => m.id));
    setSaved(true);
    setSaving(false);
  };

  const loadHistory = async () => {
    setStep('history');
    setHistoryLoading(true);
    const hist = await getInteractionHistory();
    setHistory(hist);
    setHistoryLoading(false);
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteInteractionReport(id);
    setHistory((prev) => prev.filter((i) => i.interactionId !== id));
  };

  const loadAiSummary = async () => {
    if (!interactionResult) return;
    setAiLoading(true);
    const { summary } = await getAiInteractionSummary(selectedMeds.map((m) => m.id));
    setAiSummary(summary);
    setAiLoading(false);
  };

  // ── Analyzing ───────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <View style={styles.center}>
        <View style={styles.analyzingCircle}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
        <Text style={styles.analyzingTitle}>Analyzing Interactions…</Text>
        <Text style={styles.analyzingHint}>Checking {selectedMeds.length} medicines against our database</Text>
        <View style={styles.medsTags}>
          {selectedMeds.map((m) => (
            <View key={m.id} style={styles.medTag}>
              <Text style={styles.medTagText}>{m.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── Result ──────────────────────────────────────────────────
  if (step === 'result' && interactionResult) {
    const cfg = SEVERITY[interactionResult.severity];
    return (
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={[styles.resultHeader, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={32} color={cfg.color} />
          <View>
            <Text style={[styles.resultTitle, { color: cfg.color }]}>Interaction Found</Text>
            <SeverityBadge severity={interactionResult.severity} />
          </View>
        </View>

        {/* Medicines involved */}
        <Card style={{ gap: 8 }}>
          <Text style={styles.sectionLabel}>Medicines Checked</Text>
          {interactionResult.medicines.map((m) => (
            <View key={m.id} style={styles.resultMedRow}>
              <Ionicons name="medkit-outline" size={16} color={Colors.primary} />
              <Text style={styles.resultMedName}>{m.name}</Text>
              <Text style={styles.resultMedType}>{m.type}</Text>
            </View>
          ))}
        </Card>

        {/* Summary */}
        <Card style={{ gap: 6 }}>
          <Text style={styles.sectionLabel}>Summary</Text>
          <Text style={styles.summaryText}>{interactionResult.summary}</Text>
        </Card>

        {/* Recommendation */}
        <Card style={{ gap: 6, backgroundColor: cfg.bg, borderColor: cfg.color + '30' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="bulb-outline" size={16} color={cfg.color} />
            <Text style={[styles.sectionLabel, { color: cfg.color }]}>Recommendation</Text>
          </View>
          <Text style={[styles.summaryText, { color: cfg.color }]}>{interactionResult.recommendation}</Text>
        </Card>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Button title="View Details" onPress={() => setStep('detail')} style={{ flex: 1 }} />
          <Button
            title={saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Check'}
            variant="outline"
            onPress={handleSave}
            disabled={saved || saving}
            style={{ flex: 1 }}
          />
        </View>

        <Button
          title="Check Again"
          variant="ghost"
          onPress={() => { setStep('search'); setInteractionResult(null); }}
        />
      </ScrollView>
    );
  }

  // ── Detail ──────────────────────────────────────────────────
  if (step === 'detail' && interactionResult) {
    const cfg = SEVERITY[interactionResult.severity];
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => setStep('result')} style={styles.backRow}>
          <Ionicons name="arrow-back" size={18} color={Colors.primary} />
          <Text style={styles.backText}>Back to Result</Text>
        </Pressable>

        <Text style={styles.pageTitle}>Interaction Details</Text>

        <Card style={{ gap: 6 }}>
          <Text style={styles.sectionLabel}>Severity</Text>
          <SeverityBadge severity={interactionResult.severity} />
        </Card>

        <Card style={{ gap: 6 }}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.summaryText}>{interactionResult.summary}</Text>
        </Card>

        {interactionResult.symptoms.length > 0 && (
          <Card style={{ gap: 6 }}>
            <Text style={styles.sectionLabel}>Possible Symptoms</Text>
            {interactionResult.symptoms.map((s) => (
              <View key={s} style={styles.symptomRow}>
                <View style={[styles.dot, { backgroundColor: cfg.color }]} />
                <Text style={styles.symptomText}>{s}</Text>
              </View>
            ))}
          </Card>
        )}

        <Card style={{ gap: 6 }}>
          <Text style={styles.sectionLabel}>Recommendations</Text>
          {interactionResult.recommendation.split('.').filter(Boolean).map((r, i) => (
            <View key={i} style={styles.symptomRow}>
              <Ionicons name="checkmark-circle-outline" size={15} color={Colors.success} />
              <Text style={styles.symptomText}>{r.trim()}</Text>
            </View>
          ))}
        </Card>

        {/* AI Summary */}
        <Card style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionLabel}>AI Explanation</Text>
          </View>
          {aiSummary ? (
            <Text style={styles.summaryText}>{aiSummary}</Text>
          ) : (
            <Button
              title={aiLoading ? 'Loading AI…' : 'Get AI Summary'}
              variant="outline"
              onPress={loadAiSummary}
              loading={aiLoading}
            />
          )}
        </Card>
      </ScrollView>
    );
  }

  // ── History ──────────────────────────────────────────────────
  if (step === 'history') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <Pressable onPress={() => setStep('search')} style={[styles.backRow, { marginHorizontal: Spacing.md, marginTop: Spacing.md }]}>
          <Ionicons name="arrow-back" size={18} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={[styles.pageTitle, { marginHorizontal: Spacing.md }]}>Interaction History</Text>

        {historyLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(i) => i.interactionId}
            contentContainerStyle={{ padding: Spacing.md, gap: 8 }}
            renderItem={({ item }) => (
              <HistoryRow
                item={item}
                onPress={async () => {
                  const detail = await getInteractionDetails(item.interactionId);
                  if (detail) {
                    setInteractionResult(detail);
                    setStep('result');
                  }
                }}
                onDelete={() => handleDeleteHistory(item.interactionId)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="git-compare-outline" size={40} color={Colors.border} />
                <Text style={{ color: Colors.textMuted, marginTop: 8 }}>No interaction checks yet.</Text>
              </View>
            }
          />
        )}
      </View>
    );
  }

  // ── Search & Select (default) ────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>Check Interactions</Text>
      <Text style={styles.pageHint}>Select 2 or more medicines to check for interactions.</Text>

      {/* Selected chips */}
      {selectedMeds.length > 0 && (
        <View style={styles.chipWrap}>
          {selectedMeds.map((m) => (
            <SelectedChip key={m.id} med={m} onRemove={() => removeMed(m.id)} />
          ))}
        </View>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medicine to add…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setSuggestions([]); }}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {suggestions.map((m, i) => (
            <React.Fragment key={m.id}>
              <SuggestionRow med={m} onPress={() => addMed(m)} />
              {i < suggestions.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>
      )}

      {/* CTA */}
      <Button
        title={`Analyze Interactions (${selectedMeds.length} selected)`}
        onPress={analyze}
        disabled={selectedMeds.length < 2}
        style={{ marginTop: 8 }}
      />

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>

      <Pressable onPress={loadHistory} style={styles.historyLink}>
        <Ionicons name="time-outline" size={16} color={Colors.primary} />
        <Text style={styles.historyLinkText}>View Interaction History</Text>
      </Pressable>

      {/* Severity Legend */}
      <Card style={{ gap: 10, marginTop: 8 }}>
        <Text style={styles.sectionLabel}>Severity Levels</Text>
        <View style={styles.legendRow}>
          {(Object.entries(SEVERITY) as [SeverityLevel, typeof SEVERITY[SeverityLevel]][]).map(([k, v]) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: v.color }]} />
              <Text style={styles.legendText}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { padding: Spacing.md, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },

  pageTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  pageHint: { fontSize: 13, color: Colors.textMuted, marginTop: -6 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, paddingVertical: 10 },

  suggRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  suggName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  suggMeta: { fontSize: 12, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { color: Colors.textMuted, fontSize: 12 },

  historyLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  historyLinkText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },

  // Analyzing
  analyzingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  analyzingHint: { fontSize: 13, color: Colors.textMuted },
  medsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  medTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary + '15',
  },
  medTagText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  // Result
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
  },
  resultTitle: { fontSize: 17, fontWeight: '800' },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  severityText: { fontSize: 12, fontWeight: '700' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  summaryText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  resultMedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultMedName: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  resultMedType: { fontSize: 12, color: Colors.textMuted },
  actionRow: { flexDirection: 'row', gap: 8 },

  // Detail
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  symptomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  symptomText: { fontSize: 14, color: Colors.text, flex: 1 },

  // History
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  histMeds: { fontSize: 13, fontWeight: '700', color: Colors.text },
  histDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  histBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.pill },
  histSeverity: { fontSize: 11, fontWeight: '700' },

  // Legend
  legendRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.text, fontWeight: '600' },
});
