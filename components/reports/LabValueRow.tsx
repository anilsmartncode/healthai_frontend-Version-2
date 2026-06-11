import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/Colors';
import type { LabValue } from '@/types';

interface Props {
  value: LabValue;
  variant?: 'compact' | 'full';
}

function goAskAI(name: string, value: string, status: string) {
  router.push({
    pathname: '/(tabs)/ai',
    params: {
      prefill: `What does ${name} = ${value} mean? It is marked as ${status}.`,
    },
  });
}

export function LabValueRow({ value: v, variant = 'compact' }: Props) {
  if (variant === 'full') {
    return (
      <Pressable
        onLongPress={() => goAskAI(v.name, v.value, v.status)}
        delayLongPress={400}
      >
        <Card style={styles.tableRow}>
          <Text style={styles.fullName} numberOfLines={1}>{v.name}</Text>
          <Text style={styles.fullValue}>{v.value}</Text>
          <Text style={styles.fullRange} numberOfLines={1}>{v.range}</Text>
          <Badge label={v.status} status={v.status} />
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable
      onLongPress={() => goAskAI(v.name, v.value, v.status)}
      delayLongPress={400}
    >
      <Card style={styles.compactRow}>
        <View style={styles.nameCol}>
          <Text style={styles.name} numberOfLines={1}>{v.name}</Text>
          <Text style={styles.meta}>Range: {v.range}</Text>
        </View>
        <Text style={styles.val}>{v.value}</Text>
        <Badge label={v.status} status={v.status} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
  nameCol:    { flex: 1, gap: 3 },
  name:       { fontSize: 15, fontWeight: '600', color: Colors.text },
  meta:       { fontSize: 12, color: Colors.textMuted },
  val:        { width: 90, marginRight: 8, textAlign: 'left', fontSize: 15, fontWeight: '700', color: Colors.text },
  tableRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, gap: 8 },
  fullName:   { flex: 1.5, fontSize: 13, fontWeight: '600', color: Colors.text },
  fullValue:  { width: 90, marginRight: 8, fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'left' },
  fullRange:  { flex: 1.4, fontSize: 12, color: Colors.textMuted },
});
