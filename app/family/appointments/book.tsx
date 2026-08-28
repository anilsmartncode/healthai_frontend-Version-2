/**
 * app/family/appointments/book.tsx
 *
 * Book / Reschedule Appointment screen.
 * API: POST /api/family/appointments — stub, replace with real call.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';

const SPECIALTIES = [
  'General Physician', 'Cardiologist', 'Diabetologist',
  'Neurologist', 'Orthopedic', 'Dermatologist', 'Pediatrician',
];

const TIMES = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:30 PM'];

export default function BookAppointmentScreen() {
  const { id = '', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();

  const [doctor,    setDoctor]    = useState('');
  const [hospital,  setHospital]  = useState('');
  const [specialty, setSpecialty] = useState('');
  const [date,      setDate]      = useState('');
  const [time,      setTime]      = useState('');
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);

  const canSave = doctor.trim() && hospital.trim() && specialty && date.trim() && time;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    // ← plug in your API: POST /api/family/members/:id/appointments
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }]} edges={['top', 'bottom']}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Appointment Booked!</Text>
        <Text style={styles.successSub}>
          {doctor} at {hospital}{'\n'}on {date} at {time}
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FamilyTopBar title="Book Appointment" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">

        <Text style={styles.memberLabel}>For: <Text style={{ color: Colors.primary, fontWeight: '700' }}>{name}</Text></Text>

        <Text style={styles.label}>Doctor Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dr. Ramesh Kumar"
          value={doctor}
          onChangeText={setDoctor}
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>Hospital / Clinic *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Apollo Hospitals"
          value={hospital}
          onChangeText={setHospital}
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>Specialty *</Text>
        <View style={styles.pillGrid}>
          {SPECIALTIES.map((s) => (
            <Pressable
              key={s}
              style={[styles.pill, specialty === s && styles.pillActive]}
              onPress={() => setSpecialty(s)}
            >
              <Text style={[styles.pillText, specialty === s && styles.pillTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 20 Jun 2026"
          value={date}
          onChangeText={setDate}
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>Time *</Text>
        <View style={styles.pillGrid}>
          {TIMES.map((t) => (
            <Pressable
              key={t}
              style={[styles.pill, time === t && styles.pillActive]}
              onPress={() => setTime(t)}
            >
              <Text style={[styles.pillText, time === t && styles.pillTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Any notes for the doctor…"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor="#94A3B8"
        />

        <Pressable
          style={[styles.primaryBtn, (!canSave || saving) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="calendar-outline" size={16} color="#fff" /><Text style={styles.primaryBtnText}>Book Appointment</Text></>
          }
        </Pressable>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F8FAFC' },
  page:    { padding: 16, gap: 12 },

  memberLabel: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  label:       { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#E2E8F0',
    padding: 13, fontSize: 14, color: '#0F172A',
  },

  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
  },
  pillActive:     { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
  pillText:       { fontSize: 13, color: '#64748B', fontWeight: '500' },
  pillTextActive: { color: Colors.primary, fontWeight: '700' },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  successCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  successSub:   { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});
