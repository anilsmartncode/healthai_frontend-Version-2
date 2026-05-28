import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { reportsService } from '@/services/reports';
import type { LabValue } from '@/types';

const TABS = ['Summary', 'Abnormal (2)', 'All Values'] as const;

export default function Analysis() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Summary');
  const [values, setValues] = useState<LabValue[]>([]);
  useEffect(() => {
    reportsService.values('1').then(setValues);
  }, []);

  const visible = tab === 'Abnormal (2)' ? values.filter((v) => v.status === 'high' || v.status === 'low') : values;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 36 }}>✅</Text>
        <Text style={styles.h1}>Good Health</Text>
        <Text style={styles.sub}>Your report looks good overall. 2 values need attention.</Text>
      </Card>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && { color: Colors.primary }]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Key Findings</Text>
      {visible.map((v) => (
        <Card key={v.name} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{v.name}</Text>
            <Text style={styles.meta}>Range: {v.range}</Text>
          </View>
          <Text style={styles.val}>{v.value}</Text>
          <Badge label={v.status} status={v.status} />
        </Card>
      ))}

      <Card>
        <Text style={styles.section}>AI Explanation</Text>
        <Text style={styles.body}>
          Your TSH level is higher than normal, which may indicate an underactive thyroid. This can cause
          tiredness, weight gain, and low energy. Consult your doctor for proper evaluation.
        </Text>
      </Card>

      <Button title="See All Values" variant="outline" onPress={() => router.push('/all-values')} />
      <Button title="Discuss with AI Assistant" onPress={() => router.push('/(tabs)/ai')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '700', color: Colors.success },
  sub: { color: Colors.textMuted, textAlign: 'center' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  tabActive: { borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontWeight: '600', color: Colors.text },
  meta: { fontSize: 12, color: Colors.textMuted },
  val: { fontWeight: '700', color: Colors.text },
  body: { color: Colors.text, marginTop: 8, lineHeight: 20 },
});
