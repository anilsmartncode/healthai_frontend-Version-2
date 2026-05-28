import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/Colors';
import { formatDate } from '@/utils/format';
import type { Report } from '@/types';

export function ReportItem({ report }: { report: Report }) {
  return (
    <Card style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.date}>{formatDate(report.date)}</Text>
      </View>
      <Badge label={report.status} status={report.status} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  date: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
