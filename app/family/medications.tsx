/**
 * app/family/medications.tsx — Member Medications sub-screen
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  Pressable, Modal, TextInput, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import {
  getMemberMedications,
  addMemberMedication,
  type Medication,
  type MedStatus,
} from '@/services/profileSubScreenApi';

// ── Helpers ───────────────────────────────────────────────────────────

function statusStyle(s: MedStatus) {
  switch (s) {
    case 'Active':    return { bg: '#E8F5F0', text: '#065F46' };
    case 'Missed':    return { bg: '#FFE8E8', text: '#991B1B' };
    case 'Completed': return { bg: '#E8F0FF', text: '#1E40AF' };
    case 'Stopped':   return { bg: '#F1F5F9', text: Colors.textMuted };
    default:          return { bg: Colors.border, text: Colors.textMuted };
  }
}

const FREQUENCY_OPTS = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'As needed'];
const TIMING_OPTS    = ['Morning', 'Afternoon', 'Evening', 'Before meals', 'After meals', 'Empty stomach'];

// ── Screen ────────────────────────────────────────────────────────────

export default function MemberMedicationsScreen() {
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();

  const [meds,    setMeds]    = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving,  setSaving]  = useState(false);

  // Add form state
  const [formName,  setFormName]  = useState('');
  const [formDose,  setFormDose]  = useState('');
  const [formFreq,  setFormFreq]  = useState(FREQUENCY_OPTS[0]);
  const [formTime,  setFormTime]  = useState(TIMING_OPTS[0]);

  useEffect(() => {
    getMemberMedications(id)
      .then((r) => setMeds(r.medications))
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!formName.trim()) { Alert.alert('Required', 'Please enter medication name'); return; }
    if (!formDose.trim()) { Alert.alert('Required', 'Please enter dosage'); return; }
    setSaving(true);
    try {
      await addMemberMedication(id, {
        name: formName.trim(), dose: formDose.trim(),
        frequency: formFreq, timing: formTime, schedule: [],
      });
      // Add optimistically to local list
      const newMed: Medication = {
        med_id: `med_${Date.now()}`, name: `${formName.trim()} ${formDose.trim()}`,
        dose: formDose.trim(), frequency: formFreq, timing: formTime,
        schedule: [], next_dose: '—', status: 'Active',
        color: '#E8F5F0', icon_color: Colors.primary,
      };
      setMeds((prev) => [...prev, newMed]);
      setShowAdd(false);
      setFormName(''); setFormDose(''); setFormFreq(FREQUENCY_OPTS[0]); setFormTime(TIMING_OPTS[0]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to add medication');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const active  = meds.filter((m) => m.status === 'Active' || m.status === 'Missed');
  const past    = meds.filter((m) => m.status === 'Completed' || m.status === 'Stopped');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar
        title="Medications"
        onBack={() => router.back()}
        rightIcon="add-circle-outline"
        onRight={() => setShowAdd(true)}
      />

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>

        {/* ── Active ─────────────────────────────────────── */}
        <Text style={styles.section}>Active ({active.length})</Text>
        {active.map((m) => {
          const ss = statusStyle(m.status);
          return (
            <View key={m.med_id} style={styles.medCard}>
              <View style={styles.medHeader}>
                <View style={[styles.medIcon, { backgroundColor: m.color }]}>
                  <Ionicons name="medical-outline" size={17} color={m.icon_color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{m.name}</Text>
                  <Text style={styles.medSub}>{m.frequency} · {m.timing}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: ss.bg }]}>
                  <Text style={[styles.badgeTxt, { color: ss.text }]}>{m.status}</Text>
                </View>
              </View>
              {m.schedule.length > 0 && (
                <View style={styles.scheduleRow}>
                  {m.schedule.map((s) => (
                    <View key={s} style={styles.timeChip}>
                      <Text style={styles.timeTxt}>{s}</Text>
                    </View>
                  ))}
                  <Text style={styles.nextDose}>{m.next_dose}</Text>
                </View>
              )}
            </View>
          );
        })}

        {active.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="medical-outline" size={28} color={Colors.textMuted} style={{ opacity: 0.4 }} />
            <Text style={styles.emptyTxt}>No active medications</Text>
          </View>
        )}

        {/* ── Add button (inline) ───────────────────────── */}
        <Pressable style={styles.addRow} onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.addTxt}>Add medication</Text>
        </Pressable>

        {/* ── Past ─────────────────────────────────────── */}
        {past.length > 0 && (
          <>
            <Text style={[styles.section, { marginTop: 8 }]}>Past / Stopped</Text>
            {past.map((m) => {
              const ss = statusStyle(m.status);
              return (
                <View key={m.med_id} style={[styles.medCard, { opacity: 0.65 }]}>
                  <View style={styles.medHeader}>
                    <View style={[styles.medIcon, { backgroundColor: '#F1F5F9' }]}>
                      <Ionicons name="medical-outline" size={17} color={Colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{m.name}</Text>
                      <Text style={styles.medSub}>{m.frequency} · {m.timing}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: ss.bg }]}>
                      <Text style={[styles.badgeTxt, { color: ss.text }]}>{m.status}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

      </ScrollView>

      {/* ── Add Medication Modal ─────────────────────────────── */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modal}>
          <View style={styles.modalBar}>
            <Pressable onPress={() => setShowAdd(false)} style={styles.modalClose}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </Pressable>
            <Text style={styles.modalTitle}>Add Medication</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fl}>Medication name</Text>
            <TextInput
              style={styles.inp}
              placeholder="e.g. Metformin"
              value={formName}
              onChangeText={setFormName}
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fl}>Dosage</Text>
            <TextInput
              style={styles.inp}
              placeholder="e.g. 500mg"
              value={formDose}
              onChangeText={setFormDose}
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fl}>Frequency</Text>
            <View style={styles.optRow}>
              {FREQUENCY_OPTS.map((f) => (
                <Pressable
                  key={f}
                  style={[styles.optChip, formFreq === f && styles.optChipOn]}
                  onPress={() => setFormFreq(f)}
                >
                  <Text style={[styles.optTxt, formFreq === f && styles.optTxtOn]}>{f}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fl}>Timing</Text>
            <View style={styles.optRow}>
              {TIMING_OPTS.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.optChip, formTime === t && styles.optChipOn]}
                  onPress={() => setFormTime(t)}
                >
                  <Text style={[styles.optTxt, formTime === t && styles.optTxtOn]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveTxt}>Save Medication</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: '#F4F7F6' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  page:      { padding: 12, paddingBottom: 40 },
  section:   { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 7 },

  medCard:    { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  medHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medIcon:    { width: 36, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  medName:    { fontSize: 13, fontWeight: '600', color: Colors.text },
  medSub:     { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge:      { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  badgeTxt:   { fontSize: 10, fontWeight: '600' },
  scheduleRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  timeChip:   { backgroundColor: '#E8F0FF', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  timeTxt:    { fontSize: 11, color: '#1E40AF', fontWeight: '500' },
  nextDose:   { fontSize: 11, color: Colors.textMuted, marginLeft: 2 },

  emptyBox:  { alignItems: 'center', gap: 8, paddingVertical: 20 },
  emptyTxt:  { fontSize: 13, color: Colors.textMuted },

  addRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.border, borderRadius: 12, padding: 13, marginBottom: 8 },
  addTxt:    { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Modal
  modal:      { flex: 1, backgroundColor: '#F4F7F6' },
  modalBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  modalClose: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: Colors.text },
  modalBody:  { padding: 16, paddingBottom: 40 },

  fl:      { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 6, marginTop: 14 },
  inp:     { backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: Colors.border, padding: 11, fontSize: 13, color: Colors.text },
  optRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  optChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 0.5, borderColor: Colors.border },
  optChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optTxt:  { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  optTxtOn:{ color: '#fff', fontWeight: '600' },

  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  saveTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
