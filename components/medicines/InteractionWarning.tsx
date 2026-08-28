import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';

interface Props {
  message?: string;
}

export function InteractionWarning({ message }: Props) {
  const body = message ??
    'Aspirin may increase the risk of stomach irritation or bleeding when taken with Metformin. Always consult your doctor before combining medicines.';
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="warning" size={20} color="#B45309" />
        <Text style={styles.title}>Moderate Interaction Found</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card:  { backgroundColor: '#FEF3C7', borderColor: '#FCD34D', gap: 8 },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontWeight: '700', color: '#92400E' },
  body:  { color: '#92400E' },
});
