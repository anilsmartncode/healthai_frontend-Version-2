import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { getDoctorById, addAppointment, getUserProfileName } from '@/services/AppointmentsStore';

export default function ConfirmAppointmentScreen() {
  const { doctorId, timeSlot } = useLocalSearchParams<{ doctorId: string; timeSlot: string }>();
  const router = useRouter();

  const doctor = getDoctorById(doctorId || '');
  const slot = timeSlot || '10:30 AM';

  const [userName, setUserName] = useState<string>('Anil Kumar');
  const [sendReminder, setSendReminder] = useState(true);
  const [addCalendar, setAddCalendar] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getUserProfileName().then((name) => {
      if (name && name.trim()) setUserName(name.trim());
    });
  }, []);

  const upiId = `${userName.toLowerCase().replace(/\s+/g, '')}@upi`;

  const handlePayAndConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const newBooking = await addAppointment({
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        hospital: doctor.hospital,
        dateStr: '22 May 2025, Thursday',
        timeSlot: `${slot} – 11:00 AM`,
        consultationType: 'OPD',
        fee: doctor.consultationFee,
        patientName: `${userName} (You)`,
        paymentMethod: `UPI — ${upiId}`,
        status: 'Confirmed',
      });

      router.replace({
        pathname: '/appointments/success',
        params: {
          bookingId: newBooking.id,
          doctorName: doctor.name,
          dateStr: '22 May',
          timeSlot: slot,
        },
      });
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Confirm appointment</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Summary Card ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.docName}>{doctor.name}</Text>
          <Text style={styles.docSub}>
            {doctor.specialty} • {doctor.hospital}
          </Text>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>22 May 2025, Thursday</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Time</Text>
            <Text style={styles.rowValue}>{slot} – 11:00 AM</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Fee</Text>
            <Text style={styles.rowValueBold}>₹{doctor.consultationFee}</Text>
          </View>
        </View>

        {/* ── Patient Field ── */}
        <Text style={styles.fieldLabel}>Patient</Text>
        <View style={styles.dropdownCard}>
          <Text style={styles.dropdownValue}>{userName} (You)</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
        </View>

        {/* ── Payment Method Field ── */}
        <Text style={styles.fieldLabel}>Payment method</Text>
        <View style={styles.dropdownCard}>
          <Text style={styles.dropdownValue}>UPI — {upiId}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
        </View>

        {/* ── Reminder Toggle ── */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>Send reminder 1 hour before</Text>
          <Switch
            value={sendReminder}
            onValueChange={setSendReminder}
            trackColor={{ false: '#E2E8F0', true: '#0D7B5F' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── Calendar Toggle ── */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>Add to Google Calendar</Text>
          <Switch
            value={addCalendar}
            onValueChange={setAddCalendar}
            trackColor={{ false: '#E2E8F0', true: '#0D7B5F' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── Pay & Confirm CTA ── */}
        <Pressable
          style={[styles.payCtaBtn, submitting && { opacity: 0.7 }]}
          onPress={handlePayAndConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.payCtaText}>
              Pay ₹{doctor.consultationFee} and confirm
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  docSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  rowValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  dropdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  dropdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  payCtaBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0D7B5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  payCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
