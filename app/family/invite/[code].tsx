/**
 * app/family/invite/[code].tsx — Son-side: Invite Landing Screen
 * ─────────────────────────────────────────────────────────────────────
 * Opened via deep link:  healthai://invite/HLTH1234
 * or universal link:     https://healthai.ai/invite/HLTH1234
 *
 * Calls getInviteDetails(code) → shows who invited the user, as what
 * relationship, and offers Accept / Decline.
 *
 * Mock block is active; real fetch block is written but commented out.
 * ─────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { getInviteDetails, declineInvitation } from '@/services/familyApi';

type InviteDetails = {
  invite_id:    string;
  invited_by:   string;
  relationship: string;
  expires_at:   string;
  is_expired:   boolean;
};

const RELATIONSHIP_ICON: Record<string, string> = {
  Father: '👨', Mother: '👩', Son: '👦', Daughter: '👧',
  Brother: '👦', Sister: '👧', Grandfather: '👴', Grandmother: '👵',
  Spouse: '💑', default: '👤',
};

export default function InviteLandingScreen() {
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();

  const [details,  setDetails]  = useState<InviteDetails | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (!code) { setError('Invalid invite link.'); setLoading(false); return; }
    loadInvite();
  }, [code]);

  const loadInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      // ── MOCK (active) ────────────────────────────────────────────────
      const data = await getInviteDetails(code ?? '');
      // ── REAL (commented out — swap when backend is ready) ────────────
      // const res  = await fetch(`${BASE_URL}/api/family/invite/${code}`);
      // if (!res.ok) throw new Error('Invite not found');
      // const data = await res.json();
      // ────────────────────────────────────────────────────────────────

      setDetails(data);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load invite details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!details) return;
    router.push({
      pathname: '/family/invite-otp',
      params: {
        invite_id:    details.invite_id,
        invited_by:   details.invited_by,
        relationship: details.relationship,
      },
    });
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline ${details?.invited_by}'s invitation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            if (!details) return;
            setDeclining(true);
            try {
              // ── MOCK ─────────────────────────────────────────────────
              await declineInvitation(details.invite_id);
              // ── REAL ─────────────────────────────────────────────────
              // await fetch(`${BASE_URL}/api/family/invite/${details.invite_id}/decline`, { method: 'POST', ... });
              // ─────────────────────────────────────────────────────────
              Alert.alert('Declined', 'Invitation declined.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/home') },
              ]);
            } catch {
              Alert.alert('Error', 'Could not decline. Please try again.');
            } finally {
              setDeclining(false);
            }
          },
        },
      ]
    );
  };

  const icon = details
    ? (RELATIONSHIP_ICON[details.relationship] ?? RELATIONSHIP_ICON.default)
    : '👤';

  const expiresIn = details
    ? Math.ceil((new Date(details.expires_at).getTime() - Date.now()) / 86400000)
    : 0;

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTxt}>Loading invite details…</Text>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (error || !details) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={56} color={Colors.danger} />
        <Text style={styles.errorTitle}>Invalid Invite</Text>
        <Text style={styles.errorSub}>{error ?? 'This invite link is not valid.'}</Text>
        <Pressable style={styles.btnPrimary} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.btnPrimaryTxt}>Go to Home</Text>
        </Pressable>
      </View>
    );
  }

  // ── Expired ────────────────────────────────────────────────────────
  if (details.is_expired) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="time-outline" size={56} color={Colors.textMuted} />
        <Text style={styles.errorTitle}>Invite Expired</Text>
        <Text style={styles.errorSub}>This invitation has expired. Ask {details.invited_by} to send a new one.</Text>
        <Pressable style={styles.btnPrimary} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.btnPrimaryTxt}>Go to Home</Text>
        </Pressable>
      </View>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>

        {/* App branding */}
        <View style={styles.brandRow}>
          <Ionicons name="heart-circle" size={28} color={Colors.primary} />
          <Text style={styles.brandTxt}>HealthAI</Text>
        </View>

        {/* Invite card */}
        <View style={styles.card}>
          <Text style={styles.emoji}>{icon}</Text>
          <Text style={styles.inviteTitle}>
            <Text style={styles.highlight}>{details.invited_by}</Text> invited you
          </Text>
          <Text style={styles.inviteSub}>
            to join their HealthAI family as
          </Text>
          <View style={styles.relBadge}>
            <Text style={styles.relTxt}>{details.relationship}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.infoTxt}>
              Expires in {expiresIn} day{expiresIn !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* What happens next */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What happens next?</Text>
          {[
            { icon: 'phone-portrait-outline' as const, txt: 'Verify your phone number with an OTP' },
            { icon: 'people-outline'          as const, txt: 'Join the family and share health data' },
            { icon: 'shield-checkmark-outline' as const, txt: 'View permissions set by ' + details.invited_by },
          ].map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <Ionicons name={s.icon} size={16} color={Colors.primary} />
              </View>
              <Text style={styles.stepTxt}>{s.txt}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
          onPress={handleAccept}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.btnPrimaryTxt}>Accept Invitation</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.7 }, declining && { opacity: 0.5 }]}
          onPress={handleDecline}
          disabled={declining}
        >
          {declining
            ? <ActivityIndicator size="small" color={Colors.danger} />
            : <Text style={styles.btnSecondaryTxt}>Decline</Text>
          }
        </Pressable>

        <Text style={styles.footerNote}>
          By accepting, you agree to share your HealthAI data with {details.invited_by} based on the permissions they set.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#F4F7F6' },
  page:         { padding: 20, paddingBottom: 40, alignItems: 'center' },
  center:       { flex: 1, backgroundColor: '#F4F7F6', justifyContent: 'center', alignItems: 'center', padding: 24 },

  brandRow:     { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 24, marginTop: 8 },
  brandTxt:     { fontSize: 18, fontWeight: '700', color: Colors.text },

  card:         { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  emoji:        { fontSize: 52, marginBottom: 12 },
  inviteTitle:  { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 4 },
  highlight:    { color: Colors.primary },
  inviteSub:    { fontSize: 14, color: Colors.textMuted, marginBottom: 10 },
  relBadge:     { backgroundColor: '#E8F9F0', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 14 },
  relTxt:       { fontSize: 15, fontWeight: '700', color: Colors.primary },
  divider:      { width: '100%', height: 1, backgroundColor: Colors.border, marginBottom: 12 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoTxt:      { fontSize: 12, color: Colors.textMuted },

  stepsCard:    { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  stepsTitle:   { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepIcon:     { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8F9F0', justifyContent: 'center', alignItems: 'center' },
  stepTxt:      { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },

  btnPrimary:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, padding: 15, width: '100%', marginBottom: 10 },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary:  { borderRadius: 14, padding: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.danger, marginBottom: 16 },
  btnSecondaryTxt: { color: Colors.danger, fontSize: 15, fontWeight: '600' },

  loadingTxt:   { marginTop: 12, fontSize: 14, color: Colors.textMuted },
  errorTitle:   { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 12, marginBottom: 6 },
  errorSub:     { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  footerNote:   { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 17 },
});
