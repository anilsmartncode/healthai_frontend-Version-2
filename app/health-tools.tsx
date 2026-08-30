/**
 * app/health-tools.tsx — Health Tools Menu Grid (Mockup Redesign)
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
    emoji: '⚖️',
    route: '/health-tools/bmi',
  },
  {
    id: 'calorie',
    label: 'Calorie tracker',
    emoji: '🍽️',
    route: '/health-tools/calorie',
  },
  {
    id: 'drug',
    label: 'Drug checker',
    emoji: '💊',
    route: '/medicines/check-interactions', // existing page path
  },
  {
    id: 'tips',
    label: 'Health tips',
    emoji: '💡',
    route: '/health-tools/tips',
  },
];

export default function HealthToolsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={16} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Health tools</Text>
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
              <Text style={styles.emojiText}>{tool.emoji}</Text>
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
  
  // Header (Back button circular, title inline)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
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
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emojiText: {
    fontSize: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
});
