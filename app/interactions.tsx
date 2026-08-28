import { useState } from "react";
import {
  ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "@/constants/Colors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MedChip } from "@/components/medicines/MedChip";
import { InteractionWarning } from "@/components/medicines/InteractionWarning";
import { useLang } from "@/context/Languagecontext";
import {
  checkInteractions,
  type InteractionResult,
} from "@/services/medicineTabApi";

export default function InteractionsScreen() {
  const { t } = useLang();

  const [meds,    setMeds]    = useState<string[]>([]);
  const [text,    setText]    = useState("");
  const [result,  setResult]  = useState<InteractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const remove = (m: string) => {
    setMeds((s) => s.filter((x) => x !== m));
    setResult(null); // clear previous result when list changes
    setError(null);
  };

  const add = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (meds.includes(trimmed)) {
      setText("");
      return;
    }
    setMeds((s) => [...s, trimmed]);
    setText("");
    setResult(null);
    setError(null);
  };

  const handleCheck = async () => {
    if (meds.length < 2) {
      setError("Add at least 2 medicines to check for interactions.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // medicineTabApi.checkInteractions takes medicine IDs in REAL mode.
      // In MOCK mode it accepts any strings as IDs and returns mock data.
      const res = await checkInteractions(meds);
      setResult(res);
    } catch (e) {
      setError("Failed to check interactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const severityColor: Record<string, string> = {
    none:     Colors.primary,
    low:      '#16A34A',
    moderate: '#B45309',
    high:     '#DC2626',
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t("interactions_title")}</Text>
      <Text style={styles.sub}>{t("interactions_sub")}</Text>

      {/* Add medicine input */}
      <Text style={styles.section}>{t("add_medicine")}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Input
            placeholder={t("search_medicine")}
            value={text}
            onChangeText={setText}
            onSubmitEditing={add}
            returnKeyType="done"
          />
        </View>
        <Pressable onPress={add} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Selected medicines */}
      {meds.length > 0 && (
        <>
          <Text style={styles.section}>{t("selected_meds")} ({meds.length})</Text>
          {meds.map((m) => (
            <MedChip key={m} name={m} onRemove={() => remove(m)} />
          ))}
        </>
      )}

      {/* Validation error */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Check button */}
      <Button
        title={loading ? "Checking…" : t("save_check")}
        onPress={handleCheck}
        disabled={loading || meds.length < 2}
      />

      {/* Loading */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Analysing interactions…</Text>
        </View>
      )}

      {/* Result */}
      {result && !loading && (
        <View style={styles.resultCard}>
          {/* Severity badge */}
          <View style={styles.severityRow}>
            <View style={[styles.severityDot, { backgroundColor: severityColor[result.severity] ?? Colors.primary }]} />
            <Text style={[styles.severityLabel, { color: severityColor[result.severity] ?? Colors.primary }]}>
              {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} interaction
            </Text>
          </View>

          {result.severity !== 'none' ? (
            <InteractionWarning message={result.summary} />
          ) : (
            <View style={styles.safeBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.safeText}>No significant interactions found.</Text>
            </View>
          )}

          {/* Recommendation */}
          {result.recommendation ? (
            <View style={styles.recBox}>
              <Text style={styles.recLabel}>Recommendation</Text>
              <Text style={styles.recText}>{result.recommendation}</Text>
            </View>
          ) : null}

          {/* Symptoms to watch */}
          {result.symptoms?.length > 0 && (
            <View style={styles.symptomsBox}>
              <Text style={styles.recLabel}>Symptoms to watch</Text>
              {result.symptoms.map((s) => (
                <View key={s} style={styles.symptomRow}>
                  <View style={styles.symptomDot} />
                  <Text style={styles.symptomText}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title:        { fontSize: 22, fontWeight: "700", color: Colors.text },
  sub:          { color: Colors.textMuted },
  section:      { fontWeight: "700", color: Colors.text, marginTop: 8 },
  addBtn: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: Radius.md,
    padding: 10, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, color: '#DC2626', fontSize: 13 },
  loadingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    justifyContent: 'center', paddingVertical: 12,
  },
  loadingText: { color: Colors.textMuted },
  resultCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: 12,
  },
  severityRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  severityDot:  { width: 10, height: 10, borderRadius: 5 },
  severityLabel:{ fontWeight: '700', fontSize: 15 },
  safeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: Radius.md,
    padding: 12, borderWidth: 1, borderColor: '#BBF7D0',
  },
  safeText:     { color: '#16A34A', fontWeight: '600' },
  recBox:       { gap: 4 },
  recLabel:     { fontSize: 13, fontWeight: '700', color: Colors.text },
  recText:      { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  symptomsBox:  { gap: 6 },
  symptomRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  symptomDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  symptomText:  { fontSize: 13, color: Colors.textMuted },
});
