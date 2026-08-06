/**
 * app/medicines/my-medicines.tsx
 *
 * My Medicines — shows all medicines saved by the user.
 * Navigated to after "Save Medicine" from Scanner or Browse.
 *
 * APIs:
 *   GET    /api/user/medicines           — getSavedMedicines()
 *   DELETE /api/user/medicines/:id       — removeSavedMedicine()
 *   POST   /api/reminders               — createReminder() (via Set Reminder)
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors, Radius } from '@/constants/Colors';
import {
  getSavedMedicines,
  removeSavedMedicine,
  type Medicine,
} from '@/services/medicineTabApi';

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bookmark-outline" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No medicines saved yet</Text>
      <Text style={styles.emptySub}>
        Scan a medicine or browse the catalogue and tap Save to add it here.
      </Text>
      <Pressable style={styles.browseBtn} onPress={() => router.push('/medicines/browse')}>
        <Ionicons name="search-outline" size={16} color="#fff" />
        <Text style={styles.browseBtnText}>Browse Medicines</Text>
      </Pressable>
    </View>
  );
}

// ─── MEDICINE CARD ────────────────────────────────────────────────────────────
function MedicineCard({
  med,
  onRemove,
  onReminder,
  onInteraction,
}: {
  med: Medicine;
  onRemove: () => void;
  onReminder: () => void;
  onInteraction: () => void;
}) {
  const rxColor = med.prescriptionType === 'Prescription' ? '#B91C1C' : '#065F46';
  const rxBg = med.prescriptionType === 'Prescription' ? '#FEE2E2' : '#D1FAE5';

  return (
    <View style={styles.card}>
      {/* Top row & details (pressable to view full details) */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: `/medicine/${med.id}`,
            params: { isSaved: 'true' },
          } as any)
        }
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardIcon}>
            <Ionicons name="medical-outline" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.medName}>{med.name}</Text>
            <Text style={styles.medSub}>{med.type} · {med.category}</Text>
          </View>
          <View style={[styles.rxPill, { backgroundColor: rxBg }]}>
            <Text style={[styles.rxText, { color: rxColor }]}>{med.prescriptionType}</Text>
          </View>
        </View>

        {/* Uses */}
        {med.uses ? (
          <Text style={styles.medUses} numberOfLines={2}>{med.uses}</Text>
        ) : null}

        {/* Side effects */}
        {med.sideEffects && med.sideEffects.length > 0 && (
          <View style={styles.sideRow}>
            <Ionicons name="warning-outline" size={12} color="#EA580C" />
            <Text style={styles.sideText} numberOfLines={1}>
              {med.sideEffects.slice(0, 2).join(', ')}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <Pressable style={styles.actionBtn} onPress={onReminder}>
          <Ionicons name="alarm-outline" size={14} color={Colors.primary} />
          <Text style={styles.actionBtnText}>Set Reminder</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onInteraction}>
          <Ionicons name="git-compare-outline" size={14} color={Colors.primary} />
          <Text style={styles.actionBtnText}>Check Interaction</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.removeBtn]}
          onPress={onRemove}
        >
          <Ionicons name="trash-outline" size={14} color={Colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function MyMedicinesScreen() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getSavedMedicines()
        .then((data) => { if (active) setMedicines(data); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, []),
  );

  const handleRemove = (med: Medicine) => {
    Alert.alert(
      'Remove Medicine',
      `Remove ${med.name} from My Medicines?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeSavedMedicine(med.id);
            if (result.success) {
              setMedicines((prev) => prev.filter((m) => m.id !== med.id));
            } else {
              // Don't remove it from local state if the backend delete
              // failed — leaving it in the list keeps the UI honest about
              // what's actually still saved server-side.
              Alert.alert(
                'Remove Failed',
                'Could not remove this medicine. Please check your connection and try again.',
              );
            }
          },
        },
      ],
    );
  };

  const handleReminder = (med: Medicine) => {
    router.push({
      pathname: '/medicines/reminders/new',
      params: { medicineId: med.id, medicineName: med.name },
    });
  };

  const handleInteraction = () => {
    router.push('/medicines/check-interactions');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>My Medicines</Text>
        <Pressable onPress={() => router.push('/medicines/browse')} hitSlop={8}>
          <Ionicons name="add" size={26} color={Colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : medicines.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLabel}>{medicines.length} medicine{medicines.length !== 1 ? 's' : ''} saved</Text>
          {medicines.map((med, idx) => (
            <MedicineCard
              key={`${med.id}_${idx}`}
              med={med}
              onRemove={() => handleRemove(med)}
              onReminder={() => handleReminder(med)}
              onInteraction={handleInteraction}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 17,
    fontWeight: '700', color: '#0F172A', marginHorizontal: 8,
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { padding: 16, gap: 12 },
  countLabel: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 4 },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#E2E8F0',
    padding: 14, gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  medName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  medSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  rxPill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  rxText: { fontSize: 10, fontWeight: '700' },
  medUses: { fontSize: 13, color: '#334155', lineHeight: 19 },
  sideRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sideText: { fontSize: 12, color: '#EA580C', flex: 1 },

  cardActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    backgroundColor: Colors.primary + '10',
    borderRadius: 9, paddingVertical: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  removeBtn: { flex: 0, paddingHorizontal: 12, backgroundColor: '#FEF2F2' },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  browseBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});