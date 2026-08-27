import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getDoctors, Doctor } from '@/services/doctorsApi';
import { useReports } from '@/hooks/useReports';
import { useMedicines } from '@/hooks/useMedicines';

type EventType = 'Consultation' | 'Test' | 'Medicine';

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  timestamp: Date;
}

export default function TimelinePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const { allReports } = useReports();
  const { savedMedicines } = useMedicines();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Consultations' | 'Tests' | 'Medicines'>('All');

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      getDoctors().then(data => {
        if (isActive) setDoctors(data);
      });
      return () => { isActive = false; };
    }, [])
  );

  const events = useMemo(() => {
    const list: TimelineEvent[] = [];

    // Map Doctors -> Consultations
    doctors.forEach(doc => {
      list.push({
        id: `doc-${doc.id}`,
        type: 'Consultation',
        title: `Consultation — ${doc.name}`,
        // mock date for prototype using created_at or a slightly older date
        timestamp: new Date(doc.created_at || Date.now() - Math.random() * 10000000000),
      });
    });

    // Map Reports -> Tests
    allReports.forEach(rep => {
      const isPrescription = rep.reportType?.toUpperCase() === 'PRESCRIPTION';
      if (!isPrescription) {
        list.push({
          id: `rep-${rep.id}`,
          type: 'Test',
          title: `${rep.category && rep.category !== 'Others' ? rep.category : 'Test'} — ${rep.labName || rep.title}`,
          timestamp: new Date(rep.analyzedAt || rep.date || Date.now()),
        });
      }
    });

    // Map Medicines -> Medicines
    if (savedMedicines) {
      savedMedicines.forEach((med, i) => {
        list.push({
          id: `med-${med.id}`,
          type: 'Medicine',
          title: `Medicine added — ${med.name}`,
          timestamp: new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 24 * 3), 
        });
      });
    }

    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [doctors, allReports, savedMedicines]);

  const filteredEvents = events.filter(e => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Consultations' && e.type === 'Consultation') return true;
    if (activeFilter === 'Tests' && e.type === 'Test') return true;
    if (activeFilter === 'Medicines' && e.type === 'Medicine') return true;
    return false;
  });

  const getIcon = (type: EventType) => {
    switch (type) {
      case 'Consultation': return { name: 'medkit', bg: '#D1FAE5', color: '#059669' };
      case 'Test': return { name: 'water', bg: '#FCE7F3', color: '#E11D48' };
      case 'Medicine': return { name: 'bandage', bg: '#FEF3C7', color: '#D97706' };
      default: return { name: 'document-text', bg: '#E0E7FF', color: '#4F46E5' };
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleString('en-GB', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Health timeline</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {['All', 'Consultations', 'Tests', 'Medicines'].map(f => (
            <Pressable 
              key={f} 
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f as any)}
            >
              <Text style={[styles.filterChipTxt, activeFilter === f && styles.filterChipTxtActive]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {filteredEvents.length === 0 ? (
             <Text style={styles.emptyTxt}>No events found in timeline</Text>
          ) : (
            filteredEvents.map((item, idx) => {
              const isLast = idx === filteredEvents.length - 1;
              const icon = getIcon(item.type);
              
              return (
                <View key={item.id} style={[styles.row, !isLast && styles.rowBorder]}>
                  <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
                    <Ionicons name={icon.name as any} size={20} color={icon.color} />
                  </View>
                  <View style={styles.infoWrap}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.rowSub}>{formatDate(item.timestamp)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  filtersWrapper: {
    backgroundColor: '#F8FAFC',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  filterChipTxt: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  filterChipTxtActive: {
    color: '#059669',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyTxt: {
    textAlign: 'center',
    color: '#64748B',
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  rowSub: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
