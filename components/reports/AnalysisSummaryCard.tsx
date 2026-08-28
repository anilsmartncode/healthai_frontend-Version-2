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
import { useLang } from "@/context/Languagecontext";

interface Props {
  abnormalCount: number;
  totalCount: number;
  abnormalValues?: LabValue[];
  healthScore?: string | number;
  conditionSeverity?: string;
  conditionColor?: string;
}

function healthStatus(abnormalCount: number, t: (k: any) => string): { label: string; color: string } {
  if (abnormalCount === 0)
    return { label: t("all_normal"), color: "#16a34a" };
  if (abnormalCount <= 2)
    return { label: t("mild_risk"), color: "#16a34a" };
  if (abnormalCount <= 5)
    return { label: t("moderate_risk"), color: Colors.warning };
  return { label: t("high_risk"), color: Colors.danger };
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
  const { t, rowDirection, textAlign } = useLang();
  const allNormal = abnormalCount === 0;
  const { label: statusLabel, color: statusColor } = healthStatus(abnormalCount, t);

  // Gauge — same sizing logic as HealthScoreCard
  const SIZE = Math.min(width * 0.38, 160);
  const STROKE = SIZE * 0.07;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Score from "85/100" (or a bare number) — never call .split on a non-string
  const scoreStr =
    healthScore == null
      ? ''
      : typeof healthScore === 'string'
        ? healthScore
        : String(healthScore);
  const scoreMatch = scoreStr.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  const scoreNum = scoreMatch
    ? Math.round(parseFloat(scoreMatch[1]))
    : Number.isFinite(Number(scoreStr))
      ? Math.round(Number(scoreStr))
      : Math.round(((totalCount - abnormalCount) / Math.max(totalCount, 1)) * 100);
  const scoreMax = scoreMatch ? Math.round(parseFloat(scoreMatch[2])) : 100;
  const scorePercent = Math.min(1, Math.max(0, scoreNum / Math.max(scoreMax, 1)));
  const gaugeOffset = CIRCUMFERENCE - scorePercent * CIRCUMFERENCE;

  const gaugeColor =
    scorePercent >= 0.8
      ? "#16a34a"
      : scorePercent >= 0.6
        ? Colors.warning
        : Colors.danger;

  const scoreLabel = allNormal
    ? t("all_normal")
    : statusLabel;

  const normalCount = totalCount - abnormalCount;
  const isMultiRow = abnormalValues.length > 2;

  return (
    <Card style={styles.card}>
      {/* ── Top row ── */}
      <View style={[styles.topRow, { flexDirection: rowDirection }]}>
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
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={`${gaugeOffset}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
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
          <View style={[styles.titleRow, { flexDirection: rowDirection }]}>
            <Text style={[styles.overallTitle, { textAlign }]}>{t("report_health_score")}</Text>
            <Ionicons
              name={allNormal ? "checkmark-circle" : "alert-circle"}
              size={14}
              color={gaugeColor}
            />
          </View>
          <Text style={[styles.overallSub, { textAlign }]}>
            {t("based_on_values").replace("%s", String(totalCount))}
          </Text>

          {/* Condition severity pill */}
          {conditionSeverity ? (
            <View
              style={[
                styles.stablePill,
                { flexDirection: rowDirection },
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
            <View style={[styles.stablePill, { flexDirection: rowDirection }]}>
              <Ionicons name="pulse" size={13} color={Colors.primary} />
              <Text style={styles.stableText}>
                {allNormal ? t("all_values_in_range") : `${abnormalCount} ${t("out_of_range")}`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Stats List ── */}
      <View style={styles.statsList}>
        <View style={[styles.statItemRow, { flexDirection: rowDirection }]}>
          <View style={[styles.statLeft, { flexDirection: rowDirection }]}>
            <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="checkmark" size={14} color="#16a34a" />
            </View>
            <Text style={[styles.statLabel, { textAlign }]}>{t("normal_values")}</Text>
          </View>
          <Text style={[styles.statNum, { color: "#16a34a" }]}>{String(normalCount).padStart(2, "0")}</Text>
        </View>

        <View style={[styles.statItemRow, { flexDirection: rowDirection }]}>
          <View style={[styles.statLeft, { flexDirection: rowDirection }]}>
            <View style={[styles.statIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.danger} />
            </View>
            <Text style={[styles.statLabel, { textAlign }]}>{t("needs_attention")}</Text>
          </View>
          <Text style={[styles.statNum, { color: Colors.danger }]}>{String(abnormalCount).padStart(2, "0")}</Text>
        </View>

        <View style={[styles.statItemRow, { flexDirection: rowDirection }]}>
          <View style={[styles.statLeft, { flexDirection: rowDirection }]}>
            <View style={[styles.statIcon, { backgroundColor: "#EDE9FE" }]}>
              <Ionicons name="document-text-outline" size={14} color="#7C3AED" />
            </View>
            <Text style={[styles.statLabel, { textAlign }]}>{t("total_values")}</Text>
          </View>
          <Text style={[styles.statNum, { color: "#7C3AED" }]}>{String(totalCount).padStart(2, "0")}</Text>
        </View>
      </View>

    </Card>
  );
}

export function AbnormalChipsCard({
  abnormalValues = [],
  abnormalCount,
}: {
  abnormalValues?: LabValue[];
  abnormalCount: number;
}) {
  const { t, rowDirection, textAlign } = useLang();
  const isMultiRow = abnormalValues.length > 2;
  if (abnormalValues.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.chipsSection}>
        <View style={[styles.chipsSectionHeader, { flexDirection: rowDirection }]}>
          <View style={styles.clipboardCircle}>
            <Ionicons name="clipboard-outline" size={14} color={Colors.danger} />
          </View>
          <Text style={styles.chipsSectionTitle}>{t("abnormal_values")}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{abnormalCount}</Text>
          </View>
        </View>

        <Text style={[styles.chipsSectionSubtitle, { textAlign }]}>
          {t("abnormal_values_sub")}
        </Text>

        {isMultiRow ? (
          <View style={styles.chipGrid}>
            {(abnormalValues || []).map((v) => (
              <View key={v.name} style={styles.chip}>
                <Ionicons name="water" size={11} color={Colors.danger} />
                <Text style={styles.chipName}>{v.name}</Text>
                <View style={styles.chipDivider} />
                <Text style={styles.chipStatus}>
                  {String(v.status || 'unknown').charAt(0).toUpperCase() +
                    String(v.status || 'unknown').slice(1)}
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
                  {String(v.status || 'unknown').charAt(0).toUpperCase() +
                    String(v.status || 'unknown').slice(1)}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
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

  // Stats List
  statsList: { flexDirection: "column", gap: 10, marginBottom: 14 },
  statItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statIcon: {
    width: 26,
    height: 26,
    flex: 0,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: { fontSize: 15, fontWeight: "700", color: Colors.text },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
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
  chipsSectionSubtitle: { fontSize: 11, color: Colors.textMuted, lineHeight: 15, marginBottom: 2 },
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