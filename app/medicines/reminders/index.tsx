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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { CustomTimePicker } from '@/components/medicines/CustomTimePicker';
import { requestNotificationPermissions } from '@/utils/notifications';
import {
  getTodaysReminders,
  getAllReminders,
  getReminderHistory,
  markReminderTaken,
  markReminderMissed,
  undoReminderTaken,
  updateReminder,
  deleteReminder,
  type Reminder,
  type OccurrenceStatus,
} from '@/services/medicineTabApi';

type ReminderTab = 'today' | 'all' | 'history';

const WHEN_LABELS: Record<string, string> = {
  before_food: 'Before Food',
  after_food: 'After Food',
  with_food: 'With Food',
  bedtime: 'At Bedtime',
};

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

const OCCURRENCE_CFG: Record<OccurrenceStatus, { color: string; bg: string; label: string }> = {
  pending: { color: '#64748B', bg: '#F1F5F9', label: 'Upcoming' },
  taken: { color: '#16A34A', bg: '#F0FDF4', label: 'Taken' },
  missed: { color: '#DC2626', bg: '#FEF2F2', label: 'Missed' },
};

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
          <View style={styles.reminderDetailCard}>
            <View style={styles.reminderDetailIcon}>
              <Ionicons name="medical-outline" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderDetailName}>{reminder.medicineName}</Text>
              <Text style={styles.reminderDetailMeta}>Time: {reminder.time}</Text>
              <Text style={styles.reminderDetailMeta}>When to Take: {WHEN_LABELS[reminder.whenToTake] || reminder.whenToTake}</Text>
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

function EditReminderModal({ reminder, onSave, onDelete, onClose }: { reminder: Reminder | null; onSave: (r: Reminder) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [edited, setEdited] = useState<Reminder | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (reminder) setEdited(reminder);
  }, [reminder]);

  if (!edited) return null;

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
            <Text style={styles.editValue}>{edited.medicineName}</Text>
          </View>

          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Time</Text>
            <Pressable style={styles.editPicker} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.editPickerText}>{edited.time}</Text>
            </Pressable>
          </View>

          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Frequency</Text>
            <View style={styles.pillRow}>
              {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                <Pressable
                  key={f}
                  style={[styles.selPill, edited.frequency === f && styles.selPillActive]}
                  onPress={() => setEdited({ ...edited, frequency: f })}
                >
                  <Text style={[styles.selPillText, edited.frequency === f && styles.selPillTextActive]}>{FREQ_LABELS[f]}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Total Tablets Remaining</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="number-pad" 
              value={String(edited.totalCount ?? 0)} 
              onChangeText={(v) => setEdited({ ...edited, totalCount: parseInt(v) || 0 })} 
            />
          </View>

          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Status</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10 }}>
              <Text style={styles.editValue}>{edited.isActive ? 'Active' : 'Paused'}</Text>
              <Switch
                value={edited.isActive}
                onValueChange={(v) => setEdited({ ...edited, isActive: v })}
                trackColor={{ true: Colors.primary }}
              />
            </View>
          </View>

          <Pressable style={styles.primaryBtn} onPress={() => onSave(edited)}>
            <Text style={styles.primaryBtnText}>Save Changes</Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={() => {
            Alert.alert('Delete Reminder', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDelete(edited.id) }
            ]);
          }}>
            <Text style={styles.deleteBtnText}>Delete Reminder</Text>
          </Pressable>
        </ScrollView>
        <CustomTimePicker
          visible={showTimePicker}
          initial={edited.time}
          onConfirm={(t) => setEdited({ ...edited, time: t })}
          onClose={() => setShowTimePicker(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

export default function RemindersScreen() {
  const [tab, setTab] = useState<ReminderTab>('today');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [allReminders, setAllReminders] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<Reminder[]>([]);
  const [markingReminder, setMarkingReminder] = useState<Reminder | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      if (tab === 'today') {
        const data = await getTodaysReminders();
        setReminders(data);
      } else if (tab === 'all') {
        const data = await getAllReminders();
        setAllReminders(data);
      } else {
        const data = await getReminderHistory();
        setHistory(data);
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
    setMarkingReminder(null);
    try {
      await markReminderTaken(markingReminder.id);
      fetchReminders();
    } catch (e) {
      Alert.alert('Error', 'Could not mark as taken.');
    }
  };

  const handleMissed = async () => {
    if (!markingReminder) return;
    setMarkingReminder(null);
    try {
      await markReminderMissed(markingReminder.id);
      fetchReminders();
    } catch (e) {
      Alert.alert('Error', 'Could not mark as missed.');
    }
  };

  const handleUntake = async (id: string) => {
    try {
      await undoReminderTaken(id);
      fetchReminders();
    } catch (e) {
      Alert.alert('Error', 'Could not undo taken status.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id);
      setEditingReminder(null);
      fetchReminders();
    } catch (e) {
      Alert.alert('Error', 'Could not delete reminder.');
    }
  };

  const handleSave = async (r: Reminder) => {
    try {
      await updateReminder(r.id, {
        time: r.time,
        frequency: r.frequency,
        whenToTake: r.whenToTake,
        enabled: r.isActive,
        totalCount: r.totalCount,
      });
      setEditingReminder(null);
      fetchReminders();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const handleRefill = async (r: Reminder) => {
    Alert.prompt(
      'Refill Medicine',
      'Enter the number of new tablets you added:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Refill', 
          onPress: async (val?: string) => {
            if (!val || isNaN(Number(val))) return;
            const added = Number(val);
            const newTotal = (r.totalCount ?? 0) + added;
            try {
              await updateReminder(r.id, { totalCount: newTotal });
              fetchReminders();
            } catch (e) {
              Alert.alert('Error', 'Failed to refill.');
            }
          }
        }
      ],
      'plain-text',
      '',
      'number-pad'
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Medicine Reminders</Text>
        <Pressable onPress={() => router.push('/medicines/reminders/new')} hitSlop={8}>
          <Ionicons name="add" size={26} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {(['today', 'all', 'history'] as ReminderTab[]).map((t) => (
          <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>
              {t === 'today' ? "Today" : t === 'all' ? 'All' : 'History'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'today' && (
        <ScrollView contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}>
          {reminders.map((r) => {
            const st = OCCURRENCE_CFG[r.occurrenceStatus ?? 'pending'] || OCCURRENCE_CFG['pending'];
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
                      <Text style={[styles.statusText, { color: st?.color ?? '#475569' }]}>{st?.label ?? r.occurrenceStatus}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reminderCardActions}>
                  {r.occurrenceStatus === 'pending' && (
                    <Pressable style={styles.markBtn} onPress={() => handleMark(r)}>
                      <Text style={styles.markBtnText}>Mark</Text>
                    </Pressable>
                  )}
                  {r.occurrenceStatus === 'taken' && (
                    <Pressable style={[styles.markBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => handleUntake(r.id)}>
                      <Text style={[styles.markBtnText, { color: '#64748B' }]}>Undo</Text>
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

      {tab === 'all' && (
        <ScrollView contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}>
          {allReminders.map((r) => (
            <View key={r.id} style={[styles.reminderCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.reminderCardLeft}>
                  <View style={[styles.reminderCardIcon, { backgroundColor: Colors.primary + '15' }]}>
                    <Ionicons name="medical-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderName}>{r.medicineName}</Text>
                    <Text style={styles.reminderMeta}>{FREQ_LABELS[r.frequency] ?? r.frequency} · {r.time}</Text>
                    { (r.totalCount !== undefined || r.expiryDate) && (
                      <Text style={[styles.reminderMeta, { marginTop: 4, color: '#64748B', fontWeight: '500' }]}>
                        {[
                          r.totalCount !== undefined ? `${r.totalCount} pills left` : null,
                          r.expiryDate ? `Exp: ${new Date(r.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : null
                        ].filter(Boolean).join(' • ')}
                      </Text>
                    )}
                    
                    {r.needsRefill && !r.tabletsCompleted && (
                      <View style={[styles.statusPill, { backgroundColor: '#FEF9E8' }]}>
                        <Ionicons name="warning-outline" size={12} color={Colors.warning} />
                        <Text style={[styles.statusText, { color: Colors.warning }]}>Refill Soon ({r.totalCount} left)</Text>
                      </View>
                    )}
                    {r.tabletsCompleted && (
                      <View style={[styles.statusPill, { backgroundColor: '#FEF2F2' }]}>
                        <Ionicons name="alert-circle-outline" size={12} color={Colors.danger} />
                        <Text style={[styles.statusText, { color: Colors.danger }]}>Out of Stock</Text>
                      </View>
                    )}
                    {r.isExpired && (
                      <View style={[styles.statusPill, { backgroundColor: '#FEF2F2' }]}>
                        <Ionicons name="alert-circle-outline" size={12} color={Colors.danger} />
                        <Text style={[styles.statusText, { color: Colors.danger }]}>Expired</Text>
                      </View>
                    )}
                    {r.remindersPaused && !r.tabletsCompleted && !r.isExpired && (
                      <View style={[styles.statusPill, { backgroundColor: '#F1F5F9' }]}>
                        <Ionicons name="pause-circle-outline" size={12} color="#64748B" />
                        <Text style={[styles.statusText, { color: '#64748B' }]}>Paused: {r.pausedReason}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.reminderCardActions}>
                  <Pressable hitSlop={8} onPress={() => setEditingReminder(r)}>
                    <Ionicons name="pencil-outline" size={17} color="#94A3B8" />
                  </Pressable>
                </View>
              </View>

              {/* Action row for Refill */}
              {r.tabletsCompleted && (
                 <Pressable style={[styles.addReminderRow, { paddingVertical: 10, marginTop: 10, borderColor: Colors.danger + '40' }]} onPress={() => handleRefill(r)}>
                   <Ionicons name="refresh-outline" size={16} color={Colors.danger} />
                   <Text style={[styles.addReminderText, { color: Colors.danger }]}>Refill Now</Text>
                 </Pressable>
              )}
            </View>
          ))}
          <Pressable style={styles.addReminderRow} onPress={() => router.push('/medicines/reminders/new')}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addReminderText}>+ Add Reminder</Text>
          </Pressable>
        </ScrollView>
      )}

      {tab === 'history' && (
        <FlatList
          data={history}
          keyExtractor={(i) => i.id + i.createdAt}
          contentContainerStyle={styles.listPad}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const st = OCCURRENCE_CFG[item.occurrenceStatus] || { color: '#475569', bg: '#E2E8F0', label: item.occurrenceStatus };
            return (
              <View style={styles.historyCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>{item.occurrenceDate || new Date(item.createdAt).toLocaleDateString()}</Text>
                  <Text style={styles.historyName}>{item.medicineName}{(item as any).dosage ? ` (${(item as any).dosage})` : ''}</Text>
                  <Text style={styles.historyTime}>{item.time}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: st?.bg ?? '#E2E8F0' }]}>
                  {item.occurrenceStatus === 'taken'
                    ? <Ionicons name="checkmark-circle" size={13} color={st?.color ?? '#475569'} />
                    : <Ionicons name="close-circle" size={13} color={st?.color ?? '#475569'} />}
                  <Text style={[styles.statusText, { color: st?.color ?? '#475569' }]}>{st?.label ?? item.occurrenceStatus}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <View style={{ paddingVertical: 60, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="time-outline" size={48} color="#CBD5E1" />
                <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: '#64748B' }}>No History Yet</Text>
                <Text style={{ marginTop: 6, fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 32 }}>
                  Your medicine intake history will appear here once you start taking or missing reminders.
                </Text>
              </View>
            ) : null
          }
        />
      )}

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
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 15, color: '#0F172A' },
});
