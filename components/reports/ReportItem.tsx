import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/Colors';
import { formatDate } from '@/utils/format';
import type { Report } from '@/types';
import { useLang } from '@/context/Languagecontext';

export function ReportItem({ report }: { report: Report }) {
  const { rowDirection, textAlign } = useLang();

  return (
    <Pressable onPress={() => router.push('/analysis')}>
      <Card style={[styles.row, { flexDirection: rowDirection }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { textAlign }]}>{report.title}</Text>
          <Text style={[styles.date, { textAlign }]}>{formatDate(report.date)}</Text>
        </View>
        <Badge label={report.status} status={report.status} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  date:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
