/**
 * components/medicine/MedicineReminder.tsx
 * Full Medicine Reminder feature:
 *  - My Medicines list
 *  - Set Reminder form
 *  - Today's Reminders with Taken / Missed actions
 *  - History view
 *  - Edit / Delete reminder
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getUserMedicines,
  getTodaysReminders,
  createReminder,
  markReminderTaken,
  markReminderMissed,
  getReminderHistory,
  deleteReminder,
} from '@/services/medicineTabApi';
import type {
  Medicine,
  Reminder,
  ReminderFrequency,
  WhenToTake,
  ReminderStatus,
} from '@/services/medicineTabApi';

// ─── Constants ────────────────────────────────────────────────
const FREQUENCIES: { label: string; value: ReminderFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom', value: 'custom' },
];

const WHEN_OPTIONS: { label: string; value: WhenToTake; icon: string }[] = [
  { label: 'Before Food', value: 'before_food', icon: 'restaurant-outline' },
  { label: 'After Food', value: 'after_food', icon: 'fast-food-outline' },
  { label: 'With Food', value: 'with_food', icon: 'nutrition-outline' },
  { label: 'Bedtime', value: 'bedtime', icon: 'moon-outline' },
];

const STATUS_CONFIG: Record<ReminderStatus, { color: string; icon: string; label: string }> = {
  upcoming: { color: Colors.info, icon: 'time-outline', label: 'Upcoming' },
  taken: { color: Colors.success, icon: 'checkmark-circle', label: 'Taken' },
  missed: { color: Colors.danger, icon: 'close-circle', label: 'Missed' },
  cancelled: { color: Colors.textMuted, icon: 'ban-outline', label: 'Cancelled' },
};

// ─── Reminder Card ─────────────────────────────────────────────
function ReminderCard({
  reminder,
  onTaken,
  onMissed,
  onDelete,
}: {
  reminder: Reminder;
  onTaken?: () => void;
  onMissed?: () => void;
  onDelete?: () => void;
}) {
  const cfg = STATUS_CONFIG[reminder.status];
  const whenLabel = WHEN_OPTIONS.find((w) => w.value === reminder.whenToTake)?.label ?? '';

  return (
    <Card style={styles.reminderCard}>
      <View style={styles.reminderTop}>
        <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderName}>{reminder.medicineName}</Text>
          <Text style={styles.reminderMeta}>
            {reminder.time} · {whenLabel} · {reminder.frequency}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + '20' }]}>
          <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        {onDelete && (
          <Pressable onPress={onDelete} style={{ marginLeft: 4 }}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </Pressable>
        )}
      </View>

      {reminder.status === 'upcoming' && onTaken && onMissed && (
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={onTaken}>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Taken</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: Colors.danger }]} onPress={onMissed}>
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Missed</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

// ─── Set Reminder Form ─────────────────────────────────────────
function SetReminderModal({
  medicines,
  visible,
  onClose,
  onCreated,
}: {
  medicines: Medicine[];
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [time, setTime] = useState('08:00 AM');
  const [frequency, setFrequency] = useState<ReminderFrequency>('daily');
  const [when, setWhen] = useState<WhenToTake>('after_food');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const hours = ['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '12:00 PM', '02:00 PM', '06:00 PM', '08:00 PM', '10:00 PM'];

  const handleSave = async () => {
    if (!selectedMed) {
      Alert.alert('Please select a medicine.');
      return;
    }
    setSaving(true);
    try {
      await createReminder({ medicineId: selectedMed.id, time, frequency, whenToTake: when });
      setSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSelectedMed(null);
    setTime('08:00 AM');
    setFrequency('daily');
    setWhen('after_food');
    setSuccess(false);
  };

  const handleDone = () => {
    reset();
    onCreated();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        {success ? (
          // Success state
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Reminder Created Successfully!</Text>
            <Text style={styles.successSub}>
              {selectedMed?.name} · {time} · {WHEN_OPTIONS.find((w) => w.value === when)?.label}
            </Text>
            <Button title="Done" onPress={handleDone} style={{ marginTop: 24 }} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sheetTitle}>Set Reminder</Text>

            {/* Medicine picker */}
            <Text style={styles.formLabel}>Select Medicine</Text>
            {medicines.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setSelectedMed(m)}
                style={[
                  styles.medPickerRow,
                  selectedMed?.id === m.id && { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
                ]}
              >
                <Ionicons name="medkit-outline" size={18} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.medPickerName}>{m.name}</Text>
                  <Text style={styles.medPickerType}>{m.type}</Text>
                </View>
                {selectedMed?.id === m.id && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </Pressable>
            ))}

            {/* Time picker */}
            <Text style={styles.formLabel}>Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {hours.map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setTime(h)}
                  style={[styles.timeChip, time === h && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                >
                  <Text style={[styles.timeChipText, time === h && { color: '#fff' }]}>{h}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Frequency */}
            <Text style={styles.formLabel}>Frequency</Text>
            <View style={styles.optionRow}>
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f.value}
                  onPress={() => setFrequency(f.value)}
                  style={[styles.optionChip, frequency === f.value && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                >
                  <Text style={[styles.optionChipText, frequency === f.value && { color: '#fff' }]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* When to Take */}
            <Text style={styles.formLabel}>When to Take</Text>
            <View style={styles.whenGrid}>
              {WHEN_OPTIONS.map((w) => (
                <Pressable
                  key={w.value}
                  onPress={() => setWhen(w.value)}
                  style={[styles.whenChip, when === w.value && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                >
                  <Ionicons name={w.icon as any} size={18} color={when === w.value ? '#fff' : Colors.primary} />
                  <Text style={[styles.whenChipText, when === w.value && { color: '#fff' }]}>{w.label}</Text>
                </Pressable>
              ))}
            </View>

            <Button title={saving ? 'Saving…' : 'Save Reminder'} onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
type Tab = 'today' | 'history';

export default function MedicineReminder() {
  const [tab, setTab] = useState<Tab>('today');
  const [myMedicines, setMyMedicines] = useState<Medicine[]>([]);
  const [todays, setTodays] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    const [meds, rem, hist] = await Promise.all([
      getUserMedicines(),
      getTodaysReminders(),
      getReminderHistory(),
    ]);
    setMyMedicines(meds);
    setTodays(rem);
    setHistory(hist);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleTaken = async (id: string) => {
    await markReminderTaken(id);
    setTodays((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'taken' } : r)));
  };

  const handleMissed = async (id: string) => {
    await markReminderMissed(id);
    setTodays((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'missed' } : r)));
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Reminder', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReminder(id);
          setTodays((prev) => prev.filter((r) => r.id !== id));
          setHistory((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textMuted, marginTop: 8 }}>Loading reminders…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <Pressable style={[styles.tabItem, tab === 'today' && styles.tabActive]} onPress={() => setTab('today')}>
          <Ionicons name="today-outline" size={16} color={tab === 'today' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === 'today' && { color: Colors.primary }]}>Today</Text>
        </Pressable>
        <Pressable style={[styles.tabItem, tab === 'history' && styles.tabActive]} onPress={() => setTab('history')}>
          <Ionicons name="time-outline" size={16} color={tab === 'history' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === 'history' && { color: Colors.primary }]}>History</Text>
        </Pressable>
      </View>

      {/* Summary stats */}
      {tab === 'today' && (
        <View style={styles.statsRow}>
          {(['upcoming', 'taken', 'missed'] as ReminderStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = todays.filter((r) => r.status === s).length;
            return (
              <View key={s} style={[styles.statCard, { borderColor: cfg.color + '40' }]}>
                <Text style={[styles.statNumber, { color: cfg.color }]}>{count}</Text>
                <Text style={styles.statLabel}>{cfg.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* List */}
      <FlatList
        data={tab === 'today' ? todays : history}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: Spacing.md, gap: 10 }}
        renderItem={({ item }) => (
          <ReminderCard
            reminder={item}
            onTaken={tab === 'today' ? () => handleTaken(item.id) : undefined}
            onMissed={tab === 'today' ? () => handleMissed(item.id) : undefined}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="alarm-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>
              {tab === 'today' ? 'No reminders for today.' : 'No reminder history.'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setShowForm(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <SetReminderModal
        medicines={myMedicines}
        visible={showForm}
        onClose={() => setShowForm(false)}
        onCreated={loadData}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { color: Colors.textMuted, marginTop: 4 },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  tabActive: { backgroundColor: Colors.bg, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  reminderCard: { gap: 8 },
  reminderTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  reminderName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  reminderMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // Modal
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 36,
    maxHeight: '88%',
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 },

  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, marginTop: 12 },

  medPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: 6,
  },
  medPickerName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  medPickerType: { fontSize: 12, color: Colors.textMuted },

  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  timeChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },

  whenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  whenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  whenChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },

  successContainer: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  successSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
