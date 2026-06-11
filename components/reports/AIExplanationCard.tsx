import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "@/constants/Colors";
import type { ApiSummary, MedicalTerm } from "@/types/Report/reportype";

interface Props {
  text?: string;
}

// ─── Tiny helpers ──────────────────────────────────────────────────────────────

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 14 }} />;
}

function SectionTitle({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
}) {
  return (
    <View style={sh.row}>
      <View style={[sh.iconCircle, { backgroundColor: (color ?? Colors.primary) + "18" }]}>
        <Ionicons name={icon} size={14} color={color ?? Colors.primary} />
      </View>
      <Text style={[sh.label, color ? { color } : undefined]}>{label}</Text>
    </View>
  );
}

function BulletItem({ text, color }: { text: string; color?: string }) {
  return (
    <View style={bi.row}>
      <View style={[bi.dot, { backgroundColor: color ?? Colors.primary }]} />
      <Text style={[bi.text, color ? { color } : undefined]}>{text}</Text>
    </View>
  );
}

function Chip({
  text,
  color,
  bg,
}: {
  text: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[chip.wrap, bg ? { backgroundColor: bg, borderColor: "transparent" } : undefined]}>
      <Text style={[chip.text, color ? { color } : undefined]}>{text}</Text>
    </View>
  );
}

function ChipGrid({ items, color, bg }: { items: string[]; color?: string; bg?: string }) {
  return (
    <View style={cg.grid}>
      {items.map((item, i) => (
        <Chip key={i} text={item} color={color} bg={bg} />
      ))}
    </View>
  );
}

function StepItem({ index, text }: { index: number; text: string }) {
  return (
    <View style={step.row}>
      <View style={step.numCircle}>
        <Text style={step.num}>{index + 1}</Text>
      </View>
      <Text style={step.text}>{text}</Text>
    </View>
  );
}

function CollapsibleCard({
  icon,
  label,
  iconColor,
  children,
  defaultOpen = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={cc.wrap}>
      <Pressable
        style={({ pressed }) => [cc.header, pressed && { opacity: 0.7 }]}
        onPress={() => setOpen((o) => !o)}
      >
        <SectionTitle icon={icon} label={label} color={iconColor} />
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.textMuted}
        />
      </Pressable>
      {open && <View style={cc.body}>{children}</View>}
    </View>
  );
}

function SubLabel({ text, color }: { text: string; color?: string }) {
  return (
    <Text style={[subLbl.text, color ? { color } : undefined]}>{text}</Text>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function AIExplanationCard({ text }: Props) {
  let p: ApiSummary | null = null;
  if (text) {
    try {
      p = JSON.parse(text);
    } catch {
      /* plain string */
    }
  }

  // Fallback for plain text summary
  if (!p) {
    return (
      <View style={styles.card}>
        <SectionTitle icon="sparkles" label="AI Summary" />
        <Text style={styles.bodyText}>{text ?? "No summary available."}</Text>
      </View>
    );
  }

  const hasDiet =
    p.recommended_diet?.length ||
    p.foods_to_avoid?.length ||
    p.recommended_fruits?.length ||
    p.recommended_juices?.length ||
    p.recommended_leafy_vegetables?.length ||
    p.protein_recommendations?.length;

  const hasLifestyle =
    p.exercise_recommendations?.length ||
    p.sleep_recommendations?.length ||
    p.water_intake ||
    p.lifestyle_changes?.length;

  return (
    <View style={{ gap: 10 }}>

      {/* ── Emergency Banner ── */}
      {p.is_emergency && p.emergency_warning ? (
        <View style={styles.emergencyBanner}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.emergencyText}>{p.emergency_warning}</Text>
        </View>
      ) : null}

      {/* ── CARD 1: Overview ── */}
      <View style={styles.card}>
        <SectionTitle icon="sparkles" label="AI Summary" />
        {p.overall_health ? (
          <Text style={styles.bodyText}>{p.overall_health}</Text>
        ) : null}
        {p.ai_summary ? (
          <Text style={[styles.bodyText, p.overall_health ? { marginTop: 6 } : undefined]}>
            {p.ai_summary}
          </Text>
        ) : null}

        {/* Condition severity pill */}
        {p.condition_severity ? (
          <View style={styles.severityRow}>
            <Ionicons
              name="pulse"
              size={13}
              color={
                p.condition_severity?.toLowerCase().includes("good")
                  ? Colors.success
                  : Colors.warning
              }
            />
            <Text
              style={[
                styles.severityText,
                {
                  color: p.condition_severity?.toLowerCase().includes("good")
                    ? Colors.success
                    : Colors.warning,
                },
              ]}
            >
              {p.condition_severity}
            </Text>
          </View>
        ) : null}

        {/* Patient friendly explanation */}
        {p.patient_friendly_explanation ? (
          <>
            <Divider />
            <SectionTitle icon="people-outline" label="In Simple Words" />
            <Text style={styles.bodyText}>{p.patient_friendly_explanation}</Text>
          </>
        ) : null}
      </View>

      {/* ── CARD 2: Abnormal Findings + Risks (combined) ── */}
      {(p.abnormal_findings?.length || p.important_risks?.length) ? (
        <View style={[styles.card, styles.alertCard]}>
          {p.abnormal_findings?.length ? (
            <>
              <SectionTitle icon="warning-outline" label="Abnormal Findings" color={Colors.danger} />
              <View style={styles.bulletList}>
                {p.abnormal_findings.map((item, i) => (
                  <BulletItem key={i} text={item} color={Colors.danger} />
                ))}
              </View>
            </>
          ) : null}

          {p.abnormal_findings?.length && p.important_risks?.length ? (
            <Divider />
          ) : null}

          {p.important_risks?.length ? (
            <>
              <SectionTitle icon="shield-outline" label="Important Risks" color={Colors.warning} />
              <View style={styles.bulletList}>
                {p.important_risks.map((item, i) => (
                  <BulletItem key={i} text={item} color={Colors.warning} />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {/* ── CARD 3: What To Do Next ── */}
      {p.what_patient_should_do_next?.length ? (
        <View style={[styles.card, styles.doNextCard]}>
          <SectionTitle icon="checkmark-circle-outline" label="What To Do Next" color={Colors.success} />
          <View style={styles.stepList}>
            {p.what_patient_should_do_next.map((s, i) => (
              <StepItem key={i} index={i} text={s} />
            ))}
          </View>
        </View>
      ) : null}

      {/* ── CARD 4: Symptoms ── */}
      {p.symptoms_patient_may_feel?.length ? (
        <CollapsibleCard icon="pulse-outline" label="Symptoms You May Feel">
          <ChipGrid items={p.symptoms_patient_may_feel} />
        </CollapsibleCard>
      ) : null}

      {/* ── CARD 5: Diet & Nutrition ── */}
      {hasDiet ? (
        <CollapsibleCard icon="nutrition-outline" label="Diet & Nutrition">
          {p.recommended_diet?.length ? (
            <>
              <SubLabel text="Recommended Foods" />
              <ChipGrid items={p.recommended_diet} color={Colors.success} bg="#F0FDF4" />
            </>
          ) : null}
          {p.foods_to_avoid?.length ? (
            <>
              <SubLabel text="Foods to Avoid" color={Colors.danger} />
              <ChipGrid items={p.foods_to_avoid} color={Colors.danger} bg="#FEF2F2" />
            </>
          ) : null}
          {p.recommended_fruits?.length ? (
            <>
              <SubLabel text="Fruits" />
              <ChipGrid items={p.recommended_fruits} />
            </>
          ) : null}
          {p.recommended_juices?.length ? (
            <>
              <SubLabel text="Juices" />
              <ChipGrid items={p.recommended_juices} />
            </>
          ) : null}
          {p.recommended_leafy_vegetables?.length ? (
            <>
              <SubLabel text="Vegetables" />
              <ChipGrid items={p.recommended_leafy_vegetables} />
            </>
          ) : null}
          {p.protein_recommendations?.length ? (
            <>
              <SubLabel text="Protein Sources" />
              <ChipGrid items={p.protein_recommendations} />
            </>
          ) : null}
        </CollapsibleCard>
      ) : null}

      {/* ── CARD 6: Lifestyle ── */}
      {hasLifestyle ? (
        <CollapsibleCard icon="fitness-outline" label="Lifestyle & Wellness">
          {p.exercise_recommendations?.length ? (
            <>
              <SubLabel text="Exercise" />
              <ChipGrid items={p.exercise_recommendations} />
            </>
          ) : null}
          {p.water_intake ? (
            <>
              <SubLabel text="Water Intake" />
              <View style={styles.waterRow}>
                <Ionicons name="water-outline" size={16} color={Colors.info} />
                <Text style={[styles.bodyText, { marginTop: 0, color: Colors.info, fontWeight: "600" }]}>
                  {p.water_intake}
                </Text>
              </View>
            </>
          ) : null}
          {p.sleep_recommendations?.length ? (
            <>
              <SubLabel text="Sleep" />
              <View style={styles.bulletList}>
                {p.sleep_recommendations.map((s, i) => (
                  <BulletItem key={i} text={s} />
                ))}
              </View>
            </>
          ) : null}
          {p.lifestyle_changes?.length ? (
            <>
              <SubLabel text="Changes to Make" />
              <View style={styles.bulletList}>
                {p.lifestyle_changes.map((s, i) => (
                  <BulletItem key={i} text={s} />
                ))}
              </View>
            </>
          ) : null}
        </CollapsibleCard>
      ) : null}

      {/* ── CARD 7: Doctor & Follow-up ── */}
      {(p.doctor_consultation_needed || p.questions_to_ask_doctor?.length || p.next_tests_recommended?.length) ? (
        <View style={[styles.card, styles.doctorCard]}>
          <SectionTitle icon="medical-outline" label="Doctor & Follow-up" color="#D97706" />
          {p.doctor_consultation_needed ? (
            <Text style={styles.bodyText}>{p.doctor_consultation_needed}</Text>
          ) : null}
          {p.next_tests_recommended?.length ? (
            <>
              <SubLabel text="Follow-Up Tests" />
              <ChipGrid items={p.next_tests_recommended} />
            </>
          ) : null}
          {p.questions_to_ask_doctor?.length ? (
            <>
              <SubLabel text="Questions for Your Doctor" />
              <View style={styles.bulletList}>
                {p.questions_to_ask_doctor.map((q, i) => (
                  <BulletItem key={i} text={q} />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {/* ── CARD 8: Precautions ── */}
      {p.precautions?.length ? (
        <CollapsibleCard icon="alert-circle-outline" label="Precautions" iconColor={Colors.warning}>
          <View style={styles.bulletList}>
            {p.precautions.map((s, i) => (
              <BulletItem key={i} text={s} color={Colors.warning} />
            ))}
          </View>
        </CollapsibleCard>
      ) : null}

      {/* ── CARD 9: Medical Terms ── */}
      {p.medical_terms_translated?.length ? (
        <CollapsibleCard icon="book-outline" label="Medical Terms Explained">
          {p.medical_terms_translated.map((t: MedicalTerm, i: number) => (
            <View key={i} style={styles.termRow}>
              <Text style={styles.termName}>{t.term}</Text>
              <Text style={styles.termMeaning}>{t.simple_meaning}</Text>
            </View>
          ))}
        </CollapsibleCard>
      ) : null}

      {/* ── CARD 10: Voice Explanations ── */}
      {(p.voice_explanation_english || p.voice_explanation_telugu) ? (
        <CollapsibleCard icon="volume-high-outline" label="Voice Explanation">
          {p.voice_explanation_english ? (
            <>
              <SubLabel text="English" />
              <Text style={styles.bodyText}>{p.voice_explanation_english}</Text>
            </>
          ) : null}
          {p.voice_explanation_telugu ? (
            <>
              <SubLabel text="తెలుగు" />
              <Text style={styles.bodyText}>{p.voice_explanation_telugu}</Text>
            </>
          ) : null}
        </CollapsibleCard>
      ) : null}

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 0,
  },
  alertCard: {
    backgroundColor: "#FFFBF5",
    borderColor: "#FDE68A",
  },
  doNextCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  doctorCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },

  bodyText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginTop: 8,
  },

  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.surface,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },

  emergencyBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: Colors.danger,
    borderRadius: Radius.lg,
    padding: 14,
  },
  emergencyText: {
    color: "#fff",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },

  bulletList: { gap: 6, marginTop: 10 },
  stepList: { gap: 8, marginTop: 10 },

  waterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },

  termRow: { marginTop: 10, gap: 2 },
  termName: { fontSize: 13, fontWeight: "700", color: Colors.text },
  termMeaning: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
});

// Section header
const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 14, fontWeight: "700", color: Colors.text },
});

// Bullet item
const bi = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  text: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 21 },
});

// Chips
const chip = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: { fontSize: 12, fontWeight: "500", color: Colors.text },
});

const cg = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
});

// Step
const step = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  numCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  num: { color: "#fff", fontSize: 11, fontWeight: "700" },
  text: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22 },
});

// Collapsible card
const cc = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
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

// Sub label
const subLbl = StyleSheet.create({
  text: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    marginTop: 12,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
