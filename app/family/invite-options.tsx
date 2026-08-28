/**
 * app/family/invite-options.tsx — S3: Invite Options
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';

const OPTIONS = [
  { icon: 'phone-portrait-outline' as const, label: 'Invite via Mobile Number', sub: 'Send invitation on mobile',  bg: '#E8F9F0', color: '#25D366', channel: 'sms' },
  { icon: 'mail-outline'           as const, label: 'Invite via Email',          sub: 'Send invitation on email',  bg: '#E8F0FF', color: '#007AFF', channel: 'email' },
  { icon: 'link-outline'           as const, label: 'Share Invite Link',         sub: 'Share link via any app',    bg: '#F0EAFF', color: '#8B5CF6', channel: 'link' },
  { icon: 'qr-code-outline'        as const, label: 'Share QR Code',             sub: 'Generate and share QR',    bg: '#FEF9E8', color: '#F59E0B', channel: 'qr' },
];

export default function InviteOptionsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const handleOption = (channel: string) => {
    router.push({ pathname: '/family/share-invite', params: { ...params, channel } });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.heading}>How would you like to invite?</Text>
        <Text style={styles.sub}>Choose your preferred method</Text>
        {OPTIONS.map((opt) => (
          <Pressable
            key={opt.channel}
            style={({ pressed }) => [styles.optCard, pressed && { backgroundColor: '#F5FDF9' }]}
            onPress={() => handleOption(opt.channel)}
          >
            <View style={[styles.optIcon, { backgroundColor: opt.bg }]}>
              <Ionicons name={opt.icon} size={22} color={opt.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optLabel}>{opt.label}</Text>
              <Text style={styles.optSub}>{opt.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#F4F7F6' },
  page:    { padding: 16, paddingTop: 8 },
  heading: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 4, marginTop: 8 },
  sub:     { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 16 },
  optCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 9 },
  optIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  optLabel:{ fontSize: 14, fontWeight: '600', color: Colors.text },
  optSub:  { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
