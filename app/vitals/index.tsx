import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getVitals, VitalEntry, VitalType } from '@/services/vitalsApi';

export default function VitalsDashboard() {
  const [vitals, setVitals] = useState<VitalEntry[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      getVitals().then(data => {
        if (isActive) {
          setVitals(data);
        }
      });
      return () => { isActive = false; };
    }, [])
  );

  const getLatest = (type: VitalType) => {
    const sorted = vitals.filter(v => v.type === type).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted[0];
  };

  const bp = getLatest('Blood pressure');
  const bg = getLatest('Blood glucose');
  const spo2 = getLatest('SpO2');
  const weight = getLatest('Weight');

  // HbA1c history for chart
  const hba1cHistory = vitals
    .filter(v => v.type === 'HbA1c')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-6);

  const maxHb = Math.max(...hba1cHistory.map(h => parseFloat(h.value) || 0), 10);
  const latestHb = hba1cHistory.length > 0 ? hba1cHistory[hba1cHistory.length - 1].value : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Vitals and tracking</Text>
        <Pressable onPress={() => router.push('/vitals/log')} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="add" size={20} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Blood pressure</Text>
            <Text style={styles.cardValue}>{bp ? bp.value : '--'}</Text>
            <Text style={[styles.cardStatus, { color: '#059669' }]}>Normal</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Blood glucose</Text>
            <Text style={styles.cardValue}>{bg ? `${bg.value} mg/dL` : '--'}</Text>
            <Text style={[styles.cardStatus, { color: '#059669' }]}>Normal</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>SpO2</Text>
            <Text style={styles.cardValue}>{spo2 ? `${spo2.value}%` : '--'}</Text>
            <Text style={[styles.cardStatus, { color: '#059669' }]}>Normal</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weight</Text>
            <Text style={styles.cardValue}>{weight ? `${weight.value} kg` : '--'}</Text>
            <Text style={[styles.cardStatus, { color: '#D97706' }]}>Watch</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>HbA1c — last 6 months</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartArea}>
            {hba1cHistory.map((item, idx) => {
              const val = parseFloat(item.value) || 0;
              const heightPct = (val / maxHb) * 100;
              const isLatest = idx === hba1cHistory.length - 1;
              return (
                <View key={item.id} style={styles.barWrap}>
                  <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: isLatest ? '#0F766E' : '#B2D0BC' }]} />
                </View>
              );
            })}
          </View>
          {latestHb && (
            <Text style={styles.chartLabel}>
              Latest: {latestHb}% — Good, trending down
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  card: {
    width: (width - 32 - 12) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  cardValue: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  cardStatus: { fontSize: 12, fontWeight: '600' },
  
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 16,
  },
  barWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  chartLabel: { textAlign: 'center', fontSize: 12, color: Colors.textMuted },
});
