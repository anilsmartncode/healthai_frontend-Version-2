/**
 * app/health-tools/tips.tsx — Health Tips categories
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const C = {
  primary: '#0D7B5F', // Green matching check-interactions & mockups
  primaryBg: '#E6F4EA',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
};

const TIPS_CATEGORIES = [
  {
    id: 'sleep',
    title: 'Sleep Hygiene',
    icon: 'moon-outline' as const,
    color: '#6366F1',
    bgColor: '#EEF2FF',
    bulletPoints: [
      'Maintain a consistent sleep schedule, even on weekends.',
      'Keep your bedroom dark, quiet, and cool (around 65°F/18°C).',
      'Avoid screens (phones, TVs) for at least 1 hour before bed.',
      'Limit caffeine intake in the afternoon and evening.'
    ]
  },
  {
    id: 'hydration',
    title: 'Hydration Habits',
    icon: 'water-outline' as const,
    color: '#0EA5E9',
    bgColor: '#F0F9FF',
    bulletPoints: [
      'Drink 8-10 glasses (around 2-3 liters) of water daily.',
      'Start your morning with a tall glass of water to rehydrate.',
      'Drink water before, during, and after physical exercise.',
      'Check urine color — pale yellow indicates good hydration.'
    ]
  },
  {
    id: 'exercise',
    title: 'Daily Exercise',
    icon: 'fitness-outline' as const,
    color: '#10B981',
    bgColor: '#ECFDF5',
    bulletPoints: [
      'Aim for 150 minutes of moderate aerobic activity weekly.',
      'Incorporate strength training exercises at least twice a week.',
      'Take quick 5-minute active stretching breaks every hour.',
      'Walk 10,000 steps daily to promote cardiac circulation.'
    ]
  },
  {
    id: 'nutrition',
    title: 'Balanced Nutrition',
    icon: 'nutrition-outline' as const,
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    bulletPoints: [
      'Fill half your plate with colorful vegetables and fruits.',
      'Choose lean proteins like fish, poultry, beans, and lentils.',
      'Opt for whole grains over refined carbohydrates.',
      'Minimize intake of highly processed foods and added sugars.'
    ]
  }
];

export default function HealthTips() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const askAiTips = () => {
    const prompt = "Can you give me personalized daily health tips based on my lifestyle, focusing on sleep, hydration, exercise, and diet?";
    router.push({
      pathname: '/(tabs)/ai-chat',
      params: { prefill: prompt, newSession: Date.now().toString() }
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Health tips</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSubtitle}>
          Select a category to view detailed, science-backed habits to incorporate into your day.
        </Text>

        {TIPS_CATEGORIES.map(category => {
          const isExpanded = expandedId === category.id;
          return (
            <Pressable
              key={category.id}
              style={styles.card}
              onPress={() => toggleExpand(category.id)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: category.bgColor }]}>
                  <Ionicons name={category.icon} size={22} color={category.color} />
                </View>
                <Text style={styles.cardTitle}>{category.title}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={C.textMuted}
                />
              </View>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />
                  {category.bulletPoints.map((point, index) => (
                    <View key={index} style={styles.bulletRow}>
                      <View style={[styles.bulletPoint, { backgroundColor: category.color }]} />
                      <Text style={styles.bulletText}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}

        {/* Proactive CTA */}
        <Pressable style={styles.aiCta} onPress={askAiTips}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.aiCtaText}>Ask AI for Personalized Tips</Text>
        </Pressable>
      </ScrollView>
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

  // Scroll Content
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  pageSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
    marginBottom: 6,
  },

  // Tips Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },

  // Expanded Bullet Points
  expandedContent: {
    marginTop: 12,
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },

  // AI CTA
  aiCta: {
    flexDirection: 'row',
    backgroundColor: '#0D7B5F',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  aiCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
