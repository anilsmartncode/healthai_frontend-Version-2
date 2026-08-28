/**
 * app/family/tree.tsx — S10: Family Tree (Tree view + List toggle)
 */
import React, { useState } from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar }    from '@/components/family/FamilyTopBar';
import { FamilyTreeView }  from '@/components/family/FamilyTreeView';
import { FamilyMemberRow } from '@/components/family/FamilyMemberRow';
import { useFamilyTree, useFamilyDashboard } from '@/hooks/useFamily';
import type { FamilyMember } from '@/services/familyApi';

export default function FamilyTreeScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<'tree' | 'list'>('tree');
  const { tree, loading } = useFamilyTree();
  const { dashboard } = useFamilyDashboard();

  const onMemberPress = (m: FamilyMember) =>
    router.push({ pathname: '/family/member-profile', params: { id: m.member_id, name: m.name } });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar title="Family Tree" onBack={() => router.back()} />

      {/* Toggle */}
      <View style={styles.toggleWrap}>
        {(['tree', 'list'] as const).map((v) => (
          <Pressable key={v} style={[styles.toggleBtn, view === v && styles.toggleActive]} onPress={() => setView(v)}>
            <Text style={[styles.toggleTxt, view === v && styles.toggleTxtActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        {loading
          ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
          : view === 'tree'
            ? tree.length === 0
              ? (
                <View style={styles.emptyState}>
                  <Ionicons name="git-network-outline" size={36} color={Colors.primary} style={{ opacity: 0.35 }} />
                  <Text style={styles.emptyTitle}>No Family Tree Yet</Text>
                  <Text style={styles.emptySub}>Add family members to build your tree.</Text>
                </View>
              )
              : <FamilyTreeView tree={tree} />
            : (dashboard?.members.length ?? 0) === 0
              ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={36} color={Colors.primary} style={{ opacity: 0.35 }} />
                  <Text style={styles.emptyTitle}>No Members Yet</Text>
                  <Text style={styles.emptySub}>Invite family members to see them listed here.</Text>
                </View>
              )
              : dashboard?.members.map((m) => (
                  <FamilyMemberRow key={m.member_id} member={m} onPress={onMemberPress} />
                ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#F4F7F6' },
  toggleWrap:   { flexDirection: 'row', alignSelf: 'center', margin: 12, borderWidth: 0.5, borderColor: Colors.border, borderRadius: 8, overflow: 'hidden' },
  toggleBtn:    { paddingHorizontal: 28, paddingVertical: 7, backgroundColor: '#fff' },
  toggleActive: { backgroundColor: Colors.primary },
  toggleTxt:    { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  toggleTxtActive:{ color: '#fff' },
  page:         { paddingHorizontal: 12, paddingBottom: 40 },
  emptyState:   { alignItems: 'center', gap: 8, paddingVertical: 48 },
  emptyTitle:   { fontSize: 15, fontWeight: '700', color: Colors.text },
  emptySub:     { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
});
