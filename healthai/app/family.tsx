import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const family = [
  { name: 'You', score: 82, color: '#16A34A' },
  { name: 'Lopa', score: 74, color: '#F59E0B' },
  { name: 'Dad', score: 60, color: '#DC2626' },
  { name: 'Mom', score: 75, color: '#F59E0B' },
];

const meds = [
  { time: '08:00', name: 'Atorvastatin 10mg', note: 'Before Food', taken: true },
  { time: '09:00', name: 'Amlukalyam D3', note: 'After Dinner', taken: false },
];

export default function Family() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Text style={styles.title}>Care Hub</Text>

      <Text style={styles.section}>Family</Text>
      <View style={styles.familyRow}>
        {family.map((m) => (
          <View key={m.name} style={styles.member}>
            <View style={[styles.avatar, { borderColor: m.color }]}>
              <Ionicons name="person" size={22} color={m.color} />
            </View>
            <Text style={styles.memName}>{m.name}</Text>
            <Text style={[styles.memScore, { color: m.color }]}>{m.score}%</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Medications</Text>
      {meds.map((m) => (
        <Card key={m.name} style={styles.row}>
          <Ionicons
            name={m.taken ? 'checkmark-circle' : 'time-outline'}
            size={22}
            color={m.taken ? Colors.success : Colors.warning}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.medName}>
              {m.time} · {m.name}
            </Text>
            <Text style={styles.medNote}>{m.note}</Text>
          </View>
        </Card>
      ))}

      <Text style={styles.section}>Trends</Text>
      <Card>
        <Text style={{ color: Colors.textMuted, marginBottom: 8 }}>TSH Trend (6 Months)</Text>
        <View style={styles.chart}>
          {[5, 6.5, 7.2, 6.8, 7.5, 8.2].map((v, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <View style={[styles.bar, { height: v * 8 }]} />
              <Text style={styles.day}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: Colors.danger, fontWeight: '700', marginTop: 8 }}>Latest: 8.20</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  section: { fontWeight: '700', color: Colors.text, marginTop: 8 },
  familyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  member: { alignItems: 'center', gap: 4 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  memName: { color: Colors.text, fontSize: 13 },
  memScore: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medName: { fontWeight: '600', color: Colors.text },
  medNote: { color: Colors.textMuted, fontSize: 12 },
  chart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 90 },
  bar: { width: 18, borderRadius: 4, backgroundColor: Colors.primary },
  day: { fontSize: 11, color: Colors.textMuted },
});
