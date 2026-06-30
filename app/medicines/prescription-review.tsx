import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import type { DetectedMedicine } from '@/types/Report/reportype';

function MedicineRow({ med, isLast }: { med: DetectedMedicine; isLast: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [medRow.wrap, !isLast && medRow.border, pressed && { opacity: 0.7 }]}
      onPress={() => router.push({ pathname: '/medicines/browse', params: { query: med.name } })}
    >
      <View style={medRow.left}>
        <Text style={medRow.name}>{med.name}</Text>
        <Text style={medRow.reason} numberOfLines={2}>{med.reason}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

export default function PrescriptionReviewScreen() {
  const params = useLocalSearchParams<{ detectedMedicines?: string }>();

  const detectedMedicines: DetectedMedicine[] = (() => {
    if (!params.detectedMedicines) return [];
    try {
      return JSON.parse(params.detectedMedicines);
    } catch {
      return [];
    }
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Extracted Medicines</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Ionicons name="document-text" size={48} color={Colors.primary} />
          <Text style={styles.heroTitle}>Analysis Complete</Text>
          <Text style={styles.heroSub}>
            We scanned your prescription and found the following medicines. Tap any medicine to quickly add it to your daily reminders.
          </Text>
        </View>

        {detectedMedicines.length === 0 ? (
          <View style={section.wrap}>
            <Text style={styles.empty}>No medicines could be clearly extracted from this image.</Text>
          </View>
        ) : (
          <View style={section.wrap}>
            <Text style={section.title}>Medicines Found</Text>
            {detectedMedicines.map((m, i) => (
              <MedicineRow key={m.name} med={m} isLast={i === detectedMedicines.length - 1} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  backBtn: { marginRight: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  hero: { alignItems: 'center', marginVertical: 20, paddingHorizontal: 20 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 12, marginBottom: 8 },
  heroSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 14 },
});

const section = StyleSheet.create({
  wrap: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
});

const medRow = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  left: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  reason: { fontSize: 13, color: Colors.textMuted, lineHeight: 19 },
});
