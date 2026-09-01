import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { getDoctorById } from '@/services/AppointmentsStore';

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const doctor = getDoctorById(id || '');

  const [selectedSlot, setSelectedSlot] = useState<string>(doctor.availableSlots[0] || '10:30 AM');

  const handleBookAppointment = () => {
    router.push({
      pathname: '/appointments/confirm',
      params: { doctorId: doctor.id, timeSlot: selectedSlot },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Doctor profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Doctor Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarCircle, { backgroundColor: doctor.avatarBg || '#E6F4EA' }]}>
            <Ionicons name="person" size={24} color="#0D7B5F" />
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.docName}>{doctor.name}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#0D7B5F" />
            </View>
            <Text style={styles.specExp}>
              {doctor.specialty} • {doctor.experienceYears} yrs exp
            </Text>

            <View style={styles.ratingRow}>
              <View style={styles.starsWrap}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={12} color="#F59E0B" />
                ))}
              </View>
              <Text style={styles.ratingText}>
                {doctor.rating} ({doctor.reviewsCount} reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* ── Availability Section ── */}
        <Text style={styles.sectionTitle}>
          Available {doctor.availabilityTag.toLowerCase()}
        </Text>
        <View style={styles.slotsRow}>
          {doctor.availableSlots.map((slot) => {
            const isSelected = selectedSlot === slot;
            return (
              <Pressable
                key={slot}
                onPress={() => setSelectedSlot(slot)}
                style={[styles.slotPill, isSelected && styles.slotPillSelected]}
              >
                <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                  {slot}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Fee Card ── */}
        <View style={styles.feeCard}>
          <Text style={styles.feeLabel}>Consultation fee</Text>
          <Text style={styles.feeValue}>₹{doctor.consultationFee}</Text>
        </View>

        {/* ── Book CTA ── */}
        <Pressable style={styles.bookCtaBtn} onPress={handleBookAppointment}>
          <Text style={styles.bookCtaText}>Book appointment</Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  specExp: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  starsWrap: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  slotPill: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPillSelected: {
    borderColor: '#0D7B5F',
    backgroundColor: '#E6F4EA',
    borderWidth: 1.5,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  slotTextSelected: {
    color: '#0D7B5F',
    fontWeight: '700',
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  feeLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  bookCtaBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0D7B5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
