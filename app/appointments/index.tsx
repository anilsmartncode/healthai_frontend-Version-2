import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Radius } from '@/constants/Colors';
import {
  getAppointments,
  AppointmentBooking,
} from '@/services/AppointmentsStore';

export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming');

  const loadData = async () => {
    setLoading(true);
    const data = await getAppointments();
    setAppointments(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filteredAppointments = appointments.filter((item) => {
    if (activeTab === 'Upcoming') return item.status === 'Confirmed' || item.status === 'Pending';
    if (activeTab === 'Completed') return item.status === 'Completed';
    if (activeTab === 'Cancelled') return item.status === 'Cancelled';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <View>
            <Text style={styles.title}>Appointments</Text>
            <Text style={styles.subtitle}>Manage your bookings</Text>
          </View>
        </View>

        <View style={styles.normalPill}>
          <Text style={styles.normalPillText}>Normal</Text>
          <Ionicons name="chevron-down" size={14} color="#0D7B5F" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Book New Appointment CTA ── */}
        <Pressable
          style={styles.bookCtaBtn}
          onPress={() => router.push('/appointments/nearby-doctors')}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.bookCtaText}>Book new appointment</Text>
        </Pressable>

        {/* ── Filter Tabs ── */}
        <View style={styles.tabRow}>
          {(['Upcoming', 'Completed', 'Cancelled'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Appointments Card ── */}
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} appointments</Text>
            <Text style={styles.emptySub}>
              Tap the button above to search doctors and schedule a visit.
            </Text>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            {filteredAppointments.map((item, index) => {
              const isConfirmed = item.status === 'Confirmed';
              const isPending = item.status === 'Pending';
              return (
                <View key={item.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.itemRow}>
                    <View style={styles.avatarCircle}>
                      <Ionicons name="person" size={16} color="#0D7B5F" />
                    </View>

                    <View style={styles.itemInfo}>
                      <Text style={styles.doctorName}>{item.doctorName}</Text>
                      <Text style={styles.itemMeta}>
                        {item.dateStr.split(',')[0]} • {item.consultationType}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        isConfirmed
                          ? styles.statusConfirmed
                          : isPending
                          ? styles.statusPending
                          : styles.statusOther,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          isConfirmed
                            ? styles.statusTextConfirmed
                            : isPending
                            ? styles.statusTextPending
                            : styles.statusTextOther,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  normalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 4,
  },
  normalPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D7B5F',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  bookCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0D7B5F',
    gap: 6,
    marginBottom: 16,
  },
  bookCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabPillActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#0D7B5F',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#0D7B5F',
    fontWeight: '700',
  },
  loaderWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusConfirmed: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusOther: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextConfirmed: {
    color: '#15803D',
  },
  statusTextPending: {
    color: '#B45309',
  },
  statusTextOther: {
    color: '#64748B',
  },
});
