/**
 * FamilyScoreCard.tsx — Hero score card on the Family Dashboard (S1)
 * Mirrors the .score-card section of the HTML reference.
 */
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { FamilyDashboard } from '@/services/familyApi';

interface Props { data: FamilyDashboard | null; loading?: boolean }

export function FamilyScoreCard({ data, loading = false }: Props) {
  // Show "—" placeholders while loading or no data yet
  const isEmpty = loading || !data || data.total_members === 0;

  const scoreColor = !isEmpty && data
    ? data.family_health_score >= 85 ? Colors.success
    : data.family_health_score >= 70 ? Colors.warning : Colors.danger
    : '#9CA3AF';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Family Health Score</Text>

      <View style={styles.topRow}>
        <View>
          <Text style={[styles.score, { color: scoreColor }]}>
            {isEmpty ? '—' : data!.family_health_score}
          </Text>
          <Text style={[styles.scoreLabel, { color: scoreColor }]}>
            {isEmpty ? 'No data yet' : data!.score_label}
          </Text>
        </View>
        <Ionicons name="people" size={52} color={Colors.primary} style={{ opacity: 0.15 }} />
      </View>

      <View style={styles.statRow}>
        <Stat value={isEmpty ? '—' : String(data!.total_members)}   label="Members"   color={isEmpty ? '#9CA3AF' : Colors.text} />
        <Stat value={isEmpty ? '—' : String(data!.good_count)}      label="Good"      color={isEmpty ? '#9CA3AF' : Colors.success} />
        <Stat value={isEmpty ? '—' : String(data!.attention_count)} label="Attention" color={isEmpty ? '#9CA3AF' : Colors.warning} />
        <Stat value={isEmpty ? '—' : String(data!.critical_count)}  label="Critical"  color={isEmpty ? '#9CA3AF' : Colors.danger} />
      </View>
    </View>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: '#E8F5F0', borderRadius: 16, padding: 18, marginBottom: 12 },
  label:      { fontSize: 12, color: Colors.primary, fontWeight: '500', marginBottom: 4 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  score:      { fontSize: 48, fontWeight: '700', lineHeight: 52 },
  scoreLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  statRow:    { flexDirection: 'row', justifyContent: 'space-around' },
  stat:       { alignItems: 'center', gap: 2 },
  statVal:    { fontSize: 20, fontWeight: '700' },
  statLbl:    { fontSize: 10, color: Colors.textMuted },
});
