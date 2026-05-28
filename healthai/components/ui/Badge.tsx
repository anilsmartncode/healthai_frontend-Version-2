import { Text, View, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/Colors';
import type { ReportStatus } from '@/types';

const colorMap: Record<ReportStatus, string> = {
  good: Colors.success,
  normal: Colors.success,
  attention: Colors.warning,
  low: Colors.info,
  high: Colors.danger,
};

export function Badge({ label, status }: { label: string; status: ReportStatus }) {
  const c = colorMap[status];
  return (
    <View style={[styles.badge, { backgroundColor: c + '22', borderColor: c }]}>
      <Text style={[styles.text, { color: c }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});
