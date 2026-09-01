import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function AppointmentSuccessScreen() {
  const { bookingId, doctorName, dateStr, timeSlot } = useLocalSearchParams<{
    bookingId?: string;
    doctorName?: string;
    dateStr?: string;
    timeSlot?: string;
  }>();
  const router = useRouter();

  const idText = bookingId || 'HA-8834920';
  const nameText = doctorName || 'Dr. Ananya Sharma';
  const dateText = dateStr || '22 May';
  const slotText = timeSlot || '10:30 AM';

  const handleViewAppointments = () => {
    router.replace('/appointments' as any);
  };

  const handleBackToHome = () => {
    router.replace('/(tabs)/home' as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* ── Checkmark Circle ── */}
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={32} color="#0D7B5F" />
        </View>

        {/* ── Confirmation Text ── */}
        <Text style={styles.title}>Appointment confirmed</Text>
        <Text style={styles.subtext}>
          {nameText} • {dateText}, {slotText}
        </Text>
        <Text style={styles.bookingIdText}>Booking ID: {idText}</Text>

        {/* ── Buttons ── */}
        <View style={styles.btnStack}>
          <Pressable style={styles.primaryBtn} onPress={handleViewAppointments}>
            <Text style={styles.primaryBtnText}>View my appointments</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={handleBackToHome}>
            <Text style={styles.secondaryBtnText}>Back to home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtext: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  bookingIdText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 36,
  },
  btnStack: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0D7B5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});
