import { View, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radius } from "@/constants/Colors";
import { Button } from "@/components/ui/Button";
import { useReports } from "@/hooks/useReports";

import { HomeHeader }      from "@/components/home/HomeHeader";
import { HealthScoreCard } from "@/components/home/Healthscorecard";
import { FamilyHealthCard } from "@/components/home/Familyhealthcard";
import { RecentReports }   from "@/components/home/RecentReports";

// ── MOCK data — delete entire block when real API is ready ────────────────────
// 🔴 REAL: remove MOCK_SCORE; derive all values from reports[0] (see REAL block below)
const MOCK_SCORE = {
  score:            82,
  label:            "Good",
  normalCount:      16,
  attentionCount:   2,
  lastUpdated:      "Just now",
  stableOverReports: 6,
};
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  // 🔴 REAL: delete these two lines and uncomment the REAL block below
  const { data: reports = [] } = useReports();
  const hasReports = reports.length > 0;  // 🟢 MOCK: empty until upload adds to list

  // 🔴 REAL: uncomment this block when API is ready
  /*
  const { data: reports = [] } = useReports();
  const latest     = reports[0];
  const hasReports = reports.length > 0;

  const score             = latest?.score            ?? 0;
  const label             = latest?.label            ?? "";
  const normalCount       = latest?.normalCount      ?? 0;
  const attentionCount    = latest?.attentionCount   ?? 0;
  const lastUpdated       = latest?.lastUpdated      ?? "";
  const stableOverReports = reports.length;
  */

  // 🟢 MOCK — these come from MOCK_SCORE; replace with real vars above when API ready
  const score             = MOCK_SCORE.score;
  const label             = MOCK_SCORE.label;
  const normalCount       = MOCK_SCORE.normalCount;
  const attentionCount    = MOCK_SCORE.attentionCount;
  const lastUpdated       = MOCK_SCORE.lastUpdated;
  const stableOverReports = MOCK_SCORE.stableOverReports;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <HomeHeader attentionCount={hasReports ? attentionCount : 0} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <HealthScoreCard
          hasReports={hasReports}
          score={score}
          label={label}
          normalCount={normalCount}
          reportsAnalyzed={reports.length || stableOverReports}
          lastUpdated={lastUpdated}
          attentionCount={attentionCount}
          stableOverReports={stableOverReports}
        />

        <Button
          title="+ Upload New Report"
          onPress={() => router.push("/upload")}
          style={styles.uploadBtn}
        />

        <FamilyHealthCard />

        <RecentReports reports={reports} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 14,
    flexGrow: 1,
  },
  uploadBtn: {
    borderRadius: Radius.lg,
    paddingVertical: 16,
  },
});