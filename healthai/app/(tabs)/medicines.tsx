/**
 * app/(tabs)/medicines.tsx  (REPLACE the existing file)
 *
 * Main Medicines tab with 4 sub-screens:
 *  – Browse All Medicines
 *  – Medicine Scanner
 *  – Reminders
 *  – Check Interactions
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/Colors';

import BrowseAllMedicines from '@/components/medicine/BrowseAllMedicines';
import MedicineScanner from '@/components/medicine/MedicineScanner';
import MedicineReminder from '@/components/medicine/MedicineReminder';
import CheckInteraction from '@/components/medicine/CheckInteraction';

// ─── Sub-tab definition ───────────────────────────────────────
type TabKey = 'browse' | 'scanner' | 'reminder' | 'interaction';

const TABS: { key: TabKey; label: string; icon: string; activeIcon: string }[] = [
  { key: 'browse', label: 'Browse', icon: 'grid-outline', activeIcon: 'grid' },
  { key: 'scanner', label: 'Scanner', icon: 'scan-outline', activeIcon: 'scan' },
  { key: 'reminder', label: 'Reminder', icon: 'alarm-outline', activeIcon: 'alarm' },
  { key: 'interaction', label: 'Interactions', icon: 'git-compare-outline', activeIcon: 'git-compare' },
];

// ─── Header titles ────────────────────────────────────────────
const HEADER: Record<TabKey, { title: string; sub: string }> = {
  browse: { title: 'All Medicines', sub: 'Search, browse, and save medicines' },
  scanner: { title: 'Medicine Scanner', sub: 'Scan or upload a medicine image' },
  reminder: { title: 'Reminders', sub: "Never miss today's dose" },
  interaction: { title: 'Interaction Checker', sub: 'Check medicine combinations' },
};

// ═══════════════════════════════════════════════════════════════
export default function MedicinesTab() {
  const [activeTab, setActiveTab] = useState<TabKey>('browse');
  const hdr = HEADER[activeTab];

  const renderScreen = () => {
    switch (activeTab) {
      case 'browse':      return <BrowseAllMedicines />;
      case 'scanner':     return <MedicineScanner />;
      case 'reminder':    return <MedicineReminder />;
      case 'interaction': return <CheckInteraction />;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{hdr.title}</Text>
          <Text style={styles.sub}>{hdr.sub}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="medkit-outline" size={22} color={Colors.primary} />
        </View>
      </View>

      {/* Sub-tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Ionicons
                name={(active ? t.activeIcon : t.icon) as any}
                size={16}
                color={active ? '#fff' : Colors.textMuted}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Screen content */}
      <View style={{ flex: 1 }}>{renderScreen()}</View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: '#fff' },
});
