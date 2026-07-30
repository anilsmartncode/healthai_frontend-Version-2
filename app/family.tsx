/**
 * app/family.tsx — Family Health / Care Hub
 * UI matched to Care Hub design. Data from useFamilyDashboard().
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useFamilyDashboard } from '@/hooks/useFamily';
import { PendingBanner } from '@/components/family/PendingBanner';
import type { FamilyMember, HealthStatus } from '@/services/familyApi';

function scoreBadge(status: HealthStatus, score: number) {
  if (status === 'Excellent' || status === 'Good') {
    return { label: status === 'Excellent' ? 'Excellent' : 'Good', bg: '#DCFCE7', color: '#15803D' };
  }
  if (status === 'Attention') {
    return { label: 'Average', bg: '#FFEDD5', color: '#C2410C' };
  }
  return { label: 'Critical', bg: '#FEE2E2', color: '#DC2626' };
}

function formatDisplayName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const { dashboard, loading, error, refresh } = useFamilyDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const onMemberPress = (m: FamilyMember) =>
    router.push({
      pathname: '/family/member-profile',
      params: { id: m.member_id, name: m.name },
    });

  const members = dashboard?.members ?? [];
  const total = dashboard?.total_members ?? members.length;
  const allGood =
    !loading &&
    members.length > 0 &&
    (dashboard?.attention_count ?? 0) === 0 &&
    (dashboard?.critical_count ?? 0) === 0;

  const overviewSub = loading
    ? 'Loading family…'
    : total === 0
      ? 'No members yet'
      : `${total} Member${total === 1 ? '' : 's'} • ${allGood ? 'All in good health' : `${dashboard?.good_count ?? 0} in good health`}`;

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

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.topTitles}>
          <Text style={styles.topTitle}>Family Health</Text>
          <Text style={styles.topSubtitle}>Care Hub</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/family/add-member')}
          hitSlop={8}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Intro */}
        <View style={styles.introRow}>
          <Text style={styles.introText}>Manage and care for your loved ones</Text>
          <View style={styles.introArt}>
            <Ionicons name="people" size={28} color={Colors.primary} />
            <View style={styles.introHeart}>
              <Ionicons name="heart" size={12} color={Colors.primary} />
            </View>
          </View>
        </View>

        {/* Family Overview */}
        <Pressable
          style={({ pressed }) => [styles.overviewCard, pressed && { opacity: 0.92 }]}
          onPress={() => router.push('/family/health-summary')}
        >
          <View style={styles.overviewIcon}>
            <Ionicons name="people" size={22} color={Colors.primary} />
          </View>
          <View style={styles.overviewText}>
            <Text style={styles.overviewTitle}>Family Overview</Text>
            <Text style={styles.overviewSub}>{overviewSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>

        {/* Members header */}
        <View style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          <Pressable
            style={styles.reorderBtn}
            onPress={() => router.push('/family/tree')}
            hitSlop={8}
          >
            <Ionicons name="menu-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.reorderTxt}>Reorder</Text>
          </Pressable>
        </View>

        {/* Members list */}
        <View style={styles.membersCard}>
          {loading ? (
            [0, 1, 2].map((i) => (
              <View key={i} style={[styles.memberRow, i !== 0 && styles.memberDivider]}>
                <View style={styles.skeletonAvatar} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={[styles.skeletonLine, { width: '55%' }]} />
                  <View style={[styles.skeletonLine, { width: '35%' }]} />
                </View>
              </View>
            ))
          ) : members.length === 0 ? (
            <View style={styles.emptyMembers}>
              <Ionicons name="person-add-outline" size={28} color={Colors.primary} style={{ opacity: 0.45 }} />
              <Text style={styles.emptyMembersTxt}>
                No members yet. Invite someone to get started.
              </Text>
            </View>
          ) : (
            members.map((m, index) => {
              const badge = scoreBadge(m.status, m.health_score);
              const isYou =
                /^(self|me|you)$/i.test(m.relationship) ||
                index === 0 && /you/i.test(m.name);
              const displayName = formatDisplayName(m.name);

              return (
                <Pressable
                  key={m.member_id || String(index)}
                  style={({ pressed }) => [
                    styles.memberRow,
                    index !== 0 && styles.memberDivider,
                    pressed && { backgroundColor: '#F8FAFC' },
                  ]}
                  onPress={() => onMemberPress(m)}
                >
                  {m.avatar_url ? (
                    <Image source={{ uri: m.avatar_url }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarInitial}>
                        {displayName.trim().charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {displayName}
                      {isYou ? ' (You)' : ''}
                    </Text>
                    <Text style={styles.memberMeta} numberOfLines={1}>
                      {m.relationship || 'Family member'}
                    </Text>
                  </View>

                  <View style={[styles.scoreBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.scoreNum, { color: badge.color }]}>{m.health_score}</Text>
                    <Text style={[styles.scoreLbl, { color: badge.color }]}>{badge.label}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </Pressable>
              );
            })
          )}
        </View>

        {/* Invite card */}
        <Pressable
          style={({ pressed }) => [styles.inviteCard, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/family/add-member')}
        >
          <View style={styles.inviteIcon}>
            <Ionicons name="person-add" size={20} color="#16A34A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>Invite Family Member</Text>
            <Text style={styles.inviteSub}>Add a family member to manage their health</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#16A34A" />
        </Pressable>

        {/* Pending invitations */}
        {!loading && dashboard && (
          <PendingBanner
            count={dashboard.pending_invitations_count}
            onPress={() => router.push('/family/invitations')}
          />
        )}

        {/* Footer banner */}
        <View style={styles.footerBanner}>
          <View style={styles.footerIcon}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerTitle}>Your family's health, always in one place.</Text>
            <Text style={styles.footerSub}>Secure. Private. Always with you.</Text>
          </View>
        </View>

        {/* Keep secondary actions reachable */}
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
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  errTxt: { fontSize: 14, color: Colors.danger, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryTxt: { color: '#fff', fontWeight: '700' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitles: { flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  topSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  page: { paddingHorizontal: 16, paddingBottom: 40 },

  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  introText: { flex: 1, fontSize: 14, color: Colors.textMuted, lineHeight: 20 },
  introArt: {
    width: 56,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introHeart: {
    position: 'absolute',
    bottom: 4,
    right: 8,
  },

  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  overviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewText: { flex: 1 },
  overviewTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  overviewSub: { marginTop: 2, fontSize: 12, color: Colors.textMuted },

  sectionHdr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reorderTxt: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },

  membersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  memberDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 46, height: 46, borderRadius: 23 },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  memberMeta: { marginTop: 2, fontSize: 12, color: Colors.textMuted },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 58,
  },
  scoreNum: { fontSize: 14, fontWeight: '800' },
  scoreLbl: { fontSize: 10, fontWeight: '700', marginTop: 1 },

  emptyMembers: { alignItems: 'center', gap: 8, paddingVertical: 28, paddingHorizontal: 20 },
  emptyMembersTxt: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  skeletonAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E5E7EB' },
  skeletonLine: { height: 11, backgroundColor: '#E5E7EB', borderRadius: 4 },

  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  inviteIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTitle: { fontSize: 14, fontWeight: '700', color: '#15803D' },
  inviteSub: { marginTop: 2, fontSize: 12, color: Colors.textMuted },

  footerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 14,
  },
  footerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTitle: { fontSize: 13, fontWeight: '700', color: '#166534' },
  footerSub: { marginTop: 2, fontSize: 11, color: Colors.textMuted },

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickTxt: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
