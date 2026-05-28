import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
  { icon: 'flask-outline', title: 'Uses', body: 'Helps control blood sugar levels in type 2 diabetes.' },
  { icon: 'warning-outline', title: 'Common Side Effects', body: 'Nausea, stomach upset, diarrhea, loss of appetite, metallic taste.' },
  { icon: 'time-outline', title: 'How to Take', body: 'Take with food to reduce stomach upset. Usually taken 1-2 times daily.' },
  { icon: 'alert-circle-outline', title: 'Warnings', body: 'May interact with insulin, alcohol, diuretics and some heart medicines.' },
] as const;

export default function MedicineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={styles.title}>Metformin 500mg</Text>
        <Ionicons name="star-outline" size={22} color={Colors.warning} />
      </View>
      <Text style={styles.sub}>Tablet · ID {id}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Badge label="Prescription" status="normal" />
        <Badge label="Commonly Used" status="good" />
      </View>

      {SECTIONS.map((s) => (
        <Card key={s.title} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name={s.icon as any} size={20} color={Colors.primary} />
            <Text style={styles.section}>{s.title}</Text>
          </View>
          <Text style={styles.body}>{s.body}</Text>
        </Card>
      ))}

      <Button title="Check Interactions" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  sub: { color: Colors.textMuted },
  section: { fontWeight: '700', color: Colors.text },
  body: { color: Colors.text, lineHeight: 20 },
});
