import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Colors, Radius } from "@/constants/Colors";
import type { ApiSummary, MedicalTerm } from "@/types/Report/reportype";

interface Props {
  text?: string;
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={sh.row}>
      <View style={sh.iconCircle}>
        <Ionicons name={icon} size={14} color={Colors.primary} />
      </View>
      <Text style={sh.label}>{label}</Text>
    </View>
  );
}

function BulletList({ items, color }: { items: string[]; color?: string }) {
  return (
    <>
      {items.map((item, i) => (
        <Text key={i} style={[bl.item, color ? { color } : undefined]}>
          {item}
        </Text>
      ))}
    </>
  );
}

function InfoChip({ text }: { text: string }) {
  return (
    <View style={chip.wrap}>
      <Text style={chip.text}>{text}</Text>
    </View>
  );
}

function ChipGrid({ items }: { items: string[] }) {
  return (
    <View style={cg.grid}>
      {items.map((item, i) => (
        <InfoChip key={i} text={item} />
      ))}
    </View>
  );
}

function CollapsibleSection({
  icon,
  label,
  children,
  defaultOpen = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={cs.wrap}>
      <Pressable style={cs.header} onPress={() => setOpen((o) => !o)}>
        <SectionHeader icon={icon} label={label} />
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.textMuted}
        />
      </Pressable>
      {open && <View style={cs.body}>{children}</View>}
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AIExplanationCard({ text }: Props) {
  let parsed: ApiSummary | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      /* plain string */
    }
  }

  if (!parsed) {
    return (
      <Card>
        <SectionHeader icon="sparkles" label="AI Explanation" />
        <Text style={styles.body}>{text ?? "No explanation available."}</Text>
      </Card>
    );
  }

  const p = parsed;

  return (
    <View style={{ gap: 10 }}>
      {/* ── Emergency Banner ── */}
      {p.is_emergency && p.emergency_warning ? (
        <Card style={styles.emergencyCard}>
          <View style={styles.emergencyRow}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.emergencyText}>{p.emergency_warning}</Text>
          </View>
        </Card>
      ) : null}

      {/* ── Report Description ── */}
      {p.report_description && (
        <Card>
          <SectionHeader
            icon="document-text-outline"
            label="About This Report"
          />
          {p.report_description.what_this_report_is && (
            <Text style={styles.body}>
              {p.report_description.what_this_report_is}
            </Text>
          )}
          {p.report_description.what_was_checked && (
            <Text style={[styles.body, { marginTop: 6 }]}>
              {p.report_description.what_was_checked}
            </Text>
          )}
        </Card>
      )}

      {/* ── AI Summary + Health Score ── */}
      <Card>
        <View style={styles.summaryTopRow}>
          <SectionHeader icon="sparkles" label="AI Summary" />
          {p.health_score ? (
            <View style={styles.scorePill}>
              <Ionicons name="heart" size={12} color={Colors.success} />
              <Text style={styles.scoreText}>{p.health_score}</Text>
            </View>
          ) : null}
        </View>

        {p.condition_severity ? (
          <View style={styles.severityRow}>
            <Text style={styles.conditionEmoji}>{p.condition_color ?? ""}</Text>
            <Text style={styles.severity}>{p.condition_severity}</Text>
          </View>
        ) : null}

        {p.ai_summary ? <Text style={styles.body}>{p.ai_summary}</Text> : null}

        {p.overall_health ? (
          <>
            <Text style={styles.label}>Overall Health</Text>
            <Text style={styles.body}>{p.overall_health}</Text>
          </>
        ) : null}
      </Card>

      {/* ── Patient-Friendly Explanation ── */}
      {p.patient_friendly_explanation ? (
        <Card style={styles.friendlyCard}>
          <SectionHeader icon="people-outline" label="In Simple Words" />
          <Text style={[styles.body, { marginTop: 8 }]}>
            {p.patient_friendly_explanation}
          </Text>
        </Card>
      ) : null}

      {/* ── Abnormal Findings ── */}
      {p.abnormal_findings?.length ? (
        <Card>
          <SectionHeader icon="warning-outline" label="Abnormal Findings" />
          <BulletList items={p.abnormal_findings} color={Colors.danger} />
        </Card>
      ) : null}

      {/* ── Symptoms ── */}
      {p.symptoms_patient_may_feel?.length ? (
        <CollapsibleSection icon="pulse-outline" label="Symptoms You May Feel">
          <ChipGrid items={p.symptoms_patient_may_feel} />
        </CollapsibleSection>
      ) : null}

      {/* ── Important Risks ── */}
      {p.important_risks?.length ? (
        <CollapsibleSection icon="shield-outline" label="Important Risks">
          <BulletList items={p.important_risks} />
        </CollapsibleSection>
      ) : null}

      {/* ── What To Do Next ── */}
      {p.what_patient_should_do_next?.length ? (
        <Card style={styles.doNextCard}>
          <SectionHeader
            icon="checkmark-circle-outline"
            label="What To Do Next"
          />
          {p.what_patient_should_do_next.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.body, { flex: 1, marginTop: 0 }]}>
                {step}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {/* ── Diet & Nutrition ── */}
      {p.recommended_diet?.length ||
      p.foods_to_avoid?.length ||
      p.recommended_fruits?.length ||
      p.recommended_juices?.length ||
      p.recommended_leafy_vegetables?.length ||
      p.protein_recommendations?.length ? (
        <CollapsibleSection icon="nutrition-outline" label="Diet & Nutrition">
          {p.recommended_diet?.length ? (
            <>
              <Text style={styles.subLabel}>Recommended Foods</Text>
              <ChipGrid items={p.recommended_diet} />
            </>
          ) : null}
          {p.foods_to_avoid?.length ? (
            <>
              <Text style={[styles.subLabel, { color: Colors.danger }]}>
                Foods to Avoid
              </Text>
              <ChipGrid items={p.foods_to_avoid} />
            </>
          ) : null}
          {p.recommended_fruits?.length ? (
            <>
              <Text style={styles.subLabel}>Fruits</Text>
              <ChipGrid items={p.recommended_fruits} />
            </>
          ) : null}
          {p.recommended_juices?.length ? (
            <>
              <Text style={styles.subLabel}>Juices</Text>
              <ChipGrid items={p.recommended_juices} />
            </>
          ) : null}
          {p.recommended_leafy_vegetables?.length ? (
            <>
              <Text style={styles.subLabel}>Leafy Vegetables</Text>
              <ChipGrid items={p.recommended_leafy_vegetables} />
            </>
          ) : null}
          {p.protein_recommendations?.length ? (
            <>
              <Text style={styles.subLabel}>Protein Sources</Text>
              <ChipGrid items={p.protein_recommendations} />
            </>
          ) : null}
        </CollapsibleSection>
      ) : null}

      {/* ── Lifestyle ── */}
      {p.exercise_recommendations?.length ||
      p.sleep_recommendations?.length ||
      p.water_intake ||
      p.lifestyle_changes?.length ? (
        <CollapsibleSection icon="fitness-outline" label="Lifestyle & Wellness">
          {p.exercise_recommendations?.length ? (
            <>
              <Text style={styles.subLabel}>Exercise</Text>
              <ChipGrid items={p.exercise_recommendations} />
            </>
          ) : null}
          {p.sleep_recommendations?.length ? (
            <>
              <Text style={styles.subLabel}>Sleep</Text>
              <BulletList items={p.sleep_recommendations} />
            </>
          ) : null}
          {p.water_intake ? (
            <>
              <Text style={styles.subLabel}>Water Intake</Text>
              <Text style={styles.body}>{p.water_intake}</Text>
            </>
          ) : null}
          {p.lifestyle_changes?.length ? (
            <>
              <Text style={styles.subLabel}>Lifestyle Changes</Text>
              <BulletList items={p.lifestyle_changes} />
            </>
          ) : null}
        </CollapsibleSection>
      ) : null}

      {/* ── Precautions ── */}
      {p.precautions?.length ? (
        <CollapsibleSection icon="alert-circle-outline" label="Precautions">
          <BulletList items={p.precautions} />
        </CollapsibleSection>
      ) : null}

      {/* ── Doctor Consultation ── */}
      {p.doctor_consultation_needed ||
      p.questions_to_ask_doctor?.length ||
      p.next_tests_recommended?.length ? (
        <Card style={styles.doctorCard}>
          <SectionHeader icon="medical-outline" label="Doctor Consultation" />
          {p.doctor_consultation_needed ? (
            <Text style={styles.body}>{p.doctor_consultation_needed}</Text>
          ) : null}
          {p.questions_to_ask_doctor?.length ? (
            <>
              <Text style={styles.subLabel}>Questions to Ask Your Doctor</Text>
              <BulletList items={p.questions_to_ask_doctor} />
            </>
          ) : null}
          {p.next_tests_recommended?.length ? (
            <>
              <Text style={styles.subLabel}>Recommended Follow-Up Tests</Text>
              <ChipGrid items={p.next_tests_recommended} />
            </>
          ) : null}
        </Card>
      ) : null}

      {/* ── Emergency Warning Signs ── */}
      {p.emergency_warning_signs?.length ? (
        <CollapsibleSection
          icon="warning-outline"
          label="Emergency Warning Signs"
        >
          <BulletList items={p.emergency_warning_signs} color={Colors.danger} />
        </CollapsibleSection>
      ) : null}

      {/* ── Medical Terms ── */}
      {p.medical_terms_translated?.length ? (
        <CollapsibleSection icon="book-outline" label="Medical Terms Explained">
          {p.medical_terms_translated.map((t: MedicalTerm, i: number) => (
            <View key={i} style={styles.termRow}>
              <Text style={styles.termName}>{t.term}</Text>
              <Text style={styles.termMeaning}>{t.simple_meaning}</Text>
            </View>
          ))}
        </CollapsibleSection>
      ) : null}

      {/* ── Voice Explanations ── */}
      {p.voice_explanation_english || p.voice_explanation_telugu ? (
        <CollapsibleSection
          icon="volume-high-outline"
          label="Voice Explanation"
        >
          {p.voice_explanation_english ? (
            <>
              <Text style={styles.subLabel}>English</Text>
              <Text style={styles.body}>{p.voice_explanation_english}</Text>
            </>
          ) : null}
          {p.voice_explanation_telugu ? (
            <>
              <Text style={styles.subLabel}>తెలుగు</Text>
              <Text style={styles.body}>{p.voice_explanation_telugu}</Text>
            </>
          ) : null}
        </CollapsibleSection>
      ) : null}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  body: { color: Colors.text, marginTop: 8, lineHeight: 20, fontSize: 14 },
  label: { fontSize: 14, fontWeight: "700", color: Colors.text, marginTop: 12 },
  subLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
    marginTop: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scoreText: { fontSize: 12, fontWeight: "700", color: Colors.success },
  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  conditionEmoji: { fontSize: 16 },
  severity: { fontSize: 13, fontWeight: "600", color: Colors.warning },

  friendlyCard: { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" },
  doNextCard: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  doctorCard: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },

  emergencyCard: { backgroundColor: Colors.danger },
  emergencyRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  emergencyText: {
    color: "#fff",
    flex: 1,
    lineHeight: 20,
    fontSize: 14,
    fontWeight: "600",
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  termRow: { marginTop: 10, gap: 3 },
  termName: { fontSize: 13, fontWeight: "700", color: Colors.text },
  termMeaning: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
});

// Section header helper styles
const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 15, fontWeight: "700", color: Colors.text },
});

// Bullet list styles
const bl = StyleSheet.create({
  item: {
    color: Colors.text,
    lineHeight: 22,
    marginTop: 4,
    fontSize: 14,
    paddingLeft: 4,
  },
});

// Chip styles
const chip = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: { fontSize: 12, color: Colors.text, fontWeight: "500" },
});

// Chip grid styles
const cg = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
});

// Collapsible section styles
const cs = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  body: { paddingHorizontal: 14, paddingBottom: 14 },
});
