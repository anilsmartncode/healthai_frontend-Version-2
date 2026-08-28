/**
 * InvitationCard.tsx — S6 Pending/Accepted invitation card
 * Mirrors .invite-card in the HTML reference.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { Invitation } from '@/services/familyApi';

interface Props {
  invitation: Invitation;
  onResend?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function InvitationCard({ invitation, onResend, onCancel }: Props) {
  const isPending = invitation.status === 'pending';
  const statusColor = isPending ? Colors.warning : Colors.success;

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={20} color={Colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{invitation.name}</Text>
        <Text style={styles.date}>Invited on {invitation.invited_on}</Text>
        <Text style={[styles.status, { color: statusColor }]}>
          {isPending ? 'Pending' : 'Accepted'}
        </Text>
      </View>
      {isPending && (
        <View style={styles.actions}>
          {onResend && (
            <Pressable style={styles.resendBtn} onPress={() => onResend(invitation.invite_id)}>
              <Text style={styles.resendTxt}>Resend</Text>
            </Pressable>
          )}
          {onCancel && (
            <Pressable style={styles.cancelBtn} onPress={() => onCancel(invitation.invite_id)}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 13, marginBottom: 9 },
  avatar:    { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E8F5F0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  info:      { flex: 1, marginLeft: 10 },
  name:      { fontSize: 14, fontWeight: '600', color: Colors.text },
  date:      { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  status:    { fontSize: 11, fontWeight: '600', marginTop: 3 },
  actions:   { flexDirection: 'column', gap: 6, marginLeft: 8 },
  resendBtn: { backgroundColor: '#E8F5F0', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  resendTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  cancelBtn: { backgroundColor: '#FFE8E8', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12 },
  cancelTxt: { fontSize: 12, fontWeight: '700', color: Colors.danger },
});
