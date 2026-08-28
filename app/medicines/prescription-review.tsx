import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { Colors, Radius } from '@/constants/Colors';
import type { DetectedMedicine } from '@/types/Report/reportype';
import {
  batchCreatePrescriptionReminders,
  isMedicineReminderActive,
} from '@/utils/prescriptionReminderHelper';
import { getAllReminders, type Reminder } from '@/services/medicineTabApi';

function MedicineRow({
  med,
  isLast,
  existingReminders,
  onSetReminder,
}: {
  med: DetectedMedicine;
  isLast: boolean;
  existingReminders: Reminder[];
  onSetReminder: (med: DetectedMedicine) => void;
}) {
  const status = isMedicineReminderActive(med.name, existingReminders);

  return (
    <View style={[medRow.wrap, !isLast && medRow.border]}>
      <View style={medRow.left}>
        <Text style={medRow.name}>{med.name}</Text>
        {!!med.reason && (
          <Text style={medRow.reason} numberOfLines={2}>
            {med.reason}
          </Text>
        )}
      </View>

      {status.active ? (
        <View style={medRow.activeBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
          <Text style={medRow.activeText}>Reminder Set</Text>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [medRow.setBtn, pressed && { opacity: 0.8 }]}
          onPress={() => onSetReminder(med)}
        >
          <Ionicons name="notifications-outline" size={12} color={Colors.primary} />
          <Text style={medRow.setBtnText}>Set Reminder</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function PrescriptionReviewScreen() {
  const params = useLocalSearchParams<{ detectedMedicines?: string }>();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      const list = await getAllReminders();
      setReminders(list);
    } catch (e) {
      console.warn('[PrescriptionReview] Error fetching reminders', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReminders();
    }, [fetchReminders])
  );

  const detectedMedicines: DetectedMedicine[] = (() => {
    if (!params.detectedMedicines) return [];
    try {
      return JSON.parse(params.detectedMedicines);
    } catch {
      return [];
    }
  })();

  const handleSetReminder = (med: DetectedMedicine) => {
    router.push({
      pathname: '/medicines/reminders/new',
      params: {
        medicineId: `detected_${Date.now()}`,
        medicineName: med.name,
        frequency: 'daily',
        whenToTake: 'after_food',
        time: '08:00 AM',
        totalCount: '10',
      },
    });
  };

  const handleBatchAdd = async () => {
    if (detectedMedicines.length === 0) return;

    const unadded = detectedMedicines.filter((m) => !isMedicineReminderActive(m.name, reminders).active);
    const target = (unadded.length > 0 ? unadded : detectedMedicines).map((m) => ({
      name: m.name,
      dosage: '',
      units: 'Tablet',
      frequency: 'Daily',
      duration: '5 days',
      instructions: m.reason || 'Take as prescribed',
    }));

    setBatchLoading(true);
    try {
      const { successCount } = await batchCreatePrescriptionReminders(target);
      await fetchReminders();
      if (successCount > 0) {
        Alert.alert(
          'Reminders Scheduled!',
          `Successfully scheduled reminders for ${successCount} medicine(s).`,
          [
            { text: 'View Reminders', onPress: () => router.push('/medicines/reminders') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Notice', 'Could not schedule reminders. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to schedule reminders.');
    } finally {
      setBatchLoading(false);
    }
  };

  const allActive =
    detectedMedicines.length > 0 &&
    detectedMedicines.every((m) => isMedicineReminderActive(m.name, reminders).active);

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
            We scanned your prescription and extracted the medicines below. Set daily reminders individually or all at once.
          </Text>
        </View>

        {detectedMedicines.length === 0 ? (
          <View style={section.wrap}>
            <Text style={styles.empty}>No medicines could be clearly extracted from this image.</Text>
          </View>
        ) : (
          <View style={section.wrap}>
            <View style={section.headerRow}>
              <Text style={section.title}>Medicines Found</Text>

              {allActive ? (
                <View style={styles.allScheduledBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                  <Text style={styles.allScheduledText}>All Reminders Set</Text>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.headerBatchBtn, pressed && { opacity: 0.8 }, batchLoading && { opacity: 0.6 }]}
                  disabled={batchLoading}
                  onPress={handleBatchAdd}
                >
                  {batchLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="notifications-outline" size={13} color={Colors.primary} />
                      <Text style={styles.headerBatchBtnText}>+ Add All Reminders</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            {detectedMedicines.map((m, i) => (
              <MedicineRow
                key={m.name}
                med={m}
                isLast={i === detectedMedicines.length - 1}
                existingReminders={reminders}
                onSetReminder={handleSetReminder}
              />
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
  hero: { alignItems: 'center', marginVertical: 14, paddingHorizontal: 20 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 10, marginBottom: 6 },
  heroSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 },
  empty: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  headerBatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerBatchBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  allScheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  allScheduledText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
});

const section = StyleSheet.create({
  wrap: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text },
});

const medRow = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  left: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  reason: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  setBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },
  setBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  activeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '600',
  },
});
