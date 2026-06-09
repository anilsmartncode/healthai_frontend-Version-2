/**
 * MemberProfileCard.tsx — S9 member header card
 * Mirrors .profile-card in the HTML reference.
 */
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { MemberProfile, HealthStatus } from '@/services/familyApi';

export function MemberProfileCard({ profile }: { profile: MemberProfile }) {
  const color = statusColor(profile.health_status);
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={28} color={Colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.rel}>{profile.relationship}</Text>
        <Text style={styles.scoreLabel}>Health Score</Text>
        <Text style={[styles.score, { color }]}>{profile.health_score}</Text>
        <Text style={[styles.statusTxt, { color }]}>{profile.health_status}</Text>
      </View>
      <Ionicons name="trending-up" size={28} color={color} />
    </View>
  );
}

function statusColor(s: HealthStatus) {
  return s === 'Excellent' || s === 'Good' ? Colors.success
       : s === 'Attention'                 ? Colors.warning : Colors.danger;
}

const styles = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 8, gap: 14 },
  avatar:     { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8F5F0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  info:       { flex: 1 },
  name:       { fontSize: 16, fontWeight: '700', color: Colors.text },
  rel:        { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  scoreLabel: { fontSize: 11, color: Colors.textMuted },
  score:      { fontSize: 34, fontWeight: '700', lineHeight: 38 },
  statusTxt:  { fontSize: 12, fontWeight: '600' },
});
