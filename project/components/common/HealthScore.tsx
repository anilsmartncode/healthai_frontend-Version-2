import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export function HealthScore({ score, label = 'Good' }: { score: number; label?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 10,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  score: { fontSize: 36, fontWeight: '700', color: Colors.text },
  label: { fontSize: 14, color: Colors.success, fontWeight: '600' },
});
