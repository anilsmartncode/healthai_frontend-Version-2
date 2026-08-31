import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius } from '@/constants/Colors';
import { MOCK_DOCTORS, DoctorProfile } from '@/services/AppointmentsStore';

export default function NearbyDoctorsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'General physician' | 'Cardiologist'>('All');

  const filteredDoctors = MOCK_DOCTORS.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' || doc.specialty.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleSelectDoctor = (doctor: DoctorProfile) => {
    router.push({
      pathname: '/appointments/doctor/[id]',
      params: { id: doctor.id },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Nearby doctors</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Search Input ── */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            placeholder="Search doctors, specialties..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* ── Specialty Filter Pills ── */}
        <View style={styles.filterRow}>
          {(['All', 'General physician', 'Cardiologist'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Section Title ── */}
        <Text style={styles.sectionTitle}>Recommended near you</Text>

        {/* ── Doctors Card List ── */}
        <View style={styles.cardContainer}>
          {filteredDoctors.map((doc, index) => {
            const isToday = doc.availabilityTag === 'Today';
            return (
              <Pressable
                key={doc.id}
                onPress={() => handleSelectDoctor(doc)}
                style={({ pressed }) => [pressed && { opacity: 0.8 }]}
              >
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.docRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: doc.avatarBg || '#E6F4EA' }]}>
                    <Ionicons name="person" size={18} color="#0D7B5F" />
                  </View>

                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text style={styles.docMeta}>
                      {doc.specialty} • {doc.distanceKm} km • ★{doc.rating}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.availBadge,
                      isToday ? styles.availToday : styles.availTomorrow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.availText,
                        isToday ? styles.availTextToday : styles.availTextTomorrow,
                      ]}
                    >
                      {doc.availabilityTag}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
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
    paddingBottom: 12,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#0D7B5F',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: '#0D7B5F',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  docMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  availBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  availToday: {
    backgroundColor: '#DCFCE7',
  },
  availTomorrow: {
    backgroundColor: '#E0F2FE',
  },
  availText: {
    fontSize: 11,
    fontWeight: '700',
  },
  availTextToday: {
    color: '#15803D',
  },
  availTextTomorrow: {
    color: '#0369A1',
  },
});
