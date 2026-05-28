import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors, Radius } from '@/constants/Colors';
import { medicinesService } from '@/services/medicines';
import type { Medicine } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLang } from '@/context/Languagecontext';

export default function Medicines() {
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [q, setQ] = useState('');
  const { t } = useLang();

  useEffect(() => {
    medicinesService.list().then(setMeds);
  }, []);

  const filtered = meds.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 16, gap: 10 }}>
        <Text style={styles.title}>{t('medicines_title')}</Text>
        <Text style={styles.sub}>{t('medicines_sub')}</Text>
        <Input placeholder={t('search_medicine')} value={q} onChangeText={setQ} />

        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={() => router.push('/interactions')}>
            <Ionicons name="git-compare-outline" size={22} color={Colors.primary} />
            <Text style={styles.actionLabel}>{t('check_interactions')}</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => {}}>
            <Ionicons name="alarm-outline" size={22} color={Colors.primary} />
            <Text style={styles.actionLabel}>{t('medicine_reminder')}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/medicine/${item.id}`)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.dose}</Text>
              </View>
              <Text style={styles.time}>{item.time}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  sub: { color: Colors.textMuted },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  action: { flex: 1, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 4, backgroundColor: Colors.surface },
  actionLabel: { fontSize: 12, color: Colors.text, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  time: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
