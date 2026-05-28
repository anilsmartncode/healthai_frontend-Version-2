import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/Colors';
import { useEffect, useState } from 'react';
import { reportsService } from '@/services/reports';
import type { LabValue } from '@/types';

export default function AllValues() {
  const [values, setValues] = useState<LabValue[]>([]);
  useEffect(() => {
    reportsService.values('1').then(setValues);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={styles.title}>All Values</Text>
      <Text style={styles.sub}>See all test values in detail</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.h, { flex: 1.2 }]}>Test Name</Text>
        <Text style={[styles.cell, styles.h]}>Value</Text>
        <Text style={[styles.cell, styles.h, { flex: 1.4 }]}>Range</Text>
        <Text style={[styles.cell, styles.h]}>Status</Text>
      </View>

      {values.map((v) => (
        <Card key={v.name} style={styles.row}>
          <Text style={[styles.cell, { flex: 1.2, fontWeight: '600', color: Colors.text }]}>{v.name}</Text>
          <Text style={styles.cell}>{v.value}</Text>
          <Text style={[styles.cell, { flex: 1.4, color: Colors.textMuted }]}>{v.range}</Text>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Badge label={v.status} status={v.status} />
          </View>
        </Card>
      ))}

      <Card style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }}>
        <Text style={{ color: '#92400E' }}>
          High values should be discussed with your physician.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  sub: { color: Colors.textMuted, marginBottom: 8 },
  headerRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cell: { flex: 1, fontSize: 13, color: Colors.text },
  h: { fontWeight: '700', color: Colors.textMuted, fontSize: 12, textTransform: 'uppercase' },
});
