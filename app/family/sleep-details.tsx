/**
 * app/family/sleep-details.tsx — Sleep Details Deep Dive
 * ─────────────────────────────────────────────────────────────────────
 * Detailed sleep analysis with duration hero, weekly bar chart,
 * sleep phase breakdown, and detail rows.
 */
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import { useSleepDetails } from '@/hooks/useCommute';
import type { SleepPhaseName } from '@/services/commuteApi';

// ── Helpers ─────────────────────────────────────────────────────────
function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function qualityEmoji(q: string): string {
  switch (q) {
    case 'excellent': return '🌟';
    case 'good':      return '😊';
    case 'fair':      return '😐';
    case 'poor':      return '😴';
    default:          return '😊';
  }
}

const PHASE_COLORS: Record<SleepPhaseName, string> = {
  deep:  '#818CF8',
  core:  '#A78BFA',
  rem:   '#C4B5FD',
  awake: '#EDE9FE',
};

const PHASE_LABELS: Record<SleepPhaseName, string> = {
  deep:  'Deep',
  core:  'Core',
  rem:   'REM',
  awake: 'Awake',
};

// ════════════════════════════════════════════════════════════════════
export default function SleepDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();
  const { sleep, loading, error } = useSleepDetails(id);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !sleep) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <FamilyTopBar title="Sleep Details" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Ionicons name="moon-outline" size={42} color={Colors.textMuted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyTxt}>{error ?? 'No sleep data available.'}</Text>
        </View>
      </View>
    );
  }

  const { summary, phases, weekly, comparison } = sleep;
  const maxWeekly = Math.max(...weekly.map((w) => w.duration_minutes), 1);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar
        title="Sleep Details"
        onBack={() => router.back()}
        rightIcon="calendar-outline"
      />

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        {/* ── Sleep Hero ──────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroDuration}>
            {Math.floor(summary.total_duration_minutes / 60)}
            <Text style={styles.heroUnit}>h </Text>
            {summary.total_duration_minutes % 60}
            <Text style={styles.heroUnit}>m</Text>
          </Text>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>
              {qualityEmoji(summary.quality)} {summary.quality.charAt(0).toUpperCase() + summary.quality.slice(1)} Quality
            </Text>
          </View>
          <Text style={styles.heroDate}>
            Last night · {new Date(sleep.date).toLocaleDateString('en-IN', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </Text>
          {comparison.vs_yesterday_minutes !== 0 && (
            <View style={[
              styles.compBadge,
              { backgroundColor: comparison.vs_yesterday_minutes > 0 ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)' },
            ]}>
              <Text style={[
                styles.compText,
                { color: comparison.vs_yesterday_minutes > 0 ? '#4ade80' : '#f87171' },
              ]}>
                {comparison.vs_yesterday_minutes > 0 ? '▲' : '▼'} {Math.abs(comparison.vs_yesterday_minutes)}m vs yesterday
              </Text>
            </View>
          )}
        </View>

        {/* ── Weekly Bar Chart ────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="bar-chart-outline" size={16} color="#8B5CF6" />
            <Text style={styles.cardTitle}>This Week</Text>
          </View>
          <View style={styles.barChart}>
            {weekly.map((w, i) => {
              const isToday = i === weekly.length - 1;
              const barH = (w.duration_minutes / maxWeekly) * 90;
              return (
                <View key={w.date} style={styles.barItem}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barH, 8),
                        backgroundColor: isToday ? Colors.primary : '#C4F1EA',
                      },
                    ]}
                  />
                  <Text style={[styles.barLabel, isToday && { color: Colors.primary, fontWeight: '700' }]}>
                    {w.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Sleep Phases ────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="moon-outline" size={16} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Sleep Phases</Text>
          </View>

          {/* Stacked bar */}
          <View style={styles.phaseBar}>
            {phases.map((p) => (
              <View
                key={p.phase}
                style={{
                  flex: p.percentage,
                  height: 24,
                  backgroundColor: PHASE_COLORS[p.phase],
                }}
              />
            ))}
          </View>

          {/* Legend */}
          <View style={styles.phaseLegend}>
            {phases.map((p) => (
              <View key={p.phase} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: PHASE_COLORS[p.phase] }]} />
                <Text style={styles.legendText}>
                  {PHASE_LABELS[p.phase]} · {durationLabel(p.duration_minutes)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Detail Rows ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="list-outline" size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Details</Text>
          </View>

          <DetailRow label="Bedtime" value={formatTime(summary.bedtime)} />
          <DetailRow label="Wake Up" value={formatTime(summary.wake_time)} />
          <DetailRow label="Time in Bed" value={durationLabel(summary.time_in_bed_minutes)} />
          <DetailRow label="Sleep Efficiency" value={`${summary.sleep_efficiency_percent}%`} />
          <DetailRow label="Avg. Heart Rate" value={`${summary.avg_heart_rate_bpm} bpm`} />
          <DetailRow label="Respiratory Rate" value={`${summary.avg_respiratory_rate} br/min`} last />
        </View>
      </ScrollView>
    </View>
  );
}

// ── Detail Row Component ────────────────────────────────────────────
function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTxt: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
  page:     { padding: 12, paddingBottom: 40 },

  // Hero
  heroCard:     { backgroundColor: '#312e81', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  heroDuration: { fontSize: 42, fontWeight: '800', color: '#fff' },
  heroUnit:     { fontSize: 18, fontWeight: '500', opacity: 0.7 },
  qualityBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 8 },
  qualityText:  { fontSize: 12, fontWeight: '600', color: '#fff' },
  heroDate:     { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 6 },
  compBadge:    { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  compText:     { fontSize: 11, fontWeight: '600' },

  // Card
  card:          { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle:     { fontSize: 14, fontWeight: '700', color: Colors.text },

  // Bar chart
  barChart:      { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, gap: 6, marginTop: 4 },
  barItem:       { flex: 1, alignItems: 'center', gap: 4 },
  bar:           { width: '100%', maxWidth: 28, borderRadius: 6 },
  barLabel:      { fontSize: 9, color: Colors.textMuted, fontWeight: '600' },

  // Phases
  phaseBar:      { flexDirection: 'row', height: 24, borderRadius: 8, overflow: 'hidden', marginVertical: 8 },
  phaseLegend:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:     { width: 8, height: 8, borderRadius: 2 },
  legendText:    { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },

  // Details
  detailRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailLabel:     { fontSize: 13, color: Colors.textMuted },
  detailValue:     { fontSize: 13, fontWeight: '700', color: Colors.text },
});
