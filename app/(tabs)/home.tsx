import { View, ScrollView, StyleSheet, Text, Alert, Pressable, RefreshControl, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radius } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { useReports } from "@/hooks/useReports";
import { useEffect, useState, useRef } from "react";
import { reportsApi } from "@/services/reportsApi";
import { useAuth } from "@/context/AuthContext";
import { useMedicines } from "@/hooks/useMedicines";
import { useLang } from "@/context/Languagecontext";

import { HomeHeader } from "@/components/home/HomeHeader";
import { HealthScoreCard } from "@/components/home/Healthscorecard";
import { FamilyHealthCard } from "@/components/home/Familyhealthcard";
import { RecentReports } from "@/components/home/RecentReports";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { QuickActions } from "@/components/home/QuickActions";
import { HealthTipCard } from "@/components/home/HealthTipCard";
import { HealthMetricsSection } from "@/components/home/HealthMetricsSection";
import { RiskIndicatorsSection } from "@/components/home/RiskIndicatorsSection";
import { MedicineReminderCard } from "@/components/home/MedicineReminderCard";
import { ShareAppCard } from "@/components/home/ShareAppCard";
import { ChatInputBar } from "@/components/ui/ChatInputBar";


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
  wrap: { alignItems: 'center', paddingVertical: 32, gap: 12, paddingHorizontal: 16 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#E1F5EE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#9FE1CB' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  sub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});

export default function Home() {
  const { reports, refreshing, refresh } = useReports();
  const [scorecard, setScorecard] = useState<{
    overallScore: number;
    scoreLabel: string;
    trend: string;
    lastUpdated: string;
    totalReports: number;
    aiSummary: string;
    averageMetrics: any[];
    riskIndicators: any[];
  } | null>(null);
  const { phone } = useAuth();
  const [navigating, setNavigating] = useState(false);
  const { todayBanner } = useMedicines();
  const { t } = useLang();

  useEffect(() => {
    reportsApi.getScorecard().then(s => {
      if (s) setScorecard(s);
    });
  }, [reports]);

  const hasReports = reports.length > 0;
  const latest = reports[0];  // sorted newest-first by reportsApi

  // ── Derive overall card values from real report data ──────────────────────
  const score = latest?.healthScore ?? 0;
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';
  const lastUpdated = latest?.date ?? '';

  // Compute overall normal values across all reports
  const overallNormalCount = reports.reduce((acc, r) => {
    const abnormal = r.status === 'attention' ? Math.max(1, r.abnormalCount ?? 0) : (r.abnormalCount ?? 0);
    const normal = (r.totalValues ?? 0) - abnormal - (r.borderlineCount ?? 0);
    return acc + Math.max(0, normal);
  }, 0);

  // Compute overall attention findings count
  const overallAttentionCount = reports.reduce((acc, r) => {
    if (r.status === 'attention') {
      return acc + Math.max(1, r.abnormalCount ?? 0);
    }
    return acc;
  }, 0);

  // Find the latest report requiring attention for navigation
  const attentionReport = reports.find(r => r.status === 'attention');
  const attentionReportId = attentionReport?.id;

  const handleAttentionPress = async () => {
    if (!scorecard || navigating) return;
    setNavigating(true);
    try {
      // Map scorecard.averageMetrics to LabValue format expected by analysis.tsx
      const mappedValues = (scorecard.averageMetrics || []).map((m: any) => ({
        name: m.testName || 'Unknown',
        value: String(m.value || '-'),
        unit: m.unit || '',
        range: m.normalRange || '-',
        status: m.status ? m.status.toLowerCase() : 'unknown',
        meaning: m.simpleMeaning || '',
      }));

      const syntheticSummary = JSON.stringify({
        ai_summary: scorecard.aiSummary || 'No AI summary available.',
        health_score: `${scorecard.overallScore}/100`,
        condition_severity: scorecard.scoreLabel,
      });

      router.push({
        pathname: '/analysis',
        params: {
          reportId: 'Aggregate',
          patientName: 'Overall Profile',
          hospitalName: 'All Reports',
          summary: syntheticSummary,
          values: JSON.stringify(mappedValues),
          detectedMedicines: '[]',
          narrative: '',
        },
      });
    } catch (e: any) {
      Alert.alert("Navigation Error", "Could not load the aggregate analysis.");
    } finally {
      setNavigating(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <HomeHeader />
        </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <HealthScoreCard
          hasReports={hasReports}
          score={scorecard?.overallScore ?? score}
          label={scorecard?.scoreLabel ?? label}
          normalCount={overallNormalCount}
          reportsAnalyzed={scorecard?.totalReports ?? reports.length}
          lastUpdated={scorecard?.lastUpdated ?? lastUpdated}
          attentionCount={overallAttentionCount}
          stableOverReports={scorecard?.totalReports ?? reports.length}
          attentionReportId={attentionReportId}
          onAttentionPress={handleAttentionPress}
        />

        <ChatInputBar />

        <QuickActions />

        <HealthMetricsSection reports={reports} phone={phone} />

        <RiskIndicatorsSection
          riskIndicators={scorecard?.riskIndicators ?? []}
          hasReports={hasReports}
        />

        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeading}>{t("family_health")}</Text>
          <FamilyHealthCard />
        </View>

        {todayBanner && todayBanner.count > 0 && (
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionHeading}>{t("medicines_title")}</Text>
            <MedicineReminderCard todayBanner={todayBanner} />
          </View>
        )}

        <HealthTipCard />

        <ShareAppCard />

        {hasReports ? <RecentReports reports={reports} /> : <EmptyState />}
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
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
    paddingBottom: 48,
    gap: 24,
    flexGrow: 1,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  sectionGroup: {
    gap: 8,
  },
});
