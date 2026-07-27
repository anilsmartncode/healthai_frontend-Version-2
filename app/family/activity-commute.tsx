/**
 * app/family/activity-commute.tsx — Activity & Commute Dashboard
 * ─────────────────────────────────────────────────────────────────────
 * Main dashboard showing live location status, commute timeline,
 * and daily health summary cards.
 */
import React from 'react';
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import { useCommuteStatus, useSleepDetails } from '@/hooks/useCommute';
import type { CommuteEvent } from '@/services/commuteApi';

// ── Helpers ─────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function eventIcon(e: CommuteEvent): { emoji: string; bg: string } {
  if (e.event_type === 'exit') return { emoji: '🏠', bg: '#FEF3C7' };
  if (e.location_type === 'office') return { emoji: '🏢', bg: '#D1FAE5' };
  return { emoji: '📍', bg: '#E0E7FF' };
}

function eventLabel(e: CommuteEvent): string {
  if (e.event_type === 'exit') return `Left ${e.zone_label}`;
  return `Arrived at ${e.zone_label}`;
}

// ════════════════════════════════════════════════════════════════════
export default function ActivityCommuteScreen() {
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();
  const { status, history, loading, error, refresh } = useCommuteStatus(id);
  const { sleep } = useSleepDetails(id);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  // ── Error State ────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <Ionicons name="wifi-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errTxt}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryTxt}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ── Loading State ──────────────────────────────────────────────────
  if (loading && !status) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const statusEmoji = status?.current_zone?.type === 'office' ? '🏢'
    : status?.current_zone?.type === 'home' ? '🏠' : '📍';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar
        title="Activity & Commute"
        onBack={() => router.back()}
        rightIcon="calendar-outline"
      />

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ── Live Status Card ──────────────────────────────────────── */}
        {status && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusName}>{status.member_name}</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
            <View style={styles.statusLocation}>
              <View style={styles.statusLocIcon}>
                <Text style={{ fontSize: 20 }}>{statusEmoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLocLabel}>Currently at</Text>
                <Text style={styles.statusLocPlace}>
                  {status.current_zone?.label ?? 'Unknown'}
                </Text>
                <Text style={styles.statusLocTime}>
                  Since {formatTime(status.since)} · {durationLabel(status.duration_minutes)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Commute Timeline ─────────────────────────────────────── */}
        {history && history.events.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="swap-vertical-outline" size={16} color={Colors.primary} />
              <Text style={styles.cardTitle}>Today's Commute</Text>
              {history.total_commute_duration_minutes > 0 && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationBadgeText}>
                    {durationLabel(history.total_commute_duration_minutes)}
                  </Text>
                </View>
              )}
            </View>

            {history.events.map((evt, i) => {
              const { emoji, bg } = eventIcon(evt);
              return (
                <View key={evt.event_id} style={styles.timelineItem}>
                  {i < history.events.length - 1 && <View style={styles.timelineLine} />}
                  <View style={[styles.tlDot, { backgroundColor: bg }]}>
                    <Text style={{ fontSize: 14 }}>{emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tlLabel}>{eventLabel(evt)}</Text>
                    <Text style={styles.tlSub}>
                      {evt.event_type === 'exit' ? 'Departed from' : 'Entered'} {evt.zone_label} zone
                    </Text>
                  </View>
                  <Text style={styles.tlTime}>{formatTime(evt.timestamp)}</Text>
                </View>
              );
            })}

            {/* In-transit segment if available */}
            {history.commute_segments.map((seg, i) => (
              <View key={`seg-${i}`} style={styles.transitCard}>
                <Ionicons name="car-outline" size={16} color={Colors.info} />
                <Text style={styles.transitText}>
                  {seg.from_zone} → {seg.to_zone} · {durationLabel(seg.duration_minutes)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Daily Health Summary ─────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="fitness-outline" size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Daily Health Summary</Text>
          </View>
          <View style={styles.healthGrid}>
            {/* Sleep */}
            <Pressable
              style={styles.healthMiniCard}
              onPress={() => router.push({ pathname: '/family/sleep-details' as any, params: { id, name } })}
            >
              <View style={[styles.hmIcon, { backgroundColor: '#EDE9FE' }]}>
                <Text style={{ fontSize: 18 }}>🌙</Text>
              </View>
              <Text style={styles.hmVal}>
                {sleep ? durationLabel(sleep.summary.total_duration_minutes) : '—'}
              </Text>
              <Text style={styles.hmLabel}>Sleep Duration</Text>
              {sleep && sleep.comparison.vs_yesterday_minutes > 0 && (
                <View style={[styles.hmChange, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.hmChangeText, { color: Colors.success }]}>
                    ▲ +{sleep.comparison.vs_yesterday_minutes}m
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Steps */}
            <View style={styles.healthMiniCard}>
              <View style={[styles.hmIcon, { backgroundColor: '#DCFCE7' }]}>
                <Text style={{ fontSize: 18 }}>👣</Text>
              </View>
              <Text style={styles.hmVal}>4,520</Text>
              <Text style={styles.hmLabel}>Steps Today</Text>
              <View style={[styles.hmChange, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.hmChangeText, { color: Colors.danger }]}>▼ -680</Text>
              </View>
            </View>

            {/* Commute Time */}
            <View style={styles.healthMiniCard}>
              <View style={[styles.hmIcon, { backgroundColor: '#FEF3C7' }]}>
                <Text style={{ fontSize: 18 }}>🚗</Text>
              </View>
              <Text style={styles.hmVal}>
                {history ? durationLabel(history.total_commute_duration_minutes) : '—'}
              </Text>
              <Text style={styles.hmLabel}>Commute Time</Text>
              <View style={[styles.hmChange, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.hmChangeText, { color: Colors.success }]}>Avg 1h 05m</Text>
              </View>
            </View>

            {/* Heart Rate */}
            <View style={styles.healthMiniCard}>
              <View style={[styles.hmIcon, { backgroundColor: '#FFE4E6' }]}>
                <Text style={{ fontSize: 18 }}>❤️</Text>
              </View>
              <Text style={styles.hmVal}>72</Text>
              <Text style={styles.hmLabel}>Resting HR</Text>
              <View style={[styles.hmChange, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.hmChangeText, { color: Colors.success }]}>Normal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Configure Safe Zones CTA ─────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push({ pathname: '/family/geofence-setup' as any, params: { id, name } })}
        >
          <Ionicons name="settings-outline" size={18} color="#fff" />
          <Text style={styles.ctaBtnText}>Configure Safe Zones</Text>
        </Pressable>

        {/* ── Tracking Permissions Link ────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [styles.permLink, pressed && { opacity: 0.8 }]}
          onPress={() => router.push({ pathname: '/family/tracking-permissions' as any, params: { id, name } })}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
          <Text style={styles.permLinkText}>Tracking Permissions</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  errTxt:   { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32, marginTop: 8 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, marginTop: 12 },
  retryTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
  page:     { padding: 12, paddingBottom: 40 },

  // Status card
  statusCard:    { backgroundColor: '#065f46', borderRadius: 16, padding: 18, marginBottom: 12, overflow: 'hidden' },
  statusHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  statusName:    { fontSize: 15, fontWeight: '700', color: '#fff' },
  liveBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  liveText:      { fontSize: 11, fontWeight: '600', color: '#fff' },
  statusLocation:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 },
  statusLocIcon:   { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  statusLocLabel:  { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  statusLocPlace:  { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 1 },
  statusLocTime:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Cards
  card:          { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle:     { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1 },
  durationBadge: { backgroundColor: '#E8F5F0', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  durationBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },

  // Timeline
  timelineItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, position: 'relative' },
  timelineLine:  { position: 'absolute', top: 34, left: 14, width: 2, height: '100%', backgroundColor: Colors.border },
  tlDot:         { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tlLabel:       { fontSize: 13, fontWeight: '600', color: Colors.text },
  tlSub:         { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  tlTime:        { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  transitCard:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EEF2FF', borderRadius: 8, padding: 10, marginTop: 4 },
  transitText:   { fontSize: 12, fontWeight: '600', color: Colors.info },

  // Health grid
  healthGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  healthMiniCard: { width: '48%', backgroundColor: '#FAFBFC', borderRadius: 12, padding: 14, alignItems: 'center' },
  hmIcon:        { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  hmVal:         { fontSize: 20, fontWeight: '800', color: Colors.text },
  hmLabel:       { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  hmChange:      { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  hmChangeText:  { fontSize: 10, fontWeight: '600' },

  // CTAs
  ctaBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, marginTop: 6 },
  ctaBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff' },
  permLink:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8F5F0', borderRadius: 12, padding: 13, marginTop: 8 },
  permLinkText:  { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
