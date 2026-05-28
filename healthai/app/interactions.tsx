import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, Radius } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Interactions() {
  const [meds, setMeds] = useState<string[]>(['Metformin 500mg', 'Aspirin 75mg']);
  const [text, setText] = useState('');

  const remove = (m: string) => setMeds((s) => s.filter((x) => x !== m));
  const add = () => {
    if (text.trim()) {
      setMeds((s) => [...s, text.trim()]);
      setText('');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.title}>Interactions Checker</Text>
      <Text style={styles.sub}>Check for medicine interactions</Text>

      <Text style={styles.section}>Selected Medicines</Text>
      {meds.map((m) => (
        <Card key={m} style={styles.row}>
          <Ionicons name="medical-outline" size={20} color={Colors.primary} />
          <Text style={{ flex: 1, color: Colors.text, fontWeight: '600' }}>{m}</Text>
          <Pressable onPress={() => remove(m)}>
            <Ionicons name="close-circle" size={22} color={Colors.danger} />
          </Pressable>
        </Card>
      ))}

      <Text style={styles.section}>Add Another Medicine</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Input placeholder="Search medicine" value={text} onChangeText={setText} />
        </View>
        <Pressable onPress={add} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <Card style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="warning" size={20} color="#B45309" />
          <Text style={{ fontWeight: '700', color: '#92400E' }}>Moderate Interaction Found</Text>
        </View>
        <Text style={{ color: '#92400E' }}>
          Aspirin may increase the risk of stomach irritation or bleeding when taken with Metformin.
          Always consult your doctor before combining medicines.
        </Text>
      </Card>

      <Button title="Save This Check" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  sub: { color: Colors.textMuted },
  section: { fontWeight: '700', color: Colors.text, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderRadius: Radius.md, paddingHorizontal: 14 },
});
