/**
 * app/family/share-invite.tsx — S4: Share Invitation / QR
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Share, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar }      from '@/components/family/FamilyTopBar';
import { generateInviteLink } from '@/services/familyApi';

export default function ShareInviteScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ relationship?: string; full_name?: string; date_of_birth?: string; blood_group?: string }>();

  const [inviteUrl,  setInviteUrl]  = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteId,   setInviteId]   = useState('');   // ← fix: store so permissions gets right member
  const [loading,    setLoading]    = useState(true);
  const [copied,     setCopied]     = useState(false);

  useEffect(() => {
    generateInviteLink({
      relationship:  params.relationship  ?? 'Family',
      full_name:     params.full_name     ?? '',
      date_of_birth: params.date_of_birth ?? '',
      blood_group:   params.blood_group,
    }).then((r) => {
      setInviteUrl(r.invite_url);
      setInviteCode(r.invite_code);
      setInviteId(r.invite_id);   // ← fix: capture invite_id from API response
    }).finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => Share.share({ message: `Join my HealthAI family: ${inviteUrl}` });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar title="Share Invitation" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.sub}>Invite your family to join HealthAI</Text>

        {/* QR placeholder */}
        <View style={styles.qrBox}>
          {loading
            ? <ActivityIndicator size="large" color={Colors.primary} />
            : <Ionicons name="qr-code-outline" size={130} color={Colors.text} />
          }
        </View>

        {!loading && (
          <>
            <Text style={styles.inviteLink}>{inviteUrl}</Text>
            <Text style={styles.inviteNote}>Anyone with this link can join your family</Text>

            <Pressable style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.85 }]} onPress={handleCopy}>
              <Ionicons name={copied ? 'checkmark-outline' : 'copy-outline'} size={18} color="#fff" />
              <Text style={styles.copyTxt}>{copied ? 'Copied!' : 'Copy Link'}</Text>
            </Pressable>

            <View style={styles.shareRow}>
              {[
                { bg: '#E8F9F0', color: '#25D366', icon: 'logo-whatsapp'      as const, label: 'WhatsApp' },
                { bg: '#E8F0FF', color: '#007AFF', icon: 'chatbubble-outline'  as const, label: 'SMS' },
                { bg: '#FFE8E8', color: '#EA4335', icon: 'mail-outline'         as const, label: 'Email' },
                { bg: '#F9FAFB', color: Colors.textMuted, icon: 'ellipsis-horizontal' as const, label: 'More' },
              ].map((s) => (
                <Pressable key={s.label} style={[styles.shareBtn, { backgroundColor: s.bg }]} onPress={handleShare}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                  <Text style={[styles.shareTxt, { color: s.color }]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => router.push({ pathname: '/family/permissions', params: { member_id: inviteId, name: params.full_name ?? 'Member' } })} style={styles.nextLink}>
              <Text style={styles.nextTxt}>Next: Set Permissions →</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: '#F4F7F6' },
  page:       { padding: 16, alignItems: 'center', paddingBottom: 40 },
  sub:        { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
  qrBox:      { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, minHeight: 180, marginBottom: 12 },
  inviteLink: { color: Colors.primary, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline', marginBottom: 4 },
  inviteNote: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  copyBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, width: '100%', marginTop: 14 },
  copyTxt:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  shareRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', marginTop: 12 },
  shareBtn:   { flex: 1, minWidth: '40%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 13, borderRadius: 12 },
  shareTxt:   { fontSize: 13, fontWeight: '700' },
  nextLink:   { marginTop: 20 },
  nextTxt:    { color: Colors.primary, fontSize: 13, fontWeight: '600' },
});
