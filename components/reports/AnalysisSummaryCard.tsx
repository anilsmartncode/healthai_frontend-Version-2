import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Colors, Radius } from "@/constants/Colors";
import { Svg, Circle } from "react-native-svg";
import type { LabValue } from "@/types";

interface Props {
  abnormalCount: number;
  totalCount: number;
  abnormalValues?: LabValue[];
  healthScore?: string;
  conditionSeverity?: string;
  conditionColor?: string;
}

function healthStatus(abnormalCount: number): { label: string; color: string } {
  if (abnormalCount === 0)
    return { label: "All Normal", color: "#16a34a" };
  if (abnormalCount <= 2)
    return { label: "Mild Risk", color: "#16a34a" };
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
  const { width } = useWindowDimensions();
  const allNormal = abnormalCount === 0;
  const { label: statusLabel, color: statusColor } = healthStatus(abnormalCount);

  // Gauge — same sizing logic as HealthScoreCard
  const SIZE = Math.min(width * 0.38, 160);
  const STROKE = SIZE * 0.07;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Score from "85/100" or fallback from abnormal ratio
  const scoreNum = healthScore
    ? parseInt(healthScore.split("/")[0])
    : Math.round(((totalCount - abnormalCount) / Math.max(totalCount, 1)) * 100);
  const scoreMax = healthScore ? parseInt(healthScore.split("/")[1]) : 100;
  const scorePercent = scoreNum / scoreMax;
  const gaugeOffset = CIRCUMFERENCE - scorePercent * CIRCUMFERENCE;

  const gaugeColor =
    scorePercent >= 0.8
      ? "#16a34a"
      : scorePercent >= 0.6
        ? Colors.warning
        : Colors.danger;

  const scoreLabel = allNormal
    ? "All Normal"
    : statusLabel;

  const normalCount = totalCount - abnormalCount;
  const isMultiRow = abnormalValues.length > 2;

  return (
    <Card style={styles.card}>
      {/* ── Top row ── */}
      <View style={styles.topRow}>
        {/* Gauge */}
        <View
          style={{
            width: SIZE,
            height: SIZE,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="#E5E7EB"
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={gaugeColor}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={gaugeOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>

          {/* Center text over SVG */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.gaugeCenterInner}>
              {/* Icon badge */}
              <View
                style={[
                  styles.iconBadge,
                  { top: SIZE * 0.04, left: SIZE * 0.04 },
                ]}
              >
                <Ionicons
                  name={allNormal ? "checkmark-circle" : "warning"}
                  size={SIZE * 0.14}
                  color={gaugeColor}
                />
              </View>
              <Text style={[styles.scoreNum, { fontSize: SIZE * 0.26 }]}>
                {scoreNum}
              </Text>
              <Text
                style={[
                  styles.scoreLabel,
                  { color: gaugeColor, fontSize: SIZE * 0.095 },
                ]}
              >
                {scoreLabel}
              </Text>
              <Text style={[styles.scoreOf, { fontSize: SIZE * 0.08 }]}>
                /100
              </Text>
            </View>
          </View>
        </View>

        {/* Right text */}
        <View style={styles.rightCol}>
          <View style={styles.titleRow}>
            <Text style={styles.overallTitle}>Report Health Score</Text>
            <Ionicons
              name={allNormal ? "checkmark-circle" : "alert-circle"}
              size={14}
              color={gaugeColor}
            />
          </View>
          <Text style={styles.overallSub}>
            Based on {totalCount} values in this report
          </Text>

          {/* Condition severity pill */}
          {conditionSeverity ? (
            <View
              style={[
                styles.stablePill,
                {
                  backgroundColor: allNormal ? "#EFF6FF" : "#FFF7ED",
                },
              ]}
            >
              {conditionColor ? (
                <Text style={{ fontSize: 12 }}>{conditionColor}</Text>
              ) : (
                <Ionicons
                  name="pulse"
                  size={13}
                  color={allNormal ? Colors.primary : Colors.warning}
                />
              )}
              <Text
                style={[
                  styles.stableText,
                  {
                    color: allNormal ? Colors.primary : Colors.warning,
                  },
                ]}
              >
                {conditionSeverity}
              </Text>
            </View>
          ) : (
            <View style={styles.stablePill}>
              <Ionicons name="pulse" size={13} color={Colors.primary} />
              <Text style={styles.stableText}>
                {allNormal ? "All values in range" : `${abnormalCount} out of range`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        {/* Normal values */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]}>
            <Ionicons name="checkmark" size={16} color="#16a34a" />
          </View>
          <View style={styles.statText}>
            <Text style={[styles.statNum, { color: "#16a34a" }]}>
              {String(normalCount).padStart(2, "0")}
            </Text>
            <Text style={styles.statLabel}>values in{"\n"}normal range</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        {/* Abnormal values */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#FEE2E2" }]}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          </View>
          <View style={styles.statText}>
            <Text style={[styles.statNum, { color: Colors.danger }]}>
              {String(abnormalCount).padStart(2, "0")}
            </Text>
            <Text style={styles.statLabel}>values{"\n"}out of range</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        {/* Total count */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#EDE9FE" }]}>
            <Ionicons name="document-text-outline" size={16} color="#7C3AED" />
          </View>
          <View style={styles.statText}>
            <Text style={[styles.statNum, { color: "#7C3AED" }]}>
              {String(totalCount).padStart(2, "0")}
            </Text>
            <Text style={styles.statLabel}>total{"\n"}markers</Text>
          </View>
        </View>
      </View>

      {/* ── Abnormal chips banner ── */}
      {abnormalValues.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.chipsSection}>
            <View style={styles.chipsSectionHeader}>
              <View style={styles.clipboardCircle}>
                <Ionicons name="clipboard-outline" size={14} color={Colors.danger} />
              </View>
              <Text style={styles.chipsSectionTitle}>Abnormal Values</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{abnormalCount}</Text>
              </View>
            </View>

            {isMultiRow ? (
              <View style={styles.chipGrid}>
                {(abnormalValues || []).map((v) => (
                  <View key={v.name} style={styles.chip}>
                    <Ionicons name="water" size={11} color={Colors.danger} />
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
                contentContainerStyle={{ gap: 6, paddingTop: 2 }}
              >
                {(abnormalValues || []).map((v) => (
                  <View key={v.name} style={styles.chip}>
                    <Ionicons name="water" size={11} color={Colors.danger} />
                    <Text style={styles.chipName}>{v.name}</Text>
                    <View style={styles.chipDivider} />
                    <Text style={styles.chipStatus}>
                      {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0, padding: 16 },

  // Top row — mirrors HealthScoreCard
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  // Gauge center
  gaugeCenterInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadge: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 100,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreNum: { fontWeight: "800", color: Colors.text },
  scoreLabel: { fontWeight: "700" },
  scoreOf: { color: Colors.textMuted },

  // Right col
  rightCol: { flex: 1, gap: 8 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  overallTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    flexShrink: 1,
  },
  overallSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  stablePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  stableText: { fontSize: 12, fontWeight: "600", color: Colors.primary },

  // Divider
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 14 },

  // Stats row — exact mirror of HealthScoreCard
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { flex: 1 },
  statIcon: {
    width: 34,
    aspectRatio: 1,
    flex: 0,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: { fontSize: 16, fontWeight: "700", color: Colors.text },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    lineHeight: 14,
    flexShrink: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },

  // Chips section (replaces attention banner)
  chipsSection: { gap: 8 },
  chipsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clipboardCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  chipsSectionTitle: { fontSize: 12, fontWeight: "700", color: Colors.text, flex: 1 },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countText: { fontSize: 10, fontWeight: "700", color: "#fff" },

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
  chipDivider: { width: 1, height: 11, backgroundColor: Colors.danger + "44" },
  chipStatus: { fontSize: 11, fontWeight: "700", color: Colors.danger },
});