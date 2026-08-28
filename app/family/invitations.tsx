/**
 * app/family/invitations.tsx — S6: Pending & Accepted Invitations
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar }    from '@/components/family/FamilyTopBar';
import { InvitationCard }  from '@/components/family/InvitationCard';
import { useInvitations }  from '@/hooks/useFamily';

export default function InvitationsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'pending' | 'accepted'>('pending');
  const { pending, accepted, loading, handleResend, handleCancel } = useInvitations();
  const list = tab === 'pending' ? pending : accepted;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar title="Invitations" onBack={() => router.back()} />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['pending', 'accepted'] as const).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
              {t === 'pending' ? `Pending (${pending.length})` : `Accepted (${accepted.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        {loading
          ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
          : list.length === 0
            ? <Text style={styles.empty}>No {tab} invitations</Text>
            : list.map((inv) => (
                <InvitationCard
                  key={inv.invite_id}
                  invitation={inv}
                  onResend={tab === 'pending' ? handleResend : undefined}
                  onCancel={tab  === 'pending' ? handleCancel : undefined}
                />
              ))
        }

        {tab === 'pending' && pending.length > 0 && (
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={15} color={Colors.textMuted} />
            <Text style={styles.noteTxt}>
              Invitations are valid for 7 days. You can resend or cancel anytime.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: '#F4F7F6' },
  tabRow:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 4, margin: 12 },
  tab:       { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabTxt:    { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  tabTxtActive:{ color: '#fff', fontWeight: '700' },
  page:      { paddingHorizontal: 12, paddingBottom: 40 },
  empty:     { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 14 },
  noteBox:   { flexDirection: 'row', gap: 7, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 11, marginTop: 6 },
  noteTxt:   { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 17 },
});
