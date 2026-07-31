/**
 * app/medicines/reminders/new.tsx
 *
 * Add New Reminder screen.
 * Accepts optional params: medicineId, medicineName
 *
 * API:
 *   GET  /api/user/medicines  — getUserMedicines()
 *   POST /api/reminders       — createReminder()
 *
 * Time selection: pill chips for 13 preset slots + "Custom" chip that
 * opens a simple HH / MM / AM-PM spinner — keeps the same "08:00 AM"
 * string format the API already accepts successfully.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { NotificationCenter } from '@/services/NotificationService';
import { scheduleReminderNotification, parseTimeStringToNextDate } from '@/utils/notifications';
import {
  getUserMedicines,
  searchMedicines,
  createReminder,
  type Medicine,
  type ReminderFrequency,
  type WhenToTake,
} from '@/services/medicineTabApi';
import { CustomTimePicker } from '@/components/medicines/CustomTimePicker';

// ─── LABELS ──────────────────────────────────────────────────────────────────
const FREQ_OPTIONS: { value: ReminderFrequency; label: string; icon: string }[] = [
  { value: 'daily',   label: 'Daily',   icon: 'sunny-outline'          },
  { value: 'weekly',  label: 'Weekly',  icon: 'calendar-outline'       },
  { value: 'monthly', label: 'Monthly', icon: 'calendar-number-outline' },
];

const WHEN_OPTIONS: { value: WhenToTake; label: string; icon: string }[] = [
  { value: 'before_food', label: 'Before Food', icon: 'time-outline'      },
  { value: 'after_food',  label: 'After Food',  icon: 'restaurant-outline' },
  { value: 'with_food',   label: 'With Food',   icon: 'fast-food-outline'  },
  { value: 'bedtime',     label: 'At Bedtime',  icon: 'moon-outline'       },
];

// Preset time slots — same "HH:MM AM/PM" format the API accepts
const TIME_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '06:00 PM', '08:00 PM', '10:00 PM',
];

// ─── MEDICINE PICKER MODAL ───────────────────────────────────────────────────
function MedicinePicker({
  visible,
  medicines,
  onSelect,
  onClose,
}: {
  visible: boolean;
  medicines: Medicine[];
  onSelect: (m: Medicine) => void;
  onClose: () => void;
}) {
  const [customName, setCustomName] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live search the global database when typing
  useEffect(() => {
    if (customName.trim().length > 2) {
      setIsSearching(true);
      const delayDebounce = setTimeout(() => {
        searchMedicines(customName.trim(), 1, 15)
          .then((res) => setSearchResults(res.medicines))
          .catch(() => setSearchResults([]))
          .finally(() => setIsSearching(false));
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [customName]);

  const displayList = customName.trim().length > 2 ? searchResults : medicines;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Medicine</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color="#64748B" />
          </Pressable>
        </View>

        {/* ── SEARCH OR CUSTOM MEDICINE INPUT ── */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>
            Search or Add Custom
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, height: 48, backgroundColor: '#fff', fontSize: 15 }}
              placeholder="Search global database..."
              value={customName}
              onChangeText={setCustomName}
            />
            <Pressable
              style={{ backgroundColor: Colors.primary, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 10, opacity: customName.trim() ? 1 : 0.5 }}
              disabled={!customName.trim()}
              onPress={() => {
                if (customName.trim()) {
                  onSelect({
                    id: `custom_${Date.now()}`,
                    name: customName.trim(),
                    type: 'Custom',
                    category: '',
                    uses: '',
                    dosage: '',
                    sideEffects: [],
                    prescriptionType: 'OTC',
                  });
                  setCustomName('');
                  onClose();
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Add Custom</Text>
            </Pressable>
          </View>
        </View>

        {isSearching && (
          <View style={{ padding: 20, alignItems: 'center' }}>
             <ActivityIndicator size="small" color={Colors.primary} />
             <Text style={{ color: '#94A3B8', marginTop: 8 }}>Searching...</Text>
          </View>
        )}

        {!isSearching && (
          <FlatList
            data={displayList}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            ListHeaderComponent={() => (
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 }}>
                {customName.trim().length > 2 ? 'Search Results' : 'My Saved Medicines'}
              </Text>
            )}
            ListEmptyComponent={() => (
              <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 20 }}>
                {customName.trim().length > 2 ? 'No exact matches. You can tap "Add Custom".' : 'No saved medicines yet.'}
              </Text>
            )}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.medRow, pressed && { opacity: 0.7 }]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <View style={styles.medRowIcon}>
                  <Ionicons name="medical-outline" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medRowName}>{item.name}</Text>
                  <Text style={styles.medRowSub}>{item.type} {item.category ? `· ${item.category}` : ''}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function AddReminderScreen() {
  const params = useLocalSearchParams<{ medicineId?: string; medicineName?: string }>();

  const [medicines,         setMedicines]         = useState<Medicine[]>([]);
  const [loadingMeds,       setLoadingMeds]       = useState(true);
  const [selectedMed,       setSelectedMed]       = useState<Medicine | null>(null);
  const [pickerVisible,     setPickerVisible]     = useState(false);
  const [time,              setTime]              = useState<string>('08:00 AM');
  const [customPickerOpen,  setCustomPickerOpen]  = useState(false);
  const [isCustomTime,      setIsCustomTime]      = useState(false);
  const [frequency,         setFrequency]         = useState<ReminderFrequency>('daily');
  const [whenToTake,        setWhenToTake]        = useState<WhenToTake>('after_food');
  const [saving,            setSaving]            = useState(false);
  const [success,           setSuccess]           = useState(false);

  // 1. Fetch 'My Medicines' list in the background on mount
  useEffect(() => {
    getUserMedicines()
      .then((meds) => {
        setMedicines(meds);
        // If the params specify a medicine that exists in the user's saved list, select the full object
        if (params.medicineId) {
          const found = meds.find((m) => m.id === params.medicineId);
          if (found) setSelectedMed(found);
        }
      })
      .catch((e) => {
        console.error('[ReminderNew] getUserMedicines error', e);
        setMedicines([]);
      })
      .finally(() => setLoadingMeds(false));
  }, []);

  // 2. Immediately pre-fill from params if they change (Reactive for Expo Router)
  useEffect(() => {
    if (params.medicineId || params.medicineName) {
      setSelectedMed((prev) => {
        // Only overwrite if we haven't already loaded the full medicine object from the backend
        if (prev && prev.id === params.medicineId && prev.uses) return prev;
        
        return {
          id: params.medicineId || String(Date.now()),
          name: params.medicineName || 'Unknown',
          type: 'Tablet',
          category: '',
          uses: '',
          dosage: '',
          sideEffects: [],
          prescriptionType: 'OTC',
        };
      });
    }
  }, [params.medicineId, params.medicineName]);

  const handleSelectPreset = (slot: string) => {
    setTime(slot);
    setIsCustomTime(false);
  };

  const handleCustomConfirm = (t: string) => {
    setTime(t);
    setIsCustomTime(true);
  };

  const handleSave = async () => {
    if (!selectedMed) {
      Alert.alert('Missing Info', 'Please select a medicine first.');
      return;
    }
    setSaving(true);
    try {
      const res = await createReminder({
        medicineId: selectedMed.id,
        medicineName: selectedMed.name,
        medicineType: selectedMed.type,
        dosage: selectedMed.dosage,
        time: time,
        frequency,
        whenToTake,
      });
      if (res.success) {
        // Schedule local push notification
        const triggerTime = parseTimeStringToNextDate(time);
        await scheduleReminderNotification(
          res.reminderId,
          "Medicine Time!",
          `Time to take your ${selectedMed.name}${selectedMed.dosage ? ' (' + selectedMed.dosage + ')' : ''}`,
          triggerTime,
          frequency === 'daily' || frequency === 'weekly' ? frequency : 'once'
        );

        // Instantly publish a local notification for global sync
        NotificationCenter.publish({
          id: `med_${res.reminderId}_${time}`,
          category: 'medicine',
          priority: 'MEDIUM',
          status: 'unread',
          title: 'Medicine Reminder',
          message: `It's time to take ${selectedMed.name}`,
          timestamp: new Date().toISOString(),
          action: { type: 'navigate', route: '/medicines/reminders' }
        });

        setSuccess(true);
      } else {
        Alert.alert('Error', res.message || 'Failed to save reminder.');
      }
    } catch (e) {
      console.error('[ReminderNew] createReminder error', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }]} edges={['top', 'bottom']}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Reminder Set!</Text>
        <Text style={styles.successSub}>
          You&apos;ll be reminded to take{'\n'}
          <Text style={{ fontWeight: '700' }}>{selectedMed?.name}</Text> at {time}
        </Text>
        <View style={{ width: '100%', gap: 16, alignItems: 'center', marginTop: 10 }}>
          <Pressable style={[styles.primaryBtn, { width: '100%' }]} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
          <Pressable onPress={() => { setSuccess(false); setSelectedMed(null); setTime('08:00 AM'); setIsCustomTime(false); }}>
            <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>Add Another Reminder</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Add Reminder</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Select Medicine */}
        <Text style={styles.sectionLabel}>Medicine</Text>
        {loadingMeds ? (
          <View style={[styles.selectBtn, { justifyContent: 'center' }]}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <Pressable style={styles.selectBtn} onPress={() => setPickerVisible(true)}>
            <View style={styles.selectBtnIcon}>
              <Ionicons name="medical-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={[styles.selectBtnText, !selectedMed && { color: '#94A3B8' }]} numberOfLines={1}>
              {selectedMed ? selectedMed.name : 'Select a medicine…'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94A3B8" />
          </Pressable>
        )}

        {/* Time Picker */}
        <Text style={styles.sectionLabel}>Reminder Time</Text>

        {/* Preset chips */}
        <View style={styles.pillGrid}>
          {TIME_SLOTS.map((slot) => (
            <Pressable
              key={slot}
              style={[styles.pill, !isCustomTime && time === slot && styles.pillActive]}
              onPress={() => handleSelectPreset(slot)}
            >
              <Ionicons
                name="time-outline"
                size={13}
                color={!isCustomTime && time === slot ? Colors.primary : '#94A3B8'}
              />
              <Text style={[styles.pillText, !isCustomTime && time === slot && styles.pillTextActive]}>
                {slot}
              </Text>
            </Pressable>
          ))}

          {/* Custom chip */}
          <Pressable
            style={[styles.pill, styles.customPill, isCustomTime && styles.pillActive]}
            onPress={() => setCustomPickerOpen(true)}
          >
            <Ionicons name="create-outline" size={13} color={isCustomTime ? Colors.primary : '#64748B'} />
            <Text style={[styles.pillText, isCustomTime && styles.pillTextActive]}>
              {isCustomTime ? time : 'Custom'}
            </Text>
          </Pressable>
        </View>

        {/* Frequency */}
        <Text style={styles.sectionLabel}>Frequency</Text>
        <View style={styles.pillGrid}>
          {FREQ_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              style={[styles.pill, frequency === o.value && styles.pillActive]}
              onPress={() => setFrequency(o.value)}
            >
              <Ionicons
                name={o.icon as any}
                size={16}
                color={frequency === o.value ? Colors.primary : '#94A3B8'}
              />
              <Text style={[styles.pillText, frequency === o.value && styles.pillTextActive]}>
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* When to Take */}
        <Text style={styles.sectionLabel}>When to Take</Text>
        <View style={styles.pillGrid}>
          {WHEN_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              style={[styles.pill, whenToTake === o.value && styles.pillActive]}
              onPress={() => setWhenToTake(o.value)}
            >
              <Ionicons
                name={o.icon as any}
                size={16}
                color={whenToTake === o.value ? Colors.primary : '#94A3B8'}
              />
              <Text style={[styles.pillText, whenToTake === o.value && styles.pillTextActive]}>
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Summary card */}
        {selectedMed && (
          <View style={styles.summaryCard}>
            <Ionicons name="alarm-outline" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryText}>
                Remind me to take <Text style={{ fontWeight: '700' }}>{selectedMed.name}</Text> at{' '}
                <Text style={{ fontWeight: '700' }}>{time}</Text>,{' '}
                {FREQ_OPTIONS.find(f => f.value === frequency)?.label.toLowerCase()},{' '}
                {WHEN_OPTIONS.find(w => w.value === whenToTake)?.label.toLowerCase()}.
              </Text>
            </View>
          </View>
        )}

        {/* Save */}
        <Pressable
          style={[styles.primaryBtn, (!selectedMed || saving) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!selectedMed || saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="alarm-outline" size={16} color="#fff" /><Text style={styles.primaryBtnText}>Set Reminder</Text></>
          }
        </Pressable>

        <View style={{ height: 20 }} />
      </ScrollView>

      <MedicinePicker
        visible={pickerVisible}
        medicines={medicines}
        onSelect={setSelectedMed}
        onClose={() => setPickerVisible(false)}
      />

      <CustomTimePicker
        visible={customPickerOpen}
        initial={time}
        onConfirm={handleCustomConfirm}
        onClose={() => setCustomPickerOpen(false)}
      />
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

  page:         { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 8 },

  selectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#E2E8F0',
    padding: 14, minHeight: 52,
  },
  selectBtnIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  selectBtnText: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },

  pillGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:           {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 99,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 9,
  },
  pillActive:     { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
  pillText:       { fontSize: 13, color: '#64748B', fontWeight: '500' },
  pillTextActive: { color: Colors.primary, fontWeight: '700' },
  customPill:     { borderStyle: 'dashed' },

  summaryCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.primary + '0D',
    borderRadius: 12, borderWidth: 1, borderColor: Colors.primary + '30',
    padding: 14,
  },
  summaryText: { fontSize: 13, color: '#0F172A', lineHeight: 20 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 15, marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Success
  successCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  successSub:   { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 24 },

  // Medicine picker modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  medRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8FAFC', borderRadius: 12,
    padding: 14,
  },
  medRowIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  medRowName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  medRowSub:  { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
