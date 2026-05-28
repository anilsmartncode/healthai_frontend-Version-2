import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { ReportItem } from "@/components/common/ReportItem";
import { useLang } from "@/context/Languagecontext";
import type { Report } from "@/types";

interface Props {
  reports: Report[];
}

export function RecentReports({ reports }: Props) {
  const { t } = useLang();

  return (
    <View style={styles.container}>
      {/* Header row: title left, "View All" right */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {t("recent_reports")}
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/reports")}
          hitSlop={8}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAll}>{t("view_all")}</Text>
        </Pressable>
      </View>

      {/* Report list — each item sized by content, no fixed heights */}
      {reports.length === 0 ? (
        <Text style={styles.empty}>{t("no_reports") ?? "No reports yet"}</Text>
      ) : (
        reports.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => router.push("/analysis")}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <ReportItem report={r} />
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    // No flex:1 here — container sizes to its children naturally
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flex: 1, // grows, but lets "View All" stay right
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginRight: 8,
  },
  viewAllBtn: {
    flexShrink: 0, // never squishes
  },
  viewAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  empty: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },
  pressed: { opacity: 0.75 },
});
