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

const MAX_BAR_H = 44; // px, tallest bar in trend chart

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
  const maxScore = Math.max(...data.score_trend.map((t) => t.score));

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

        {/* ── Score trend chart ─────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Score Trend — last 6 months</Text>
          <View style={styles.barChart}>
            {data.score_trend.map((t: ScoreTrend) => {
              const h = Math.round((t.score / maxScore) * MAX_BAR_H);
              const c = scoreColor(t.score);
              return (
                <View key={t.month} style={styles.barCol}>
                  <Text style={styles.barVal}>{t.score}</Text>
                  <View style={[styles.bar, { height: h, backgroundColor: c }]} />
                  <Text style={styles.barLbl}>{t.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Vitals ───────────────────────────────────────────── */}
        <Text style={styles.section}>Vitals</Text>
        <View style={styles.card}>
          {data.vitals.map((v: Vital, i: number) => {
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
          })}
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

  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: MAX_BAR_H + 32 },
  barCol:   { flex: 1, alignItems: 'center', gap: 3 },
  bar:      { width: '100%', borderRadius: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barVal:   { fontSize: 9, color: Colors.textMuted, fontWeight: '600' },
  barLbl:   { fontSize: 9, color: Colors.textMuted },

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
