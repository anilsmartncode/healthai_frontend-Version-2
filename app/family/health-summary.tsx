/**
 * app/family/health-summary.tsx — Member Health Summary sub-screen
 */
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import { useHealthSummary } from '@/hooks/useProfile';
import type { Vital, ScoreTrend } from '@/services/profileSubScreenApi';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

// ── Helpers ─────────────────────────────────────────────────────────────

function vitalColor(status: Vital['status']) {
  switch (status) {
    case 'Normal':   return Colors.success;
    case 'Elevated': return Colors.warning;
    case 'High':
    case 'Critical': return Colors.danger;
    case 'Low':      return Colors.info;
    default:         return Colors.textMuted;
  }
}

function scoreColor(score: number) {
  if (score >= 85) return Colors.success;
  if (score >= 65) return Colors.warning;
  return Colors.danger;
}

// ── SVG Curve Generator ──────────────────────────────────────────────────
const controlPoint = (current: number[], previous: number[], next: number[], reverse?: boolean) => {
  const p = previous || current;
  const n = next || current;
  const smoothing = 0.2;
  const o = {
    length: Math.hypot(n[0] - p[0], n[1] - p[1]) * smoothing,
    angle: Math.atan2(n[1] - p[1], n[0] - p[0])
  };
  const angle = o.angle + (reverse ? Math.PI : 0);
  return [current[0] + Math.cos(angle) * o.length, current[1] + Math.sin(angle) * o.length];
};

const bezierCommand = (point: number[], i: number, a: number[][]) => {
  const cps = controlPoint(a[i - 1], a[i - 2], point, false);
  const cpe = controlPoint(point, a[i - 1], a[i + 1], true);
  return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
};

const generateSvgPath = (points: number[][]) => {
  return points.reduce((acc, point, i, a) => 
    i === 0 ? `M ${point[0]},${point[1]}` : `${acc} ${bezierCommand(point, i, a)}`
  , '');
};

// ── Screen ───────────────────────────────────────────────────────────────

export default function HealthSummaryScreen() {
  const insets  = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();

  // Data-fetching now lives in useHealthSummary() — same convention as
  // useReports (home tab) and useFamily (family dashboard).
  const { data, loading, error } = useHealthSummary(id);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <FamilyTopBar title="Health Summary" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.danger} />
          <Text style={styles.errTxt}>{error ?? 'No data available'}</Text>
        </View>
      </View>
    );
  }

  const sc = scoreColor(data.health_score);

  // ── Chart Calculations ────────────────────────────────────────────────
  const CH_HEIGHT = 90;
  const CH_WIDTH = 320; // approximate width
  const trendData = data.score_trend && data.score_trend.length > 0 
    ? data.score_trend 
    : [
        { month: 'Jan', score: 70 }, { month: 'Feb', score: 72 },
        { month: 'Mar', score: 75 }, { month: 'Apr', score: 74 },
        { month: 'May', score: 80 }, { month: 'Jun', score: data.health_score || 84 }
      ];

  const scores = trendData.map((t: any) => t.score);
  const minScore = Math.min(...scores) - 5;
  const maxScore = Math.max(...scores) + 5;
  const range = maxScore - minScore;

  // Map data to x,y points
  const points = trendData.map((t: any, i: number) => {
    const x = (i / (trendData.length - 1)) * CH_WIDTH;
    const y = CH_HEIGHT - ((t.score - minScore) / range) * CH_HEIGHT;
    return [x, y];
  });

  const linePath = generateSvgPath(points);
  // Add closing points for the gradient fill
  const fillPath = `${linePath} L ${CH_WIDTH},${CH_HEIGHT} L 0,${CH_HEIGHT} Z`;

  // Calculate Delta
  const lastScore = scores[scores.length - 1];
  const prevScore = scores[scores.length - 2] || lastScore;
  const delta = lastScore - prevScore;
  const deltaText = delta >= 0 ? `+${delta}` : `${delta}`;
  const deltaColor = delta >= 0 ? Colors.success : Colors.danger;
  const deltaIcon = delta >= 0 ? 'trending-up' : 'trending-down';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar title="Health Summary" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>

        {/* ── Score + Stats row ─────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { flex: 1.2 }]}>
            <Text style={[styles.statVal, { color: sc, fontSize: 32 }]}>{data.health_score}</Text>
            <Text style={styles.statLbl}>Score</Text>
            <Text style={[styles.statusChip, { color: sc }]}>{data.health_status}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: Colors.warning }]}>{data.bmi}</Text>
            <Text style={styles.statLbl}>BMI</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: Colors.info }]}>{data.spo2}%</Text>
            <Text style={styles.statLbl}>SpO₂</Text>
          </View>
        </View>

        {/* ── Premium Score trend chart ─────────────────────────────────── */}
        <View style={[styles.card, { paddingBottom: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <View>
              <Text style={styles.cardTitle}>Score Trend</Text>
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>Last 6 months</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: deltaColor + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 }}>
              <Ionicons name={deltaIcon} size={12} color={deltaColor} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: deltaColor }}>{deltaText} pts</Text>
            </View>
          </View>

          <View style={{ height: CH_HEIGHT, width: '100%', alignItems: 'center' }}>
            <Svg width={CH_WIDTH} height={CH_HEIGHT} style={{ overflow: 'visible' }}>
              <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.3" />
                  <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0.0" />
                </LinearGradient>
              </Defs>
              <Path d={fillPath} fill="url(#grad)" />
              <Path d={linePath} fill="none" stroke={Colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {/* Highlight the latest point */}
              <Circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="5" fill="#fff" stroke={Colors.primary} strokeWidth="3" />
            </Svg>
          </View>

          {/* X-Axis Labels */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 10 }}>
            {trendData.map((t: any, i: number) => (
              <Text key={i} style={{ fontSize: 10, color: Colors.textMuted, width: 30, textAlign: 'center' }}>{t.month}</Text>
            ))}
          </View>
        </View>

        {/* ── Vitals ───────────────────────────────────────────── */}
        <Text style={styles.section}>Vitals</Text>
        <View style={styles.card}>
          {(!data.vitals || data.vitals.length === 0) ? (
            <Text style={{ fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 10 }}>No available vitals</Text>
          ) : (
            data.vitals.map((v: Vital, i: number) => {
              const vc = vitalColor(v.status);
              return (
                <View key={v.label} style={[styles.vitalRow, i > 0 && styles.vitalDivider]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.vitalHeader}>
                      <Text style={styles.vitalLabel}>{v.label}</Text>
                      <Text style={[styles.vitalVal, { color: vc }]}>
                        {v.value} <Text style={styles.vitalUnit}>{v.unit}</Text>
                      </Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${v.barPct}%`, backgroundColor: vc }]} />
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: vc + '20' }]}>
                    <Text style={[styles.statusBadgeTxt, { color: vc }]}>{v.status}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Conditions ───────────────────────────────────────── */}
        {data.conditions && data.conditions.length > 0 && (
          <>
            <Text style={styles.section}>Conditions</Text>
            <View style={styles.chipsWrap}>
              {data.conditions.map((c: any) => (
                <View
                  key={c.label}
                  style={[
                    styles.condChip,
                    c.managed ? { backgroundColor: '#E8F5F0' } : { backgroundColor: '#FEF9E8' },
                  ]}
                >
                  <Text style={[styles.condTxt, { color: c.managed ? '#065F46' : '#92400E' }]}>
                    {c.label}{c.managed ? ' (managed)' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── AI Insights ───────────────────────────────────────── */}
        {data.ai_insights && data.ai_insights.length > 0 && (
          <>
            <Text style={styles.section}>AI Insights</Text>
            {data.ai_insights.map((insight: any, i: number) => (
              <View key={i} style={[styles.card, { borderColor: Colors.primary + '30', borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Ionicons name="sparkles" size={16} color={Colors.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>{insight.title}</Text>
                </View>
                <Text style={{ fontSize: 13, color: Colors.text, lineHeight: 20, marginBottom: 8 }}>
                  {insight.description}
                </Text>
                {insight.recommendation && (
                  <View style={{ backgroundColor: '#F1F5F9', padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 2 }}>Recommendation</Text>
                    <Text style={{ fontSize: 12, color: Colors.text }}>{insight.recommendation}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  errTxt:   { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
  page:     { padding: 12, paddingBottom: 40 },

  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statBox:     { flex: 1, backgroundColor: '#E8F5F0', borderRadius: 12, padding: 12, alignItems: 'center' },
  statVal:     { fontSize: 22, fontWeight: '700', color: Colors.primary },
  statLbl:     { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  statusChip:  { fontSize: 11, fontWeight: '600', marginTop: 2 },

  card:      { backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 10 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 10 },



  section: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 7, marginTop: 4 },

  vitalRow:    { paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  vitalDivider:{ borderTopWidth: 0.5, borderTopColor: Colors.border },
  vitalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  vitalLabel:  { fontSize: 12, color: Colors.textMuted },
  vitalVal:    { fontSize: 13, fontWeight: '600' },
  vitalUnit:   { fontSize: 10, fontWeight: '400' },
  barBg:       { backgroundColor: Colors.border, borderRadius: 4, height: 6, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 4 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  statusBadgeTxt: { fontSize: 10, fontWeight: '600' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  condChip:  { borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  condTxt:   { fontSize: 12, fontWeight: '500' },
});
