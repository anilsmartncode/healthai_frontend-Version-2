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
  /** When true, renders the "no reports yet" empty state (Image 1) */
  hasReports?: boolean;
  attentionReportId?: string;
  onAttentionPress?: () => void;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// ── Empty state (no reports uploaded yet) ── Image 1
function EmptyHealthScore({ onUpload }: { onUpload: () => void }) {
  const { width } = useWindowDimensions();
  const SIZE = Math.min(width * 0.38, 152);
  const STROKE = SIZE * 0.07;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  return (
    <Card style={styles.card}>
      {/* ── Top row ── */}
      <View style={styles.topRow}>
        {/* Empty gauge — no fill, dash in center */}
        <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              stroke="#E5E7EB" strokeWidth={STROKE} fill="none"
            />
            {/* tiny filled arc to show ~5% so ring doesn't look broken */}
            <Circle
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              stroke="#D1D5DB" strokeWidth={STROKE} fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * 0.97}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>
          {/* Center text */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.gaugeCenterInner}>
              <Text style={[styles.scoreNum, { fontSize: SIZE * 0.18, color: "#9CA3AF" }]}>—</Text>
              <Text style={[styles.scoreLabel, { color: "#9CA3AF", fontSize: SIZE * 0.09 }]}>
                Health Score
              </Text>
            </View>
          </View>
        </View>

        {/* Right col */}
        <View style={styles.rightCol}>
          <View style={styles.titleRow}>
            <Text style={styles.overallTitle}>Overall Health Score</Text>
            <Ionicons name="sparkles" size={14} color="#60A5FA" />
          </View>
          <Text style={styles.overallSub}>Based on your uploaded reports</Text>
          {/* Upload pill CTA */}
          <Pressable style={styles.uploadPill} onPress={onUpload}>
            <Ionicons name="pulse" size={13} color={Colors.primary} />
            <Text style={styles.uploadPillText}>Upload a report to get health score</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Empty stats row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]}>
            <Ionicons name="checkmark" size={16} color="#16a34a" />
          </View>
          <View style={styles.statText}>
            <Text style={[styles.statNum, { color: "#9CA3AF" }]}>—</Text>
            <Text style={styles.statLabel}>values in{"\n"}normal range</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#EDE9FE" }]}>
            <Ionicons name="document-text-outline" size={16} color="#7C3AED" />
          </View>
          <View style={styles.statText}>
            <Text style={[styles.statNum, { color: "#9CA3AF" }]}>—</Text>
            <Text style={styles.statLabel}>Reports{"\n"}analyzed</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
            <Ionicons name="calendar-outline" size={16} color="#2563EB" />
          </View>
          <View style={styles.statText}>
            <Text style={styles.statLabel}>Last{"\n"}updated</Text>
            <Text style={[styles.statNum, { color: "#9CA3AF", fontSize: 13 }]}>—</Text>
          </View>
        </View>
      </View>

      {/* ── Orange upload prompt banner ── */}
      <Pressable style={styles.attentionBanner} onPress={onUpload}>
        <View style={styles.attentionIcon}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
        </View>
        <Text style={styles.attentionText}>Upload a report to get health score</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </Pressable>
    </Card>
  );
}

// ── Filled state (reports uploaded) ── Image 2
function FilledHealthScore({
  score = 0,
  label = "—",
  normalCount = 0,
  reportsAnalyzed = 0,
  lastUpdated = "—",
  attentionCount = 0,
  stableOverReports = 0,
  attentionReportId,
  onAttentionPress,
}: Omit<Props, "hasReports">) {
  const { width } = useWindowDimensions();
  const SIZE = Math.min(width * 0.38, 152);
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
        <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
          <Svg width={SIZE} height={SIZE}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              stroke="#E5E7EB" strokeWidth={STROKE} fill="none" />
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              stroke={scoreColor} strokeWidth={STROKE} fill="none"
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
              {/* Shield badge */}
              <View style={[styles.shieldBadge, { top: SIZE * 0.04, left: SIZE * 0.04 }]}>
                <Ionicons name="shield-checkmark" size={SIZE * 0.14} color={scoreColor} />
              </View>
              <Text style={[styles.scoreNum, { fontSize: SIZE * 0.26 }]}>{score}</Text>
              <Text style={[styles.scoreLabel, { color: scoreColor, fontSize: SIZE * 0.095 }]}>
                {label}
              </Text>
              <Text style={[styles.scoreOf, { fontSize: SIZE * 0.08 }]}>/100</Text>
            </View>
          </View>
        </View>

        {/* Right col */}
        <View style={styles.rightCol}>
          <View style={styles.titleRow}>
            <Text style={styles.overallTitle}>Overall Health Score</Text>
            <Ionicons name="sparkles" size={14} color="#60A5FA" />
          </View>
          <Text style={styles.overallSub}>Based on all uploaded reports</Text>
          <View style={styles.stablePill}>
            <Ionicons name="pulse" size={13} color={Colors.primary} />
            <Text style={styles.stableText}>{stableOverReports > 1 ? `Stable over ${stableOverReports} reports` : stableOverReports === 1 ? "Based on 1 report" : "First report"}</Text>
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
            <Text style={[styles.statNum, { color: Colors.text, fontSize: 13 }]}>
              {formatDate(lastUpdated)}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Attention banner ── */}
      {attentionCount > 0 && (
        <Pressable
          style={styles.attentionBanner}
          onPress={onAttentionPress}
        >
          <View style={styles.attentionIcon}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.attentionTop}>Health Alerts:</Text>
            <Text style={styles.attentionBottom}>{attentionCount} reports need attention</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>
      )}
    </Card>
  );
}

// ── Exported wrapper — picks empty vs filled ──────────
export function HealthScoreCard({
  score = 0,
  label = "—",
  normalCount = 0,
  reportsAnalyzed = 0,
  lastUpdated = "—",
  attentionCount = 0,
  stableOverReports = 0,
  hasReports = false,
  attentionReportId,
  onAttentionPress,
}: Props) {
  if (!hasReports) {
    return <EmptyHealthScore onUpload={() => router.push("/upload")} />;
  }
  return (
    <FilledHealthScore
      score={score}
      label={label}
      normalCount={normalCount}
      reportsAnalyzed={reportsAnalyzed}
      lastUpdated={lastUpdated}
      attentionCount={attentionCount}
      stableOverReports={stableOverReports}
      attentionReportId={attentionReportId}
      onAttentionPress={onAttentionPress}
    />
  );
}

const styles = StyleSheet.create({
  card: { gap: 0, padding: 16 },

  topRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },

  gaugeCenterInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  shieldBadge: {
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

  rightCol: { flex: 1, gap: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  overallTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, flexShrink: 1 },
  overallSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },

  // Filled state stable pill
  stablePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  stableText: { fontSize: 12, fontWeight: "600", color: Colors.primary },

  // Empty state upload pill
  uploadPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  uploadPillText: { fontSize: 11, fontWeight: "600", color: Colors.primary, flex: 1, flexWrap: "wrap" },

  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 14 },

  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { flex: 1 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statNum: { fontSize: 16, fontWeight: "700", color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textMuted, lineHeight: 14, flexShrink: 1 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border, marginHorizontal: 2 },

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
  attentionText: { flex: 1, fontSize: 13, fontWeight: "500", color: "#92400E" },
  attentionTop: { fontSize: 12, color: Colors.textMuted },
  attentionBottom: { fontSize: 13, fontWeight: "700", color: "#F97316" },
});