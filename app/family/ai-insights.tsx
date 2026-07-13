/**
 * app/family/ai-insights.tsx — Member AI Insights sub-screen
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import {
  getMemberAIInsights,
  type AIInsight,
  type InsightSeverity,
} from '@/services/profileSubScreenApi';

// ── Helpers ───────────────────────────────────────────────────────────

function severityStyle(s: InsightSeverity) {
  switch (s) {
    case 'warning': return { border: Colors.warning, bg: '#FFFBEB', icon: 'warning-outline' as const, iconColor: Colors.warning };
    case 'critical': return { border: Colors.danger, bg: '#FFF5F5', icon: 'alert-circle-outline' as const, iconColor: Colors.danger };
    case 'info': return { border: '#007AFF', bg: '#EFF6FF', icon: 'information-circle-outline' as const, iconColor: '#007AFF' };
    default: return { border: Colors.border, bg: '#F8FAFC', icon: 'sparkles-outline' as const, iconColor: '#8B5CF6' };
  }
}

// ── Screen ────────────────────────────────────────────────────────────

export default function MemberAIInsightsScreen() {
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    getMemberAIInsights(id)
      .then((r) => { setInsights(r.insights); setNewCount(r.new_count); })
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const markAllRead = () => {
    setInsights((prev) => prev.map((i) => ({ ...i, is_new: false })));
    setNewCount(0);
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const newInsights = insights.filter((i) => i.is_new);
  const readInsights = insights.filter((i) => !i.is_new);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar title="AI Insights" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>

        {/* ── Header banner ─────────────────────────────── */}
        <View style={styles.headerBanner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="sparkles" size={20} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>AI Health Analysis</Text>
            <Text style={styles.bannerSub}>
              Personalised insights based on {name}'s health data
            </Text>
          </View>
          {newCount > 0 && (
            <Pressable onPress={markAllRead}>
              <Text style={styles.markRead}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {/* ── New insights ──────────────────────────────── */}
        {newInsights.length > 0 && (
          <>
            <Text style={styles.section}>
              New Insights
              <Text style={styles.sectionBadge}> {newInsights.length}</Text>
            </Text>
            {newInsights.map((ins) => <InsightCard key={ins.id || ins.insight_id || Math.random().toString()} insight={ins} />)}
          </>
        )}

        {/* ── Earlier insights ──────────────────────────── */}
        {readInsights.length > 0 && (
          <>
            <Text style={[styles.section, { marginTop: 8 }]}>Earlier</Text>
            {readInsights.map((ins) => <InsightCard key={ins.id || ins.insight_id || Math.random().toString()} insight={ins} />)}
          </>
        )}

        {insights.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={40} color="#8B5CF6" style={{ opacity: 0.3 }} />
            <Text style={styles.emptyTxt}>No insights yet</Text>
            <Text style={styles.emptySub}>Insights appear as health data is analysed</Text>
          </View>
        )}

        {/* ── Disclaimer ────────────────────────────────── */}
        <View style={styles.disclaimer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.disclaimerTxt}>
            AI insights are for informational purposes only and do not replace medical advice. Always consult a qualified doctor.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Insight Card ──────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: AIInsight }) {
  const s = severityStyle(insight.severity);
  return (
    <View style={[styles.insightCard, { borderLeftColor: s.border, backgroundColor: s.bg }]}>
      <View style={styles.insightHeader}>
        <Ionicons name={s.icon} size={16} color={s.iconColor} />
        <Text style={[styles.insightTitle, { color: s.iconColor }]}>{insight.title}</Text>
        {insight.is_new && <View style={styles.newDot} />}
        <Text style={styles.insightDate}>{insight.date}</Text>
      </View>
      <Text style={styles.insightBody}>{insight.body}</Text>
      {insight.action && (
        <Pressable
          style={[styles.actionChip, { borderColor: s.border }]}
          onPress={() => router.push('/ai-chat')}
        >
          <Text style={[styles.actionChipTxt, { color: s.iconColor }]}>{insight.action}</Text>
          <Ionicons name="chevron-forward" size={11} color={s.iconColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  page: { padding: 12, paddingBottom: 40 },

  headerBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0EAFF', borderRadius: 12, padding: 13, gap: 10, marginBottom: 12 },
  bannerIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: '#3B0764' },
  bannerSub: { fontSize: 11, color: '#6D28D9', marginTop: 2 },
  markRead: { fontSize: 11, color: '#8B5CF6', fontWeight: '600', flexShrink: 0 },

  section: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 8 },
  sectionBadge: { color: '#8B5CF6', fontWeight: '700' },

  insightCard: { borderLeftWidth: 3, borderRadius: 12, padding: 13, marginBottom: 9, overflow: 'hidden' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  insightTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  insightBody: { fontSize: 12, color: Colors.text, lineHeight: 18 },
  insightDate: { fontSize: 10, color: Colors.textMuted, flexShrink: 0 },
  newDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8B5CF6', flexShrink: 0 },

  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 9 },
  actionChipTxt: { fontSize: 11, fontWeight: '600' },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 50 },
  emptyTxt: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  emptySub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },

  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginTop: 8 },
  disclaimerTxt: { fontSize: 11, color: Colors.textMuted, flex: 1, lineHeight: 16 },
});
