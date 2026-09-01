import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "@/constants/Colors";
import type { ApiSummary, MedicalTerm } from "@/types/Report/reportype";
import { useLang } from "@/context/Languagecontext";

interface Props {
  text?: string;
}

// ─── Tiny helpers ──────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
}) {
  const { rowDirection } = useLang();
  return (
    <View style={[sh.row, { flexDirection: rowDirection }]}>
      <Ionicons name={icon} size={15} color={color ?? Colors.primary} />
      <Text style={[sh.label, color ? { color } : undefined]}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 16 }} />;
}

function Tag({ text, color, bg }: { text: string; color?: string; bg?: string }) {
  return (
    <View style={[tag.wrap, bg ? { backgroundColor: bg, borderColor: "transparent" } : undefined]}>
      <Text style={[tag.text, color ? { color } : undefined]}>{text}</Text>
    </View>
  );
}

function TagRow({ items, color, bg }: { items: string[]; color?: string; bg?: string }) {
  return (
    <View style={tag.row}>
      {items.map((item, i) => (
        <Tag key={i} text={item} color={color} bg={bg} />
      ))}
    </View>
  );
}

function Bullet({ text, color }: { text: string; color?: string }) {
  const { rowDirection, textAlign } = useLang();
  return (
    <View style={[bul.row, { flexDirection: rowDirection }]}>
      <View style={[bul.dot, { backgroundColor: color ?? Colors.primary }]} />
      <Text style={[bul.text, { textAlign }]}>{text}</Text>
    </View>
  );
}

function StepRow({ index, text }: { index: number; text: string }) {
  const { rowDirection, textAlign } = useLang();
  return (
    <View style={[sr.row, { flexDirection: rowDirection }]}>
      <View style={sr.circle}>
        <Text style={sr.num}>{index + 1}</Text>
      </View>
      <Text style={[sr.text, { textAlign }]}>{text}</Text>
    </View>
  );
}

// Collapsible block for secondary content
function CollapseBlock({
  icon,
  label,
  iconColor,
  defaultOpen = true,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { rowDirection } = useLang();
  return (
    <View style={cb.wrap}>
      <Pressable
        style={({ pressed }) => [cb.header, { flexDirection: rowDirection }, pressed && { opacity: 0.7 }]}
        onPress={() => setOpen((o) => !o)}
      >
        <SectionHeader icon={icon} label={label} color={iconColor} />
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={15}
          color={Colors.textMuted}
        />
      </Pressable>
      {open && <View style={cb.body}>{children}</View>}
    </View>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function AIExplanationCard({ text }: Props) {
  const { t, rowDirection, textAlign } = useLang();
  let p: ApiSummary | null = null;
  if (text) {
    try {
      p = JSON.parse(text);
    } catch {
      /* plain string */
    }
  }

  // Fallback for plain text
  if (!p) {
    return (
      <View style={styles.card}>
        <SectionHeader icon="sparkles" label={t("ai_summary")} />
        <Text style={[styles.body, { textAlign }]}>{text ?? "No summary available."}</Text>
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
    <View style={styles.card}>
      <View style={[styles.aiHeader, { flexDirection: rowDirection }]}>
        <Text style={styles.cardTitle}>{t("ai_summary")}</Text>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={12} color="#fff" />
          <Text style={styles.aiBadgeText}>HealthAI</Text>
        </View>
      </View>

      {/* ── Emergency banner ── */}
      {p.is_emergency && p.emergency_warning ? (
        <View style={[styles.emergencyBanner, { flexDirection: rowDirection }]}>
          <Ionicons name="alert-circle" size={18} color="#fff" />
          <Text style={[styles.emergencyText, { textAlign }]}>{p.emergency_warning}</Text>
        </View>
      ) : null}

      {/* ── Report Description ── */}
      {p.report_description ? (
        <View style={[styles.descBox, { flexDirection: rowDirection }]}>
          <Ionicons name="document-text-outline" size={15} color={Colors.primary} />
          <Text style={[styles.descText, { textAlign }]}>
            {typeof p.report_description === 'string'
              ? p.report_description
              : p.report_description.what_this_report_is || p.report_description.what_was_checked || ''}
          </Text>
        </View>
      ) : null}

      {/* ── Overview ── */}
      {p.overall_health ? (
        <Text style={[styles.body, { textAlign }]}>{p.overall_health}</Text>
      ) : null}
      {p.ai_summary ? (
        <Text style={[styles.body, { textAlign }, p.overall_health ? { marginTop: 6 } : undefined]}>
          {p.ai_summary}
        </Text>
      ) : null}

      {p.condition_severity ? (
        <View style={[styles.severityPill, { flexDirection: rowDirection }]}>
          <Ionicons
            name="pulse"
            size={12}
            color={
              p.condition_severity.toLowerCase().includes("good")
                ? Colors.success
                : Colors.warning
            }
          />
          <Text
            style={[
              styles.severityText,
              {
                color: p.condition_severity.toLowerCase().includes("good")
                  ? Colors.success
                  : Colors.warning,
              },
            ]}
          >
            {p.condition_severity}
          </Text>
        </View>
      ) : null}

      {p.patient_friendly_explanation ? (
        <>
          <Divider />
          <SectionHeader icon="people-outline" label={t("in_simple_words")} />
          <Text style={[styles.body, { textAlign, marginTop: 8 }]}>{p.patient_friendly_explanation}</Text>
        </>
      ) : null}

      {/* ── Abnormal findings + risks ── */}
      {(p.abnormal_findings?.length || p.important_risks?.length) ? (
        <>
          <Divider />
          {p.abnormal_findings?.length ? (
            <>
              <SectionHeader icon="warning-outline" label={t("abnormal_findings")} color={Colors.danger} />
              <View style={styles.bulletBlock}>
                {p.abnormal_findings.map((item, i) => (
                  <Bullet key={i} text={item} color={Colors.danger} />
                ))}
              </View>
            </>
          ) : null}
          {p.important_risks?.length ? (
            <View style={p.abnormal_findings?.length ? { marginTop: 14 } : undefined}>
              <SectionHeader icon="shield-outline" label={t("important_risks")} color={Colors.warning} />
              <View style={styles.bulletBlock}>
                {p.important_risks.map((item, i) => (
                  <Bullet key={i} text={item} color={Colors.warning} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      {/* ── What to do next ── */}
      {p.what_patient_should_do_next?.length ? (
        <>
          <Divider />
          <SectionHeader icon="checkmark-circle-outline" label={t("what_to_do_next")} color={Colors.success} />
          <View style={styles.stepBlock}>
            {p.what_patient_should_do_next.map((s, i) => (
              <StepRow key={i} index={i} text={s} />
            ))}
          </View>
        </>
      ) : null}

      {/* ── Symptoms ── */}
      {p.symptoms_patient_may_feel?.length ? (
        <>
          <Divider />
          <SectionHeader icon="pulse-outline" label={t("symptoms_you_may_feel")} />
          <TagRow items={p.symptoms_patient_may_feel} />
        </>
      ) : null}

      {/* ── Doctor & follow-up ── */}
      {(p.doctor_consultation_needed || p.next_tests_recommended?.length || p.questions_to_ask_doctor?.length) ? (
        <>
          <Divider />
          <SectionHeader icon="medical-outline" label={t("doctor_followup")} color="#D97706" />
          {p.doctor_consultation_needed ? (
            <Text style={[styles.body, { textAlign, marginTop: 8 }]}>{p.doctor_consultation_needed}</Text>
          ) : null}
          {p.next_tests_recommended?.length ? (
            <>
              <Text style={[styles.subLabel, { textAlign }]}>Follow-Up Tests</Text>
              <TagRow items={p.next_tests_recommended} />
            </>
          ) : null}
          {p.questions_to_ask_doctor?.length ? (
            <>
              <Text style={[styles.subLabel, { textAlign }]}>Questions for Your Doctor</Text>
              <View style={styles.bulletBlock}>
                {p.questions_to_ask_doctor.map((q, i) => (
                  <Bullet key={i} text={q} />
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}

      {/* ── Diet (collapsible) ── */}
      {hasDiet ? (
        <>
          <Divider />
          <CollapseBlock icon="nutrition-outline" label={t("diet_nutrition")}>
            {p.recommended_diet?.length ? (
              <>
                <Text style={[styles.subLabel, { textAlign }]}>Recommended</Text>
                <TagRow items={p.recommended_diet} color={Colors.success} bg="#F0FDF4" />
              </>
            ) : null}
            {p.foods_to_avoid?.length ? (
              <>
                <Text style={[styles.subLabel, { textAlign }]}>Avoid</Text>
                <TagRow items={p.foods_to_avoid} color={Colors.danger} bg="#FEF2F2" />
              </>
            ) : null}
            {p.recommended_fruits?.length ? (
              <>
                <Text style={[styles.subLabel, { textAlign }]}>Fruits</Text>
                <TagRow items={p.recommended_fruits} />
              </>
            ) : null}
            {p.recommended_juices?.length ? (
              <>
                <Text style={[styles.subLabel, { textAlign }]}>Juices</Text>
                <TagRow items={p.recommended_juices} />
              </>
            ) : null}
            {p.recommended_leafy_vegetables?.length ? (
              <>
                <Text style={[styles.subLabel, { textAlign }]}>Vegetables</Text>
                <TagRow items={p.recommended_leafy_vegetables} />
              </>
            ) : null}
            {p.protein_recommendations?.length ? (
              <>
                <Text style={[styles.subLabel, { textAlign }]}>Protein</Text>
                <TagRow items={p.protein_recommendations} />
              </>
            ) : null}
          </CollapseBlock>
        </>
      ) : null}

      {/* ── Lifestyle (collapsible) ── */}
      {hasLifestyle ? (
        <>
          <Divider />
          <CollapseBlock icon="fitness-outline" label={t("lifestyle_wellness")}>
            {p.exercise_recommendations?.length ? (
              <>
                <Text style={[styles.subLabel, { textAlign }]}>Exercise</Text>
                <TagRow items={p.exercise_recommendations} />
              </>
            ) : null}
            {p.water_intake ? (
              <View style={[styles.waterRow, { flexDirection: rowDirection }]}>
                <Ionicons name="water-outline" size={14} color={Colors.info} />
                <Text style={[styles.body, { color: Colors.info, fontWeight: "600", marginTop: 0 }]}>
                  {p.water_intake}
                </Text>
              </View>
            ) : null}
            {p.sleep_recommendations?.length ? (
              <>
                <Text style={[styles.subLabel, { textAlign }]}>Sleep</Text>
                <View style={styles.bulletBlock}>
                  {p.sleep_recommendations.map((s, i) => (
                    <Bullet key={i} text={s} />
                  ))}
                </View>
              </>
            ) : null}
            {p.lifestyle_changes?.length ? (
              <>
                <Text style={[styles.subLabel, { textAlign }]}>Changes to Make</Text>
                <View style={styles.bulletBlock}>
                  {p.lifestyle_changes.map((s, i) => (
                    <Bullet key={i} text={s} />
                  ))}
                </View>
              </>
            ) : null}
          </CollapseBlock>
        </>
      ) : null}

      {/* ── Precautions (collapsible) ── */}
      {p.precautions?.length ? (
        <>
          <Divider />
          <CollapseBlock icon="alert-circle-outline" label={t("precautions")} iconColor={Colors.warning}>
            <View style={styles.bulletBlock}>
              {p.precautions.map((s, i) => (
                <Bullet key={i} text={s} color={Colors.warning} />
              ))}
            </View>
          </CollapseBlock>
        </>
      ) : null}

      {/* ── Medical terms (collapsible) ── */}
      {p.medical_terms_translated?.length ? (
        <>
          <Divider />
          <CollapseBlock icon="book-outline" label={t("medical_terms_explained")}>
            {p.medical_terms_translated.map((t: MedicalTerm, i: number) => (
              <View key={i} style={styles.termRow}>
                <Text style={[styles.termName, { textAlign }]}>{t.term}</Text>
                <Text style={[styles.termMeaning, { textAlign }]}>{t.simple_meaning}</Text>
              </View>
            ))}
          </CollapseBlock>
        </>
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
    padding: 18,
  },
  
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  descBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDFA',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  descText: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  body: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 23,
    marginTop: 8,
  },

  subLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },

  severityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
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
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 12,
  },
  emergencyText: {
    color: "#fff",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },

  bulletBlock: { gap: 7, marginTop: 10 },
  stepBlock: { gap: 10, marginTop: 10 },

  waterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  termRow: { marginTop: 10, gap: 2 },
  termName: { fontSize: 13, fontWeight: "700", color: Colors.text },
  termMeaning: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
});

const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 7 },
  label: { fontSize: 14, fontWeight: "700", color: Colors.text },
});

const bul = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  text: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 21 },
});

const tag = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: { fontSize: 12, fontWeight: "500", color: Colors.text },
});

const sr = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  circle: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  num: { color: "#fff", fontSize: 11, fontWeight: "700" },
  text: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22 },
});

const cb = StyleSheet.create({
  wrap: {},
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  body: { paddingTop: 4, paddingBottom: 8 },
});
