/**
 * app/family/appointments.tsx — Member Appointments sub-screen
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import {
  getMemberAppointments,
  type Appointment,
  type AppointmentStatus,
} from '@/services/profileSubScreenApi';

// ── Helpers ───────────────────────────────────────────────────────────

function apptStyle(s: AppointmentStatus) {
  switch (s) {
    case 'Upcoming':   return { bg: '#E8F5F0', text: '#065F46', dot: Colors.success };
    case 'Completed':  return { bg: '#E8F0FF', text: '#1E40AF', dot: '#007AFF' };
    case 'Cancelled':  return { bg: '#FFE8E8', text: '#991B1B', dot: Colors.danger };
    default:           return { bg: Colors.border, text: Colors.textMuted, dot: Colors.textMuted };
  }
}

// ── Screen ────────────────────────────────────────────────────────────

export default function MemberAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [tab,          setTab]          = useState<'Upcoming' | 'Past'>('Upcoming');

  useEffect(() => {
    getMemberAppointments(id)
      .then((r) => setAppointments(r.appointments))
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const upcoming = appointments.filter((a) => a.status === 'Upcoming');
  const past     = appointments.filter((a) => a.status !== 'Upcoming');
  const shown    = tab === 'Upcoming' ? upcoming : past;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar
        title="Appointments"
        onBack={() => router.back()}
        rightIcon="add-circle-outline"
        onRight={() => Alert.alert('Book Appointment', 'Booking flow coming soon')}
      />

      {/* ── Tabs ───────────────────────────────────────── */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'Upcoming' && styles.tabOn]}
          onPress={() => setTab('Upcoming')}
        >
          <Text style={[styles.tabTxt, tab === 'Upcoming' && styles.tabTxtOn]}>
            Upcoming ({upcoming.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'Past' && styles.tabOn]}
          onPress={() => setTab('Past')}
        >
          <Text style={[styles.tabTxt, tab === 'Past' && styles.tabTxtOn]}>
            Past ({past.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>

        {shown.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={38} color={Colors.textMuted} style={{ opacity: 0.4 }} />
            <Text style={styles.emptyTxt}>
              {tab === 'Upcoming' ? 'No upcoming appointments' : 'No past appointments'}
            </Text>
            {tab === 'Upcoming' && (
              <Pressable
                style={styles.bookBtn}
                onPress={() => Alert.alert('Book Appointment', 'Booking flow coming soon')}
              >
                <Text style={styles.bookTxt}>+ Book Appointment</Text>
              </Pressable>
            )}
          </View>
        )}

        {shown.map((a) => {
          const s = apptStyle(a.status);
          return (
            <View key={a.appt_id} style={styles.card}>
              {/* Header row */}
              <View style={styles.cardHeader}>
                <View style={[styles.dotBadge, { backgroundColor: s.dot }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorName}>{a.doctor}</Text>
                  <Text style={styles.specialty}>{a.specialty}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeTxt, { color: s.text }]}>{a.status}</Text>
                </View>
              </View>

              {/* Detail row */}
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.detailTxt}>{a.hospital}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.detailTxt}>{a.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.detailTxt}>{a.time}</Text>
                </View>
              </View>

              {!!a.notes && (
                <View style={styles.notesBox}>
                  <Ionicons name="document-text-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.notesTxt}>{a.notes}</Text>
                </View>
              )}

              {a.status === 'Upcoming' && (
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => Alert.alert('Reschedule', 'Reschedule flow coming soon')}
                  >
                    <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                    <Text style={styles.actionTxt}>Reschedule</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#FFE8E8' }]}
                    onPress={() => Alert.alert('Cancel Appointment', 'Are you sure you want to cancel?', [
                      { text: 'No', style: 'cancel' },
                      {
                        text: 'Yes, Cancel', style: 'destructive',
                        onPress: () => setAppointments((prev) =>
                          prev.map((p) => p.appt_id === a.appt_id ? { ...p, status: 'Cancelled' } : p)
                        ),
                      },
                    ])}
                  >
                    <Ionicons name="close-outline" size={14} color={Colors.danger} />
                    <Text style={[styles.actionTxt, { color: Colors.danger }]}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        {/* Book new appointment CTA (shown only in upcoming tab with items) */}
        {tab === 'Upcoming' && shown.length > 0 && (
          <Pressable
            style={styles.addRow}
            onPress={() => Alert.alert('Book Appointment', 'Booking flow coming soon')}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.addTxt}>Book new appointment</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  page:     { padding: 12, paddingBottom: 40 },

  tabs:      { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  tab:       { flex: 1, paddingVertical: 11, alignItems: 'center' },
  tabOn:     { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabTxt:    { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  tabTxtOn:  { color: Colors.primary, fontWeight: '700' },

  empty:    { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyTxt: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  bookBtn:  { marginTop: 4, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9 },
  bookTxt:  { color: '#fff', fontSize: 13, fontWeight: '600' },

  card:      { backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8 },
  cardHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dotBadge:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  doctorName:{ fontSize: 14, fontWeight: '700', color: Colors.text },
  specialty: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  badge:     { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  badgeTxt:  { fontSize: 10, fontWeight: '600' },

  detailRow:  { flexDirection: 'row', gap: 14, marginBottom: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailTxt:  { fontSize: 12, color: Colors.textMuted },

  notesBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 5, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8, marginTop: 6 },
  notesTxt:  { fontSize: 11, color: Colors.textMuted, flex: 1, lineHeight: 16 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#E8F5F0', borderRadius: 9, paddingVertical: 8 },
  actionTxt: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  addRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.border, borderRadius: 12, padding: 13, marginTop: 4 },
  addTxt:    { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
