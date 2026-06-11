/**
 * app/family.tsx — S1: Family Dashboard (main Family tab screen)
 * ─────────────────────────────────────────────────────────────────────
 * Redesigned to match HTML reference (s-dashboard screen).
 * Data flows from useFamilyDashboard() → familyApi → familyMockData.
 * All API calls are mocked until backend is ready.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useFamilyDashboard } from '@/hooks/useFamily';
import { FamilyScoreCard }  from '@/components/family/FamilyScoreCard';
import { FamilyMemberRow }  from '@/components/family/FamilyMemberRow';
import { PendingBanner }    from '@/components/family/PendingBanner';
import type { FamilyMember } from '@/services/familyApi';

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const { dashboard, loading, error, refresh } = useFamilyDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };
  const onMemberPress = (m: FamilyMember) =>
    router.push({ pathname: '/family/member-profile', params: { id: m.member_id, name: m.name } });

  // ── Error ───────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <Ionicons name="wifi-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errTxt}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryTxt}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ── Main (renders immediately; card handles skeleton internally) ─
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Family</Text>
        <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Score card — skeleton while loading, empty if no members, filled when data ready */}
        <FamilyScoreCard data={dashboard} loading={loading} />

        {/* Invite button */}
        <Pressable
          style={({ pressed }) => [styles.inviteBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/family/add-member')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.inviteTxt}>Invite Family Member</Text>
        </Pressable>

        {/* Members section */}
        <View style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          {!loading && (dashboard?.members.length ?? 0) > 0 && (
            <Pressable><Text style={styles.editLink}>Edit</Text></Pressable>
          )}
        </View>

        {loading
          ? (
            // Skeleton rows while loading
            [0, 1, 2].map((i) => (
              <View key={i} style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={[styles.skeletonLine, { width: '50%' }]} />
                  <View style={[styles.skeletonLine, { width: '30%' }]} />
                </View>
              </View>
            ))
          )
          : (dashboard?.members.length ?? 0) === 0
            ? (
              <View style={styles.emptyMembers}>
                <Ionicons name="person-add-outline" size={28} color={Colors.primary} style={{ opacity: 0.4 }} />
                <Text style={styles.emptyMembersTxt}>No members yet. Invite someone to get started.</Text>
              </View>
            )
            : dashboard?.members.map((m) => (
                <FamilyMemberRow key={m.member_id} member={m} onPress={onMemberPress} />
              ))
        }

        {/* Pending banner */}
        {!loading && dashboard && (
          <PendingBanner
            count={dashboard.pending_invitations_count}
            onPress={() => router.push('/family/invitations')}
          />
        )}

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && { backgroundColor: '#E8F5F0' }]}
            onPress={() => router.push('/family/tree')}
          >
            <Ionicons name="git-network-outline" size={18} color={Colors.primary} />
            <Text style={styles.quickTxt}>Family Tree</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && { backgroundColor: '#E8F5F0' }]}
            onPress={() => router.push('/family/ai-assistant')}
          >
            <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
            <Text style={styles.quickTxt}>AI Assistant</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: '#F4F7F6' },
  centered:       { justifyContent: 'center', alignItems: 'center', gap: 12 },
  errTxt:         { fontSize: 14, color: Colors.danger, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:       { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryTxt:       { color: '#fff', fontWeight: '700' },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  topTitle:       { fontSize: 16, fontWeight: '700', color: Colors.text },
  iconBtn:        { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  page:           { padding: 14, paddingBottom: 48 },
  inviteBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 13, marginBottom: 16 },
  inviteTxt:      { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionHdr:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:   { fontSize: 14, fontWeight: '700', color: Colors.text },
  editLink:       { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  quickRow:       { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 24 },
  quickBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 12, padding: 11, borderWidth: 0.5, borderColor: Colors.border },
  quickTxt:       { fontSize: 13, fontWeight: '600', color: Colors.primary },
  emptyMembers:   { alignItems: 'center', gap: 8, paddingVertical: 24, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10 },
  emptyMembersTxt:{ fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
  skeletonRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 7 },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5E7EB' },
  skeletonLine:   { height: 12, backgroundColor: '#E5E7EB', borderRadius: 4 },
});
