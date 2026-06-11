/**
 * app/medicine-actions.tsx  — Medicine & Actions Screen (Screen 5 in flow)
 *
 * Shows: Detected medicines, action shortcuts, follow-up actions
 * This is the final screen of the reports flow.
 */

import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';

type ActionItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

const MOCK_DETECTED_MEDICINES = [
  { name: 'Vitamin D3 60K', dosage: 'Once a week', icon: 'sunny-outline' as const },
  { name: 'Atorvastatin 10mg', dosage: 'Once at night', icon: 'moon-outline' as const },
];

export default function MedicineActionsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const medicineActions: ActionItem[] = [
    { icon: 'information-circle-outline', label: 'View Medicine Details', onPress: () => router.push('/medicines/browse') },
    { icon: 'flask-outline',              label: 'Check Drug Interactions', onPress: () => router.push('/medicines/check-interactions') },
    { icon: 'alarm-outline',              label: 'Add Medicine Reminder', onPress: () => router.push('/medicines/reminders/new') },
    { icon: 'scan-outline',               label: 'Medicine Scanner', onPress: () => router.push('/medicines/scanner') },
  ];



  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Medicine & Actions</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Detected Medicines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Medicines</Text>
          {MOCK_DETECTED_MEDICINES.map((m, i) => (
            <View key={i} style={styles.medicineCard}>
              <View style={styles.medIconWrap}>
                <Ionicons name={m.icon} size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{m.name}</Text>
                <Text style={styles.medDosage}>{m.dosage}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Medicine Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {medicineActions.map((a, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
              onPress={a.onPress}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name={a.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Done CTA */}
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push('/(tabs)/reports')}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Done — Back to Reports</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Text style={styles.secondaryBtnText}>Go to Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn:        { padding: 4 },
  headerTitle:    { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  body:           { padding: 16, gap: 16, paddingBottom: 40 },
  section:        { gap: 8 },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  medicineCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  medIconWrap:    { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  medName:        { fontSize: 14, fontWeight: '600', color: Colors.text },
  medDosage:      { fontSize: 12, color: Colors.textMuted },
  actionRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  actionIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  actionLabel:    { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text },
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn:   { alignItems: 'center', paddingVertical: 12 },
  secondaryBtnText:{ fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
