import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import type { ReportListItem } from "@/services/reportsApi";

interface CategoryStyle {
  icon: string;
  bg: string;
  color: string;
}

function getCategoryStyle(category?: string, fileType?: string): CategoryStyle {
  const cat = category ? category.toLowerCase() : "";
  if (cat.includes("cbc") || cat.includes("blood")) {
    return { icon: "water", bg: "#FEE2E2", color: "#EF4444" }; // Red
  }
  if (cat.includes("lipid") || cat.includes("cholesterol")) {
    return { icon: "heart", bg: "#FCE7F3", color: "#EC4899" }; // Pink
  }
  if (cat.includes("thyroid")) {
    return { icon: "flask", bg: "#FEF3C7", color: "#D97706" }; // Amber
  }
  if (cat.includes("diabet") || cat.includes("hba1c")) {
    return { icon: "pulse", bg: "#ECFDF5", color: "#10B981" }; // Emerald
  }
  if (cat.includes("vitamin")) {
    return { icon: "sunny", bg: "#FEF9C3", color: "#EAB308" }; // Yellow
  }
  if (fileType === "IMAGE") {
    return { icon: "image", bg: "#E0F2FE", color: "#0284C7" }; // Light Blue
  }
  return { icon: "document-text", bg: "#F3E8FF", color: "#8B5CF6" }; // Purple
}

function ReportRow({ report }: { report: ReportListItem }) {
  const catStyle = getCategoryStyle(report.category || report.reportType, report.fileType);
  const isGood = report.status === "good";
  const statusColor = isGood ? "#16A34A" : "#F97316";
  const statusBg = isGood ? "#DCFCE7" : "#FFEDD5";

  return (
    <View style={reportStyles.row}>
      <View style={[reportStyles.iconWrap, { backgroundColor: catStyle.bg }]}>
        <Ionicons name={catStyle.icon as any} size={20} color={catStyle.color} />
      </View>

      <View style={reportStyles.info}>
        <Text style={reportStyles.name} numberOfLines={1}>
          {report.title}
        </Text>
        <View style={reportStyles.metaRow}>
          <Text style={reportStyles.date} numberOfLines={1}>{report.date}</Text>
          <Text style={reportStyles.dotDivider}>•</Text>
          <Text style={reportStyles.lab} numberOfLines={1}>
            {report.labName || "General"}
          </Text>
          <View style={reportStyles.typeBadge}>
            <Text style={reportStyles.typeText}>{report.fileType}</Text>
          </View>
        </View>
      </View>

      <View style={[reportStyles.badge, { backgroundColor: statusBg }]}>
        <Text style={[reportStyles.badgeText, { color: statusColor }]}>
          {report.healthLabel}
        </Text>
      </View>
    </View>
  );
}

const reportStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  dotDivider: {
    fontSize: 12,
    color: Colors.border,
  },
  lab: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
    maxWidth: 75,
  },
  typeBadge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  typeText: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});

// ── Empty state ──────────────────────────────────────
function EmptyReports() {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Ionicons name="folder-open-outline" size={40} color="#94A3B8" />
      </View>
      <Text style={emptyStyles.title}>No reports found</Text>
      <Text style={emptyStyles.sub}>
        Your recent reports will appear here after you upload.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  sub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});

// ── Main export ──────────────────────────────────────
interface Props {
  reports: ReportListItem[];
}

export function RecentReports({ reports }: Props) {
  const { t } = useLang();

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {t("recent_reports")}
        </Text>
        {reports.length > 0 && (
          <Pressable
            onPress={() => router.push("/(tabs)/reports")}
            hitSlop={8}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAll}>{t("view_all")}</Text>
          </Pressable>
        )}
      </View>

      {/* Empty or filled list */}
      {reports.length === 0 ? (
        <EmptyReports />
      ) : (
        <View style={styles.list}>
          {reports.slice(0, 3).map((r) => (
            <Pressable
              key={r.id}
              onPress={() =>
                router.push({ pathname: "/report-detail", params: { id: r.id } })
              }
              style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
            >
              <ReportRow report={r} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, width: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginRight: 8,
  },
  viewAllBtn: { flexShrink: 0 },
  viewAll: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  list: { gap: 10, width: "100%" },
  pressable: { width: "100%" },
  pressed: { opacity: 0.8 },
});