/**
 * app/medicine-actions.tsx  — Medicine & Actions Screen (Screen 5 in flow)
 *
 * Shows: Detected medicines (passed from ai-summary via route params), action shortcuts.
 * This is the final screen of the reports flow.
 */

import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import type { DetectedMedicine } from '@/types/Report/reportype';

type ActionItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export default function MedicineActionsScreen() {
  const { id, detectedMedicines: detectedMedicinesRaw } =
    useLocalSearchParams<{ id?: string; detectedMedicines?: string }>();

  // Parse detected medicines passed from ai-summary via route params
  const detectedMedicines: DetectedMedicine[] = (() => {
    if (!detectedMedicinesRaw) return [];
    try { return JSON.parse(detectedMedicinesRaw); } catch { return []; }
  })();

  const medicineActions: ActionItem[] = [
    { icon: 'information-circle-outline', label: 'View Medicine Details',  onPress: () => router.push('/medicines/browse') },
    { icon: 'flask-outline',              label: 'Check Drug Interactions', onPress: () => router.push('/medicines/check-interactions') },
    { icon: 'alarm-outline',              label: 'Add Medicine Reminder',   onPress: () => router.push('/medicines/reminders/new') },
    { icon: 'scan-outline',               label: 'Medicine Scanner',        onPress: () => router.push('/medicines/scanner') },
  ];

  // Icon to use per detected medicine type
  const typeIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
    recommended: 'checkmark-circle-outline',
    mentioned:   'information-circle-outline',
    avoid:       'warning-outline',
  };
  const typeColor: Record<string, string> = {
    recommended: Colors.primary,
    mentioned:   '#6B7280',
    avoid:       '#DC2626',
  };

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

        {/* Detected / Recommended Medicines */}
        {detectedMedicines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detected Medicines</Text>
            {detectedMedicines.map((m, i) => (
              <View key={i} style={styles.medicineCard}>
                <View style={[styles.medIconWrap, { backgroundColor: (typeColor[m.type] ?? Colors.primary) + '18' }]}>
                  <Ionicons
                    name={typeIcon[m.type] ?? 'medkit-outline'}
                    size={22}
                    color={typeColor[m.type] ?? Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{m.name}</Text>
                  {m.reason ? (
                    <Text style={styles.medDosage}>{m.reason}</Text>
                  ) : null}
                </View>
                {m.type === 'avoid' && (
                  <View style={styles.avoidBadge}>
                    <Text style={styles.avoidBadgeText}>Avoid</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* No medicines found state */}
        {detectedMedicines.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No medicines detected in this report.</Text>
          </View>
        )}

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
  safe:            { flex: 1, backgroundColor: Colors.bg },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn:         { padding: 4 },
  headerTitle:     { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  body:            { padding: 16, gap: 16, paddingBottom: 40 },
  section:         { gap: 8 },
  sectionTitle:    { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  medicineCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  medIconWrap:     { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  medName:         { fontSize: 14, fontWeight: '600', color: Colors.text },
  medDosage:       { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  avoidBadge:      { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  avoidBadgeText:  { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  emptyCard:       { alignItems: 'center', gap: 10, padding: 24, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  emptyText:       { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  actionRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  actionIconWrap:  { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  actionLabel:     { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text },
  primaryBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 16 },
  primaryBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn:    { alignItems: 'center', paddingVertical: 12 },
  secondaryBtnText:{ fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
