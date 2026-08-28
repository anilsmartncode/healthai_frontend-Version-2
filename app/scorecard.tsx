/**
 * app/scorecard.tsx  — Health Scorecard Screen (Screen 3 in flow)
 *
 * Shows: circular gauge, risk indicators, trend
 * Nav: Forward → AI Summary (/ai-summary)
 */

import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Radius } from '@/constants/Colors';
import { reportsApi } from '@/services/reportsApi';

type RiskLevel = 'low' | 'moderate' | 'high';

interface RiskIndicator {
  label: string;
  level: RiskLevel;
  disease: string;
}

interface Scorecard {
  overallScore: number;
  scoreLabel: string;
  riskIndicators: RiskIndicator[];
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
  totalReports: number;
}

const RISK_CONFIG: Record<RiskLevel, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; label: string }> = {
  low: { icon: 'checkmark-circle', color: Colors.success, bg: '#DCFCE7', label: 'Low Risk' },
  moderate: { icon: 'warning', color: Colors.warning, bg: '#FEF3C7', label: 'Moderate Risk' },
  high: { icon: 'alert-circle', color: Colors.danger, bg: '#FEE2E2', label: 'High Risk' },
};

function GaugeChart({ score, size = 160 }: { score: number; size?: number }) {
  const stroke = size * 0.08;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const color = score >= 80 ? Colors.success : score >= 60 ? Colors.warning : Colors.danger;
  const offset = circ - (score / 100) * circ;
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Moderate' : 'At Risk';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E2E8F0" strokeWidth={stroke} fill="none" />
        {/* Progress */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '800', color }}>{score}</Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted }}>out of 100</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color, marginTop: 2 }}>{label}</Text>
      </View>
    </View>
  );
}

export default function ScorecardScreen() {
  const { id, summary, detectedMedicines } = useLocalSearchParams<{ id?: string; summary?: string; detectedMedicines?: string }>();
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);

  useEffect(() => {
    reportsApi.getScorecard().then(s => {
      if (s) setScorecard(s);
    });
  }, []);

  const sc = scorecard ?? {
    overallScore: 85, scoreLabel: 'Good',
    riskIndicators: [
      { label: 'Diabetes', level: 'low' as RiskLevel, disease: 'Diabetes' },
      { label: 'Heart Disease', level: 'low' as RiskLevel, disease: 'Heart Disease' },
      { label: 'Vitamin D Deficiency', level: 'moderate' as RiskLevel, disease: 'Vitamin D Deficiency' },
    ],
    trend: 'stable' as const, lastUpdated: 'Recently', totalReports: 5,
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Health Scorecard</Text>
        <Pressable style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Gauge */}
        <View style={styles.gaugeCard}>
          <Text style={styles.gaugeSubtitle}>Health Score</Text>
          <GaugeChart score={sc.overallScore} size={180} />
          <Text style={styles.gaugeMotivation}>
            {sc.overallScore >= 80
              ? 'Your health is good. Keep maintaining a healthy lifestyle.'
              : 'Some values need attention. Follow the recommendations below.'}
          </Text>
        </View>

        {/* Risk Indicators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Indicators</Text>
          {sc.riskIndicators.map((ri, i) => {
            const cfg = RISK_CONFIG[ri.level];
            return (
              <View key={i} style={styles.riskRow}>
                <View style={[styles.riskIconWrap, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={styles.riskInfo}>
                  <Text style={styles.riskLabel}>{cfg.label}</Text>
                  <Text style={styles.riskDisease}>{ri.disease}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Trend */}
        <View style={styles.trendCard}>
          <Ionicons
            name={sc.trend === 'improving' ? 'trending-up' : sc.trend === 'declining' ? 'trending-down' : 'remove'}
            size={24}
            color={sc.trend === 'improving' ? Colors.success : sc.trend === 'declining' ? Colors.danger : Colors.textMuted}
          />
          <View>
            <Text style={styles.trendTitle}>Trend: {sc.trend.charAt(0).toUpperCase() + sc.trend.slice(1)}</Text>
            <Text style={styles.trendSub}>Based on {sc.totalReports} reports · Last: {sc.lastUpdated}</Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push({ pathname: '/ai-summary', params: { id, summary, detectedMedicines } })}
        >
          <Text style={styles.primaryBtnText}>View Trends</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  bellBtn: { padding: 4 },
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  gaugeCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 20, alignItems: 'center', gap: 12 },
  gaugeSubtitle: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  gaugeMotivation: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  riskIconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  riskInfo: { flex: 1 },
  riskLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  riskDisease: { fontSize: 12, color: Colors.textMuted },
  trendCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  trendTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  trendSub: { fontSize: 12, color: Colors.textMuted },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 16, marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
