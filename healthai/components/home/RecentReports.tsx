import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import type { Report } from "@/types";

// ── mock ReportItem inline so the file is self-contained ──
// Replace with your real <ReportItem /> import when ready
function ReportRow({ report }: { report: Report }) {
  const statusColor =
    (report as any).status === "normal" ? "#16a34a" :
    (report as any).status === "attention" ? "#F97316" : "#6B7280";

  return (
    <View style={reportStyles.row}>
      <View style={reportStyles.iconWrap}>
        <Ionicons name="document-text-outline" size={20} color="#7C3AED" />
      </View>
      <View style={reportStyles.info}>
        <Text style={reportStyles.name} numberOfLines={1}>{(report as any).name ?? "Report"}</Text>
        <Text style={reportStyles.date} numberOfLines={1}>{(report as any).date ?? ""}</Text>
      </View>
      <View style={[reportStyles.badge, { backgroundColor: statusColor + "18" }]}>
        <Text style={[reportStyles.badgeText, { color: statusColor }]}>
          {(report as any).status ?? "—"}
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
    backgroundColor: "#fff",
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 14, fontWeight: "600", color: Colors.text },
  date: { fontSize: 12, color: Colors.textMuted },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});

// ── Empty state ──────────────────────────────────────
function EmptyReports() {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Ionicons name="folder-open-outline" size={44} color="#D1D5DB" />
      </View>
      <Text style={emptyStyles.title}>No reports found</Text>
      <Text style={emptyStyles.sub}>
        Your recent reports will appear here{"\n"}after you upload.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "700", color: Colors.text },
  sub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});

// ── Main export ──────────────────────────────────────
interface Props {
  reports: Report[];
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
        reports.slice(0, 3).map((r) => (
          <Pressable
            key={r.id}
            onPress={() => router.push("/analysis")}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <ReportRow report={r} />
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginRight: 8,
  },
  viewAllBtn: { flexShrink: 0 },
  viewAll: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});