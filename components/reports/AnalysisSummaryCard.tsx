import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Colors, Radius } from "@/constants/Colors";
import type { LabValue } from "@/types";

interface Props {
  abnormalCount: number;
  totalCount: number;
  abnormalValues?: LabValue[];
  // New: from parsed summary
  healthScore?: string;
  conditionSeverity?: string;
  conditionColor?: string;
}

function healthStatus(abnormalCount: number): { label: string; color: string } {
  if (abnormalCount === 0)
    return { label: "All Normal", color: Colors.success };
  if (abnormalCount <= 2) return { label: "Mild Risk", color: Colors.success };
  if (abnormalCount <= 5)
    return { label: "Moderate Risk", color: Colors.warning };
  return { label: "High Risk", color: Colors.danger };
}

export function AnalysisSummaryCard({
  abnormalCount,
  totalCount,
  abnormalValues = [],
  healthScore,
  conditionSeverity,
  conditionColor,
}: Props) {
  const allNormal = abnormalCount === 0;
  const { label: statusLabel, color: statusColor } =
    healthStatus(abnormalCount);
  const isMultiRow = abnormalValues.length > 2;

  // Parse health score number for progress bar (e.g. "85/100" → 85)
  const scoreNum = healthScore ? parseInt(healthScore.split("/")[0]) : null;
  const scoreMax = healthScore ? parseInt(healthScore.split("/")[1]) : 100;
  const scorePercent = scoreNum != null ? scoreNum / scoreMax : null;

  return (
    <Card style={styles.card}>
      {/* Top section */}
      <View style={styles.top}>
        <View style={styles.left}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: allNormal ? "#E8F5E9" : "#FFF0E6" },
            ]}
          >
            <Ionicons
              name={allNormal ? "checkmark-circle" : "warning"}
              size={28}
              color={allNormal ? Colors.success : Colors.warning}
            />
          </View>
          <View style={styles.textBlock}>
            <View
              style={[
                styles.pill,
                { backgroundColor: allNormal ? "#E8F5E9" : "#FFF0E6" },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: allNormal ? Colors.success : Colors.warning },
                ]}
              >
                {allNormal ? "ALL NORMAL" : "ATTENTION NEEDED"}
              </Text>
            </View>
            <Text style={styles.title}>
              {allNormal ? (
                <Text style={{ color: Colors.success }}>Good Health</Text>
              ) : (
                <>
                  <Text style={{ color: Colors.warning }}>
                    {abnormalCount} Values{" "}
                  </Text>
                  <Text style={{ color: Colors.text }}>Need Attention</Text>
                </>
              )}
            </Text>
            <Text style={styles.subtitle}>
              {allNormal
                ? "Your report looks good overall."
                : `${abnormalCount} of ${totalCount} values outside normal range.`}
            </Text>

            {/* Condition severity from AI */}
            {conditionSeverity ? (
              <View style={styles.severityRow}>
                {conditionColor ? (
                  <Text style={styles.conditionEmoji}>{conditionColor}</Text>
                ) : null}
                <Text style={styles.severityText}>{conditionSeverity}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Right — health status */}
        <View style={styles.right}>
          <View style={styles.heartCircle}>
            <Ionicons name="pulse" size={18} color={Colors.success} />
          </View>
          <Text style={styles.healthLabel}>Health Status</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
          </View>
        </View>
      </View>

      {/* Health Score bar */}
      {scorePercent != null ? (
        <>
          <View style={styles.divider} />
          <View style={styles.scoreSection}>
            <View style={styles.scoreLabelRow}>
              <Ionicons name="heart" size={13} color={Colors.success} />
              <Text style={styles.scoreLabel}>Health Score</Text>
              <Text style={styles.scoreValue}>{healthScore}</Text>
            </View>
            <View style={styles.scoreTrack}>
              <View
                style={[
                  styles.scoreFill,
                  {
                    width: `${Math.round(scorePercent * 100)}%` as any,
                    backgroundColor:
                      scorePercent >= 0.8
                        ? Colors.success
                        : scorePercent >= 0.6
                          ? Colors.warning
                          : Colors.danger,
                  },
                ]}
              />
            </View>
          </View>
        </>
      ) : null}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom — single row if ≤2, two-col grid if >2 */}
      <View style={isMultiRow ? styles.bottomColumn : styles.bottomRow}>
        {/* Abnormal label */}
        <View style={styles.abnormalLabel}>
          <View style={styles.clipboardCircle}>
            <Ionicons
              name="clipboard-outline"
              size={16}
              color={Colors.danger}
            />
          </View>
          <View>
            <View style={styles.abnormalTitleRow}>
              <Text style={styles.abnormalTitle}>Abnormal</Text>
              {abnormalCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{abnormalCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.abnormalSub}>Outside range</Text>
          </View>
        </View>

        {/* Chips */}
        {abnormalValues.length > 0 &&
          (isMultiRow ? (
            <View style={styles.chipGrid}>
              {abnormalValues.map((v) => (
                <View key={v.name} style={styles.chip}>
                  <Ionicons name="water" size={12} color={Colors.danger} />
                  <Text style={styles.chipName}>{v.name}</Text>
                  <View style={styles.chipDivider} />
                  <Text style={styles.chipStatus}>
                    {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chips}
              contentContainerStyle={{ gap: 6 }}
            >
              {abnormalValues.map((v) => (
                <View key={v.name} style={styles.chip}>
                  <Ionicons name="water" size={12} color={Colors.danger} />
                  <Text style={styles.chipName}>{v.name}</Text>
                  <View style={styles.chipDivider} />
                  <Text style={styles.chipStatus}>
                    {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0, padding: 14 },

  // Top
  top: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  left: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1, gap: 3 },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  pillText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  title: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  subtitle: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  conditionEmoji: { fontSize: 12 },
  severityText: { fontSize: 11, fontWeight: "600", color: Colors.warning },

  // Right
  right: { alignItems: "center", gap: 3, minWidth: 72 },
  heartCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  healthLabel: { fontSize: 10, color: Colors.textMuted },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  dot: { width: 5, height: 5, borderRadius: 3 },

  // Health Score
  scoreSection: { gap: 6 },
  scoreLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  scoreLabel: { flex: 1, fontSize: 12, fontWeight: "600", color: Colors.text },
  scoreValue: { fontSize: 12, fontWeight: "700", color: Colors.success },
  scoreTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: "hidden",
  },
  scoreFill: { height: 6, borderRadius: 3 },

  // Divider
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },

  // Bottom layouts
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bottomColumn: { flexDirection: "column", gap: 10 },

  // Abnormal label
  abnormalLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  clipboardCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  abnormalTitleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  abnormalTitle: { fontSize: 12, fontWeight: "700", color: Colors.text },
  abnormalSub: { fontSize: 10, color: Colors.textMuted },
  countBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  // Chips
  chips: { flex: 1 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEE2E2",
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipName: { fontSize: 11, fontWeight: "600", color: Colors.text },
  chipDivider: { width: 1, height: 12, backgroundColor: Colors.danger + "44" },
  chipStatus: { fontSize: 11, fontWeight: "700", color: Colors.danger },
});
