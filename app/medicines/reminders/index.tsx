/**
 * app/medicines/reminders.tsx
 *
 * Medicine Reminder — dedicated screen.
 * Follows the reminder flow from the design doc (Image 2):
 *   1. My Medicines list     — GET /api/user/medicines      (~0.5–1.0s)
 *   2. Set Reminder form     — POST /api/reminders          (~0.8–1.2s)
 *   3. Reminder Created      — success state
 *   4. Today's Reminders     — GET /api/reminders/today     (~0.5–1.0s)
 *   5. Reminder Notification — push (no API call, Firebase/OneSignal)
 *   6. Mark as Taken/Missed  — POST /api/reminders/:id/taken|missed (~0.3–0.6s)
 *   7. History               — GET /api/reminders/history   (~0.5–1.0s)
 *   8. Edit / Delete         — PUT|DELETE /api/reminders/:id (~0.3–0.6s)
 *
 * All data is mock; replace stubs with real API calls.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  Switch,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import { ENDPOINTS } from '@/constants/api';
import { medicineApiCall } from '@/services/Medicineapiclient';
import { requestNotificationPermissions, cancelReminderNotification } from '@/utils/notifications';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ReminderTab = 'today' | 'history';
type WhenToTake = 'before_food' | 'after_food' | 'with_food' | 'bedtime';
type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';
type ReminderStatus = 'upcoming' | 'taken' | 'missed' | 'cancelled';

interface Reminder {
  id: string;
  medicineName: string;
  time: string;
  frequency: Frequency;
  whenToTake: WhenToTake;
  enabled: boolean;
  status?: ReminderStatus;
}

interface HistoryItem {
  id: string;
  date: string;
  medicineName: string;
  time: string;
  status: 'taken' | 'missed';
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const WHEN_LABELS: Record<WhenToTake, string> = {
  before_food: 'Before Food',
  after_food: 'After Food',
  with_food: 'With Food',
  bedtime: 'At Bedtime',
};

const FREQ_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

// ← plug in your API: GET /api/reminders/today
const MOCK_TODAY_REMINDERS: Reminder[] = [
  { id: 'r1', medicineName: 'Metformin 500mg', time: '08:00 AM', frequency: 'daily', whenToTake: 'after_food', enabled: true, status: 'upcoming' },
  { id: 'r2', medicineName: 'Vitamin D3',      time: '08:00 PM', frequency: 'daily', whenToTake: 'after_food', enabled: true, status: 'upcoming' },
];

// ← plug in your API: GET /api/reminders/history
const MOCK_HISTORY: HistoryItem[] = [
  { id: 'h1', date: '01 Jun 2026', medicineName: 'Metformin 500mg', time: '08:00 AM', status: 'taken' },
  { id: 'h2', date: '01 Jun 2026', medicineName: 'Vitamin D3',      time: '08:00 PM', status: 'missed' },
  { id: 'h3', date: '31 May 2026', medicineName: 'Metformin 500mg', time: '08:00 AM', status: 'taken' },
];

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  upcoming:  { color: '#64748B', bg: '#F1F5F9', label: 'Upcoming' },
  taken:     { color: '#16A34A', bg: '#F0FDF4', label: 'Taken' },
  missed:    { color: '#DC2626', bg: '#FEF2F2', label: 'Missed' },
  cancelled: { color: '#94A3B8', bg: '#F8FAFC', label: 'Cancelled' },
};

// ─── MARK AS TAKEN MODAL ──────────────────────────────────────────────────────
function MarkTakenModal({ reminder, onTaken, onMissed, onClose }: { reminder: Reminder | null; onTaken: () => void; onMissed: () => void; onClose: () => void }) {
  if (!reminder) return null;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Reminder Details</Text>
          <Pressable onPress={onClose} hitSlop={8}><Ionicons name="close" size={22} color="#64748B" /></Pressable>
        </View>
        <View style={styles.markPad}>
          {/* Medicine info */}
          <View style={styles.reminderDetailCard}>
            <View style={styles.reminderDetailIcon}>
              <Ionicons name="medical-outline" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderDetailName}>{reminder.medicineName}</Text>
              <Text style={styles.reminderDetailMeta}>Time: {reminder.time}</Text>
              <Text style={styles.reminderDetailMeta}>When to Take: {WHEN_LABELS[reminder.whenToTake]}</Text>
            </View>
          </View>
          <Text style={styles.markQuestion}>Mark as Taken?</Text>
          <View style={styles.markBtnRow}>
            <Pressable style={styles.takenBtn} onPress={onTaken}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.takenBtnText}>Taken</Text>
            </Pressable>
            <Pressable style={styles.missedBtn} onPress={onMissed}>
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.missedBtnText}>Missed</Text>
            </Pressable>
          </View>
          <Pressable style={styles.cancelMarkBtn} onPress={onClose}>
            <Text style={styles.cancelMarkText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── EDIT REMINDER MODAL ──────────────────────────────────────────────────────
function EditReminderModal({ reminder, onSave, onDelete, onClose }: { reminder: Reminder | null; onSave: (r: Reminder) => void; onDelete: (id: string) => void; onClose: () => void }) {
  if (!reminder) return null;
  const freqOptions: Frequency[] = ['daily', 'weekly', 'monthly', 'custom'];
  const whenOptions: WhenToTake[] = ['before_food', 'after_food', 'with_food', 'bedtime'];
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Reminder</Text>
          <Pressable onPress={onClose} hitSlop={8}><Ionicons name="close" size={22} color="#64748B" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.editPad}>
          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Medicine</Text>
            <Text style={styles.editValue}>{reminder.medicineName}</Text>
          </View>
          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Time</Text>
            <Pressable style={styles.editPicker} onPress={() => {
              // Time picker: integrate @react-native-community/datetimepicker
              // For now shows current value; replace with DateTimePicker component
            }}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.editPickerText}>{reminder.time}</Text>
            </Pressable>
          </View>
          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Frequency</Text>
            <View style={styles.pillRow}>
              {freqOptions.map((f) => (
                <Pressable key={f} style={[styles.selPill, reminder.frequency === f && styles.selPillActive]}>
                  <Text style={[styles.selPillText, reminder.frequency === f && styles.selPillTextActive]}>{FREQ_LABELS[f]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.editRow}>
            <Text style={styles.editLabel}>When to Take</Text>
            <View style={styles.pillRow}>
              {whenOptions.map((w) => (
                <Pressable key={w} style={[styles.selPill, reminder.whenToTake === w && styles.selPillActive]}>
                  <Text style={[styles.selPillText, reminder.whenToTake === w && styles.selPillTextActive]}>{WHEN_LABELS[w]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable style={styles.primaryBtn} onPress={() => { onSave(reminder); onClose(); }}>
            <Text style={styles.primaryBtnText}>Update Reminder</Text>
          </Pressable>
          <Pressable style={styles.deleteBtn} onPress={() => { onDelete(reminder.id); onClose(); }}>
            <Text style={styles.deleteBtnText}>Delete Reminder</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function RemindersScreen() {
  const [tab, setTab] = useState<ReminderTab>('today');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [markingReminder, setMarkingReminder] = useState<Reminder | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      if (tab === 'today') {
        const res = await medicineApiCall<any>(ENDPOINTS.remindersToday);
        const data = res?.data || res?.reminders || res || [];
        const list = Array.isArray(data) ? data : [];
        setReminders(list.map((r: any) => ({
          id: String(r.id),
          medicineName: r.medicine_name ?? r.medicineName ?? '',
          time: r.reminder_time ?? r.time ?? '',
          frequency: r.frequency ?? 'daily',
          whenToTake: r.when_to_take ?? r.whenToTake ?? 'after_food',
          enabled: r.is_active ?? true,
          status: (r.status === 'active' || !r.status) ? 'upcoming' : r.status.toLowerCase()
        })));
      } else {
        const res = await medicineApiCall<any>(ENDPOINTS.reminderHistory);
        const data = res?.data || res?.history || res || [];
        const list = Array.isArray(data) ? data : [];
        setHistory(list.map((h: any) => {
          const evtTime = h.event_time || h.created_at;
          const dt = evtTime ? new Date(evtTime) : null;
          return {
            id: String(h.id),
            date: dt ? dt.toLocaleDateString() : 'Unknown Date',
            medicineName: h.medicine_name ?? h.medicineName ?? `Reminder #${h.reminder_id || 'Unknown'}`,
            time: h.reminder_time ?? h.time ?? (dt ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
            status: h.event?.toLowerCase() ?? h.status?.toLowerCase() ?? 'taken'
          };
        }));
      }
    } catch (e: any) {
      console.error('[Reminders] Fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    requestNotificationPermissions().catch(console.warn);
  }, [tab]);

  const handleMark = (r: Reminder) => setMarkingReminder(r);

  const handleTaken = async () => {
    if (!markingReminder) return;
    try {
      await medicineApiCall(ENDPOINTS.reminderTaken(markingReminder.id), { method: 'POST' });
      setReminders((prev) => prev.map((r) => r.id === markingReminder.id ? { ...r, status: 'taken' } : r));
      await cancelReminderNotification(markingReminder.id).catch(console.warn);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to mark as taken');
    }
    setMarkingReminder(null);
  };

  const handleMissed = async () => {
    if (!markingReminder) return;
    try {
      await medicineApiCall(ENDPOINTS.reminderMissed(markingReminder.id), { method: 'POST' });
      setReminders((prev) => prev.map((r) => r.id === markingReminder.id ? { ...r, status: 'missed' } : r));
      await cancelReminderNotification(markingReminder.id).catch(console.warn);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to mark as missed');
    }
    setMarkingReminder(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await medicineApiCall(ENDPOINTS.reminderDelete(id), { method: 'DELETE' });
      setReminders((prev) => prev.filter((r) => r.id !== id));
      await cancelReminderNotification(id).catch(console.warn);
      Alert.alert('Deleted', 'Reminder removed');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to delete reminder');
    }
  };

  const handleSave = async (r: Reminder) => {
    try {
      await medicineApiCall(ENDPOINTS.reminderUpdate(r.id), {
        method: 'PUT',
        body: r,
      });
      setReminders((prev) => prev.map((rem) => rem.id === r.id ? r : rem));
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Medicine Reminders</Text>
        <Pressable onPress={() => router.push('/medicines/reminders/new')} hitSlop={8}>
          <Ionicons name="add" size={26} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['today', 'history'] as ReminderTab[]).map((t) => (
          <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'today' ? "Today's Reminders" : 'History'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Today's reminders */}
      {tab === 'today' && (
        <ScrollView contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}>
          {reminders.map((r) => {
            const st = STATUS_CFG[r.status ?? 'upcoming'];
            return (
              <View key={r.id} style={styles.reminderCard}>
                <View style={styles.reminderCardLeft}>
                  <View style={[styles.reminderCardIcon, { backgroundColor: Colors.primary + '15' }]}>
                    <Ionicons name="medical-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderName}>{r.medicineName}</Text>
                    <Text style={styles.reminderMeta}>{r.time} · {WHEN_LABELS[r.whenToTake] ?? r.whenToTake}</Text>
                    <View style={[styles.statusPill, { backgroundColor: st?.bg ?? '#E2E8F0' }]}>
                      <Text style={[styles.statusText, { color: st?.color ?? '#475569' }]}>{st?.label ?? r.status}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reminderCardActions}>
                  {r.status === 'upcoming' && (
                    <Pressable style={styles.markBtn} onPress={() => handleMark(r)}>
                      <Text style={styles.markBtnText}>Mark</Text>
                    </Pressable>
                  )}
                  <Pressable hitSlop={8} onPress={() => setEditingReminder(r)}>
                    <Ionicons name="pencil-outline" size={17} color="#94A3B8" />
                  </Pressable>
                </View>
              </View>
            );
          })}
          <Pressable style={styles.addReminderRow} onPress={() => router.push('/medicines/reminders/new')}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addReminderText}>+ Add Reminder</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* History */}
      {tab === 'history' && (
        <FlatList
          data={history}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listPad}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const st = STATUS_CFG[item.status as keyof typeof STATUS_CFG];
            return (
              <View style={styles.historyCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={styles.historyName}>{item.medicineName}</Text>
                  <Text style={styles.historyTime}>{item.time}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: st?.bg ?? '#E2E8F0' }]}>
                  {item.status === 'taken'
                    ? <Ionicons name="checkmark-circle" size={13} color={st?.color ?? '#475569'} />
                    : <Ionicons name="close-circle" size={13} color={st?.color ?? '#475569'} />}
                  <Text style={[styles.statusText, { color: st?.color ?? '#475569' }]}>{st?.label ?? item.status}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modals */}
      {markingReminder && (
        <MarkTakenModal
          reminder={markingReminder}
          onTaken={handleTaken}
          onMissed={handleMissed}
          onClose={() => setMarkingReminder(null)}
        />
      )}
      {editingReminder && (
        <EditReminderModal
          reminder={editingReminder}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingReminder(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F1F5F9' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#0F172A', marginHorizontal: 8 },

  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  tabBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabBtnText: { fontSize: 14, fontWeight: '500', color: '#94A3B8' },
  tabBtnTextActive: { color: Colors.primary, fontWeight: '700' },

  listPad: { padding: 16, gap: 10 },

  reminderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14, gap: 10 },
  reminderCardLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  reminderCardIcon: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  reminderName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  reminderMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  reminderCardActions: { alignItems: 'center', gap: 10 },
  markBtn: { backgroundColor: Colors.primary + '15', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  markBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  addReminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary + '40', borderStyle: 'dashed', paddingVertical: 14 },
  addReminderText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14 },
  historyDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  historyName: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginTop: 2 },
  historyTime: { fontSize: 12, color: '#94A3B8', marginTop: 1 },

  // Modals
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

  markPad: { padding: 24, gap: 20, alignItems: 'center' },
  reminderDetailCard: { flexDirection: 'row', gap: 14, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, width: '100%' },
  reminderDetailIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  reminderDetailName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  reminderDetailMeta: { fontSize: 13, color: '#64748B', marginTop: 3 },
  markQuestion: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  markBtnRow: { flexDirection: 'row', gap: 14, width: '100%' },
  takenBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 14 },
  takenBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  missedBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#DC2626', borderRadius: 14, paddingVertical: 14 },
  missedBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelMarkBtn: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  cancelMarkText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  editPad: { padding: 16, gap: 16 },
  editRow: { gap: 8 },
  editLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  editValue: { fontSize: 15, color: '#334155' },
  editPicker: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 12 },
  editPickerText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selPill: { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  selPillActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  selPillText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  selPillTextActive: { color: Colors.primary, fontWeight: '700' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 15 },
  deleteBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});
