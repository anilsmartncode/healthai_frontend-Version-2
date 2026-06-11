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
import { AskAIButton } from "@/components/ai/AskAIButton";

export default function Home() {
  const { reports } = useReports();

  const hasReports    = reports.length > 0;
  const latest        = reports[0];  // sorted newest-first by reportsApi

  // ── Derive all card values from real report data ──────────────────────────
  const score          = latest?.healthScore ?? 0;
  const label          = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';
  const normalCount    = latest
    ? Math.max(0, (latest.totalValues ?? 0) - (latest.abnormalCount ?? 0) - (latest.borderlineCount ?? 0))
    : 0;
  const attentionCount = latest?.abnormalCount ?? 0;
  const lastUpdated    = latest?.date ?? '';
  // "Stable over N reports" = how many consecutive reports have healthScore >= 60
  const stableCount = (() => {
    let n = 0;
    for (const r of reports) {
      if (r.healthScore >= 60) n++;
      else break;
    }
    return n;
  })();

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
          reportsAnalyzed={reports.length}
          lastUpdated={lastUpdated}
          attentionCount={attentionCount}
          stableOverReports={stableCount}
        />

        <Button
          title="+ Upload New Report"
          onPress={() => router.push('/upload')}
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
