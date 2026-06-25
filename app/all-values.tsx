import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { LabValueRow } from '@/components/reports/LabValueRow';
import { useLang } from '@/context/Languagecontext';
import type { LabValue } from '@/types';

export default function AllValuesScreen() {
  const { t } = useLang();
  const params = useLocalSearchParams<{ values?: string }>();
  const values: LabValue[] = params.values ? JSON.parse(params.values) : [];

  const normalCount    = values.filter(v => v.status === 'normal').length;
  const abnormalCount  = values.filter(v => v.status === 'high' || v.status === 'low').length;
  const hasAbnormal    = abnormalCount > 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('all_values')}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary pills */}
        <View style={styles.pillRow}>
          <View style={[styles.pill, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={[styles.pillText, { color: Colors.success }]}>{normalCount} Normal</Text>
          </View>
          {abnormalCount > 0 && (
            <View style={[styles.pill, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle" size={14} color={Colors.danger} />
              <Text style={[styles.pillText, { color: Colors.danger }]}>{abnormalCount} Abnormal</Text>
            </View>
          )}
        </View>

        {/* Column headers */}
        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.h, { flex: 1.2 }]}>Test</Text>
          <Text style={[styles.cell, styles.h]}>Value</Text>
          <Text style={[styles.cell, styles.h, { flex: 1.4 }]}>Range</Text>
          <Text style={[styles.cell, styles.h]}>Status</Text>
        </View>

        {values.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flask-outline" size={40} color={Colors.border} />
            <Text style={{ color: Colors.textMuted, marginTop: 10 }}>No lab values available</Text>
          </View>
        ) : (
          values.map((v) => <LabValueRow key={v.name} value={v} variant="full" />)
        )}

        {hasAbnormal && (
          <Card style={styles.warnCard}>
            <Ionicons name="information-circle-outline" size={16} color="#92400E" />
            <Text style={styles.warnText}>
              Abnormal values should be discussed with your physician.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text, flex: 1 },
  body:        { padding: 16, gap: 8, paddingBottom: 40 },
  pillRow:     { flexDirection: 'row', gap: 8, marginBottom: 4 },
  pill:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  pillText:    { fontSize: 12, fontWeight: '600' },
  headerRow:   { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6 },
  cell:        { flex: 1, fontSize: 13, color: Colors.text },
  h:           { fontWeight: '700', color: Colors.textMuted, fontSize: 11, textTransform: 'uppercase' },
  empty:       { alignItems: 'center', paddingTop: 60 },
  warnCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  warnText:    { flex: 1, color: '#92400E', fontSize: 13 },
});
