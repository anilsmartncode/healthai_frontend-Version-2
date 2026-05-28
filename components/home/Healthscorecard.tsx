import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { Svg, Circle } from "react-native-svg";
import { router } from "expo-router";

interface Props {
  score?: number;
  label?: string;
  normalCount?: number;
  reportsAnalyzed?: number;
  lastUpdated?: string;
  attentionCount?: number;
  stableOverReports?: number;
}

export function HealthScoreCard({
  score = 82,
  label = "Good Overall",
  normalCount = 16,
  reportsAnalyzed = 6,
  lastUpdated = "2 mins ago",
  attentionCount = 2,
  stableOverReports = 6,
}: Props) {
  const { width } = useWindowDimensions();

  // Gauge size = 38% of screen width, capped for tablets
  const SIZE = Math.min(width * 0.38, 160);
  const STROKE = SIZE * 0.07;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  const scoreColor =
    score >= 80 ? "#16a34a" : score >= 60 ? Colors.warning : Colors.danger;

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
              stroke={scoreColor}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={progress}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>

          {/* Center text over SVG */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.gaugeCenterInner}>
              {/* Shield */}
              <View
                style={[
                  styles.shieldBadge,
                  { top: SIZE * 0.04, left: SIZE * 0.04 },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={SIZE * 0.14}
                  color={scoreColor}
                />
              </View>
              <Text style={[styles.scoreNum, { fontSize: SIZE * 0.26 }]}>
                {score}
              </Text>
              <Text
                style={[
                  styles.scoreLabel,
                  { color: scoreColor, fontSize: SIZE * 0.095 },
                ]}
              >
                {label}
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
            <Text style={styles.overallTitle}>Overall Health Score</Text>
            <Ionicons name="sparkles" size={14} color="#60A5FA" />
          </View>
          <Text style={styles.overallSub}>Based on all uploaded reports</Text>
          <View style={styles.stablePill}>
            <Ionicons name="pulse" size={13} color={Colors.primary} />
            <Text style={styles.stableText}>
              Stable over {stableOverReports} reports
            </Text>
          </View>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
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

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#EDE9FE" }]}>
            <Ionicons name="document-text-outline" size={16} color="#7C3AED" />
          </View>
          <View style={styles.statText}>
            <Text style={[styles.statNum, { color: "#7C3AED" }]}>
              {String(reportsAnalyzed).padStart(2, "0")}
            </Text>
            <Text style={styles.statLabel}>reports{"\n"}analyzed</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
            <Ionicons name="calendar-outline" size={16} color="#2563EB" />
          </View>
          <View style={styles.statText}>
            <Text style={styles.statLabel}>Last Updated</Text>
            <Text
              style={[styles.statNum, { color: Colors.text, fontSize: 13 }]}
            >
              {lastUpdated}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Attention banner ── */}
      {attentionCount > 0 && (
        <Pressable
          style={styles.attentionBanner}
          onPress={() => router.push("/analysis")}
        >
          <View style={styles.attentionIcon}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.attentionTop}>Current Report:</Text>
            <Text style={styles.attentionBottom}>
              {attentionCount} findings need attention
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0, padding: 16 },

  // Top
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  // Gauge center
  gaugeCenterInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  shieldBadge: {
    position: "absolute",
    width: "auto",
    backgroundColor: "#fff",
    borderRadius: 100,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreNum: { fontWeight: "800", color: Colors.text, lineHeight: undefined },
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

  // Stats
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { flex: 1 },
  statIcon: {
    aspectRatio: 1,
    flex: 0,
    width: 34,
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

  // Attention
  attentionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF7ED",
    borderRadius: Radius.md,
    padding: 12,
  },
  attentionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  attentionTop: { fontSize: 12, color: Colors.textMuted },
  attentionBottom: { fontSize: 13, fontWeight: "700", color: "#F97316" },
});
