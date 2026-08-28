import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';

export interface Med {
  time: string;
  name: string;
  note: string;
  taken: boolean;
}

export function MedCard({ med }: { med: Med }) {
  return (
    <Card style={styles.row}>
      <Ionicons
        name={med.taken ? 'checkmark-circle' : 'time-outline'}
        size={22}
        color={med.taken ? Colors.success : Colors.warning}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {med.time} · {med.name}
        </Text>
        <Text style={styles.note}>{med.note}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontWeight: '600', color: Colors.text },
  note: { color: Colors.textMuted, fontSize: 12 },
});
