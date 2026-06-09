/**
 * PendingBanner.tsx — Yellow banner that shows pending invitation count (S1)
 * Mirrors .pending-banner in the HTML reference.
 */
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface Props { count: number; onPress: () => void }

export function PendingBanner({ count, onPress }: Props) {
  if (count === 0) return null;
  return (
    <Pressable style={({ pressed }) => [styles.banner, pressed && { opacity: 0.8 }]} onPress={onPress}>
      <Ionicons name="mail-outline" size={18} color={Colors.warning} />
      <Text style={styles.text}>{count} pending invitation{count !== 1 ? 's' : ''}</Text>
      <Ionicons name="chevron-forward" size={15} color={Colors.warning} style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF9E8', borderRadius: 10, padding: 11, marginTop: 6 },
  text:   { flex: 1, color: Colors.warning, fontWeight: '600', fontSize: 13 },
});
