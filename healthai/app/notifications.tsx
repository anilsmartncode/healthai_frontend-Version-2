import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const items = [
  { icon: 'notifications', title: 'Medicine reminder', body: 'Take Atorvastatin 10mg at 8:00 AM', time: '5m ago' },
  { icon: 'document-text', title: 'New report processed', body: 'Thyroid Profile analysis is ready', time: '1h ago' },
  { icon: 'pulse', title: 'Health tip', body: 'Drink at least 2-3 liters of water daily', time: '3h ago' },
];

export default function Notifications() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={styles.title}>Notifications</Text>
      {items.map((n) => (
        <Card key={n.title} style={styles.row}>
          <View style={styles.icon}>
            <Ionicons name={n.icon as any} size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h}>{n.title}</Text>
            <Text style={styles.b}>{n.body}</Text>
          </View>
          <Text style={styles.t}>{n.time}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  h: { fontWeight: '700', color: Colors.text },
  b: { color: Colors.textMuted, fontSize: 12 },
  t: { color: Colors.textMuted, fontSize: 11 },
});
