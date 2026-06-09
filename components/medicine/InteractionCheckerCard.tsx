import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors, Radius, Spacing } from '@/constants/Colors';

export interface InteractionResult {
  severity: 'none' | 'minor' | 'moderate' | 'major' | 'contraindicated';
  summary: string;
  details?: string;
  recommendations?: string[];
}

export interface InteractionPair {
  drugA: string;
  drugB: string;
  result: InteractionResult;
}

interface Props {
  selectedDrugs: string[];          // names of selected drugs
  interaction?: InteractionPair | null;
  isChecking?: boolean;
  onAddDrug: (name: string) => void;
  onRemoveDrug: (name: string) => void;
  onCheck: () => void;
  onClear: () => void;
}

const SEVERITY_CONFIG = {
  none: { color: Colors.success, icon: 'checkmark-circle-outline', label: 'No Interaction Found' },
  minor: { color: Colors.info, icon: 'information-circle-outline', label: 'Minor Interaction' },
  moderate: { color: Colors.warning, icon: 'warning-outline', label: 'Moderate Interaction' },
  major: { color: Colors.danger, icon: 'alert-circle-outline', label: 'Major Interaction' },
  contraindicated: { color: '#7C0000', icon: 'close-circle-outline', label: 'Contraindicated' },
} as const;

export function InteractionCheckerCard({
  selectedDrugs,
  interaction,
  isChecking,
  onAddDrug,
  onRemoveDrug,
  onCheck,
  onClear,
}: Props) {
  const config = interaction ? SEVERITY_CONFIG[interaction.result.severity] : null;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="git-compare-outline" size={20} color={Colors.primary} />
        <Text style={styles.title}>Interaction Checker</Text>
        {selectedDrugs.length > 0 && (
          <Pressable onPress={onClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.hint}>
        Add 2 or more medicines to check for drug interactions.
      </Text>

      {/* Drug chips */}
      {selectedDrugs.length > 0 && (
        <View style={styles.chips}>
          {selectedDrugs.map((drug) => (
            <View key={drug} style={styles.chip}>
              <Ionicons name="medkit-outline" size={12} color={Colors.primary} />
              <Text style={styles.chipText}>{drug}</Text>
              <Pressable hitSlop={6} onPress={() => onRemoveDrug(drug)}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Add drug input — simple pressable that triggers parent logic */}
      <Pressable style={styles.addRow} onPress={() => onAddDrug('')}>
        <View style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.addText}>Add medicine</Text>
        </View>
      </Pressable>

      {/* Check button */}
      <Pressable
        style={[styles.checkBtn, selectedDrugs.length < 2 && styles.checkBtnDisabled]}
        onPress={onCheck}
        disabled={selectedDrugs.length < 2 || isChecking}
      >
        {isChecking ? (
          <Text style={styles.checkBtnText}>Checking…</Text>
        ) : (
          <>
            <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
            <Text style={styles.checkBtnText}>Check Interactions</Text>
          </>
        )}
      </Pressable>

      {/* Result */}
      {interaction && config && (
        <View style={[styles.result, { backgroundColor: config.color + '12', borderColor: config.color + '40' }]}>
          <View style={styles.resultHeader}>
            <Ionicons name={config.icon as any} size={22} color={config.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: config.color }]}>{config.label}</Text>
              <Text style={styles.resultDrugs}>
                {interaction.drugA} + {interaction.drugB}
              </Text>
            </View>
          </View>

          <Text style={styles.resultSummary}>{interaction.result.summary}</Text>

          {interaction.result.details && (
            <Text style={styles.resultDetails}>{interaction.result.details}</Text>
          )}

          {interaction.result.recommendations && interaction.result.recommendations.length > 0 && (
            <View style={styles.recommendations}>
              <Text style={styles.recoTitle}>Recommendations</Text>
              {interaction.result.recommendations.map((r, i) => (
                <View key={i} style={styles.recoRow}>
                  <Ionicons name="arrow-forward-circle-outline" size={14} color={config.color} />
                  <Text style={styles.recoText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.disclaimer}>
            ⚠ Always consult your healthcare provider before making changes to your medication.
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card:             { gap: Spacing.md, padding: Spacing.md },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:            { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  clearBtn:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  clearText:        { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  hint:             { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  chips:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:             { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary + '12', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.primary + '30' },
  chipText:         { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  addRow:           { borderWidth: 1.5, borderColor: Colors.primary + '40', borderStyle: 'dashed', borderRadius: Radius.md, padding: Spacing.sm },
  addBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addText:          { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  checkBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12 },
  checkBtnDisabled: { backgroundColor: Colors.border },
  checkBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  result:           { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  resultHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  resultTitle:      { fontSize: 14, fontWeight: '700' },
  resultDrugs:      { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  resultSummary:    { fontSize: 13, color: Colors.text, lineHeight: 19 },
  resultDetails:    { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  recommendations:  { gap: 5 },
  recoTitle:        { fontSize: 12, fontWeight: '700', color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  recoRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  recoText:         { fontSize: 12, color: Colors.text, flex: 1, lineHeight: 17 },
  disclaimer:       { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 16 },
});
