import { View, ScrollView, StyleSheet, Text, Alert, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radius } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { useReports } from "@/hooks/useReports";
import { useEffect, useState } from "react";
import { reportsApi } from "@/services/reportsApi";
import { useAuth } from "@/context/AuthContext";
import { useMedicines } from "@/hooks/useMedicines";

import { HomeHeader } from "@/components/home/HomeHeader";
import { HealthScoreCard } from "@/components/home/Healthscorecard";
import { FamilyHealthCard } from "@/components/home/Familyhealthcard";
import { RecentReports } from "@/components/home/RecentReports";
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
  wrap: { alignItems: 'center', paddingVertical: 32, gap: 12, paddingHorizontal: 16 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#E1F5EE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#9FE1CB' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  sub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});

export default function Home() {
  const { reports } = useReports();
  const [scorecard, setScorecard] = useState<{
    overallScore: number;
    scoreLabel: string;
    trend: string;
    lastUpdated: string;
    totalReports: number;
    aiSummary: string;
    averageMetrics: any[];
  } | null>(null);
  const { phone } = useAuth();
  const [navigating, setNavigating] = useState(false);
  const { todayBanner } = useMedicines();

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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <HomeHeader attentionCount={hasReports ? overallAttentionCount : 0} />
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

        <Button
          title="+ Upload New Report"
          onPress={() => router.push('/upload')}
          style={styles.uploadBtn}
        />

        <FamilyHealthCard />

        {/* ── Today's Reminder Banner ── */}
        <Pressable style={styles.reminderBanner} onPress={() => router.push('/medicines/reminders')}>
          <View style={styles.reminderLeft}>
            <Text style={styles.reminderEyebrow}>TODAY'S REMINDER</Text>
            <Text style={styles.reminderTitle}>
              {todayBanner && todayBanner.count > 0 
                ? `${todayBanner.count} medicine${todayBanner.count !== 1 ? 's' : ''} due` 
                : "No medicines due"}
            </Text>
            {todayBanner && todayBanner.count > 0 ? (
              <Text style={styles.reminderSub}>
                Next: {todayBanner.nextName} at {todayBanner.nextTime}
              </Text>
            ) : (
              <Text style={styles.reminderSub}>
                Set up a schedule
              </Text>
            )}
            {todayBanner && todayBanner.count > 0 && (
              <View style={styles.dotRow}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            )}
          </View>
          <View style={styles.reminderBtn}>
            <Text style={styles.reminderBtnText}>{todayBanner && todayBanner.count > 0 ? "View" : "Add"}</Text>
          </View>
        </Pressable>

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
  reminderBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderLeft:    { flex: 1, paddingRight: 12 },
  reminderEyebrow: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  reminderSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  dotRow:   { flexDirection: 'row', gap: 5 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive:{ width: 18, backgroundColor: '#fff' },
  reminderBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexShrink: 0,
  },
  reminderBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
