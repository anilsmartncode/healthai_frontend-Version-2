/**
 * app/health-tools.tsx — Health Tools Menu Grid
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const C = {
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  primary: '#0D7B5F',
};

const TOOLS = [
  {
    id: 'bmi',
    label: 'BMI calculator',
    icon: 'scale-outline' as const,
    route: '/health-tools/bmi',
    iconColor: '#0F766E',
    bgColor: '#F0FDFA',
  },
  {
    id: 'calorie',
    label: 'Calorie tracker',
    icon: 'restaurant-outline' as const,
    route: '/health-tools/calorie',
    iconColor: '#EA580C',
    bgColor: '#FFF7ED',
  },
  {
    id: 'drug',
    label: 'Drug checker',
    icon: 'medical-outline' as const,
    route: '/medicines/check-interactions', // existing page path
    iconColor: '#E11D48',
    bgColor: '#FFE4E6',
  },
  {
    id: 'tips',
    label: 'Health tips',
    icon: 'bulb-outline' as const,
    route: '/health-tools/tips',
    iconColor: '#D97706',
    bgColor: '#FEF3C7',
  },
];

export default function HealthToolsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Health tools</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Grid of Tools */}
      <View style={styles.content}>
        <View style={styles.grid}>
          {TOOLS.map((tool) => (
            <Pressable
              key={tool.id}
              style={styles.card}
              onPress={() => router.push(tool.route as any)}
            >
              <View style={[styles.iconWrap, { backgroundColor: tool.bgColor }]}>
                <Ionicons name={tool.icon} size={28} color={tool.iconColor} />
              </View>
              <Text style={styles.label}>{tool.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Grid
  content: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
