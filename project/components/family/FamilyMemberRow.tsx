/**
 * FamilyMemberRow.tsx — Tappable member row (S1 member list, S10 tree list)
 * Mirrors .member-row in the HTML reference.
 */
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { FamilyMember, HealthStatus } from '@/services/familyApi';

interface Props { member: FamilyMember; onPress: (m: FamilyMember) => void }

export function FamilyMemberRow({ member, onPress }: Props) {
  const color = statusColor(member.status);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => onPress(member)}
    >
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={20} color={Colors.primary} />
      </View>
      <Text style={styles.name} numberOfLines={1}>{member.name}</Text>
      <Text style={styles.rel}>{member.relationship}</Text>
      <Text style={[styles.score, { color }]}>{member.health_score}</Text>
      <Text style={[styles.status, { color }]}>{member.status}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function statusColor(s: HealthStatus) {
  return s === 'Excellent' || s === 'Good' ? Colors.success
       : s === 'Attention'                 ? Colors.warning
       :                                     Colors.danger;
}

const styles = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, padding: 11, marginBottom: 7 },
  pressed:{ backgroundColor: '#F0FAF5' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5F0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  name:   { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  rel:    { fontSize: 11, color: Colors.textMuted, minWidth: 52 },
  score:  { fontSize: 15, fontWeight: '700', minWidth: 26, textAlign: 'right' },
  status: { fontSize: 11, fontWeight: '600', minWidth: 60 },
});
