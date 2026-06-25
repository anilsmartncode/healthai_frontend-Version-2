import { View, ScrollView, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radius } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { useReports } from "@/hooks/useReports";

import { HomeHeader }      from "@/components/home/HomeHeader";
import { HealthScoreCard } from "@/components/home/Healthscorecard";
import { FamilyHealthCard } from "@/components/home/Familyhealthcard";
import { RecentReports }   from "@/components/home/RecentReports";
import { AskAIButton } from "@/components/ai/AskAIButton";


function EmptyState() {
  return (
    <View style={emptyStyles.wrap}>
      <View style={emptyStyles.iconWrap}>
        <Ionicons name="document-text-outline" size={44} color={Colors.primary} />
      </View>
      <Text style={emptyStyles.title}>Welcome to HealthAI</Text>
      <Text style={emptyStyles.sub}>
        Upload your first health report to get your personalized health score, AI insights, and medicine analysis.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingVertical: 32, gap: 12, paddingHorizontal: 16 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#E1F5EE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#9FE1CB' },
  title:    { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  sub:      { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});

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

        {hasReports ? <RecentReports reports={reports} /> : <EmptyState />}
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
