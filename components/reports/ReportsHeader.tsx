import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';

export function ReportsHeader() {
  const { t, rowDirection } = useLang();

  return (
    <View style={[styles.row, { flexDirection: rowDirection }]}>
      <Text style={styles.title}>{t('your_reports')}</Text>
      <Pressable style={[styles.btn, { flexDirection: rowDirection }]} onPress={() => router.push('/upload')}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.btnText}>{t('upload_report')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title:   { fontSize: 22, fontWeight: '700', color: Colors.text },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
