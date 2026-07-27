/**
 * app/family/tracking-permissions.tsx — Tracking Permissions
 * ─────────────────────────────────────────────────────────────────────
 * Toggle tracking permissions for Background Location, Health Sync,
 * Push Notifications, and Motion & Fitness.
 */
import React from 'react';
import {
  View, Text, ScrollView, Pressable, Switch,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import { useTrackingPermissions } from '@/hooks/useCommute';

// ── Permission config ───────────────────────────────────────────────
interface PermConfig {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  required: boolean;
}

const PERM_LIST: PermConfig[] = [
  {
    key: 'background_location',
    icon: 'location-outline',
    iconBg: '#E0FDFA',
    iconColor: '#0F766E',
    title: 'Background Location',
    desc: 'Track geofence entry/exit events while the app is in the background.',
    required: true,
  },
  {
    key: 'health_sync',
    icon: 'fitness-outline',
    iconBg: '#EDE9FE',
    iconColor: '#8B5CF6',
    title: 'Health App Sync',
    desc: 'Read sleep, steps, and heart rate from Apple Health / Health Connect.',
    required: true,
  },
  {
    key: 'push_notifications',
    icon: 'notifications-outline',
    iconBg: '#FEF3C7',
    iconColor: '#F59E0B',
    title: 'Push Notifications',
    desc: 'Receive alerts when a family member arrives or departs safe zones.',
    required: false,
  },
  {
    key: 'motion_fitness',
    icon: 'walk-outline',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    title: 'Motion & Fitness',
    desc: 'Access step counter and activity recognition for accurate tracking.',
    required: false,
  },
];

// ════════════════════════════════════════════════════════════════════
export default function TrackingPermissionsScreen() {
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();
  const { permissions, loading, error, toggle } = useTrackingPermissions(id);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !permissions) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <FamilyTopBar title="Permissions" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Ionicons name="shield-outline" size={42} color={Colors.textMuted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyTxt}>{error ?? 'Could not load permissions.'}</Text>
        </View>
      </View>
    );
  }

  const perms = permissions.permissions;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar
        title="Permissions"
        onBack={() => router.back()}
        rightIcon="information-circle-outline"
      />

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark-outline" size={30} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Required Permissions</Text>
          <Text style={styles.heroSub}>
            To track commutes and sync health data, we need access to the following.
          </Text>
        </View>

        {/* ── Permission Cards ─────────────────────────────────────── */}
        {PERM_LIST.map((p) => {
          const permData = (perms as any)[p.key];
          const isGranted = permData?.granted ?? false;

          return (
            <View
              key={p.key}
              style={[styles.permCard, isGranted && styles.permCardGranted]}
            >
              <View style={[styles.permIcon, { backgroundColor: p.iconBg }]}>
                <Ionicons name={p.icon} size={20} color={p.iconColor} />
              </View>
              <View style={styles.permInfo}>
                <Text style={styles.permTitle}>{p.title}</Text>
                <Text style={styles.permDesc}>{p.desc}</Text>
                <View style={[styles.statusBadge, p.required ? styles.statusRequired : styles.statusOptional]}>
                  <Text style={[styles.statusText, p.required ? styles.statusRequiredText : styles.statusOptionalText]}>
                    {p.required ? 'Required' : 'Optional'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isGranted}
                onValueChange={(val) => toggle(p.key, val)}
                trackColor={{ false: Colors.border, true: Colors.accent }}
                thumbColor="#fff"
                ios_backgroundColor={Colors.border}
              />
            </View>
          );
        })}

        {/* ── Privacy Note ─────────────────────────────────────────── */}
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} style={{ marginTop: 1 }} />
          <Text style={styles.privacyText}>
            <Text style={{ fontWeight: '700' }}>Your privacy matters. </Text>
            Location data is only used for geofence events and is never shared with third parties.
            All data is encrypted in transit and at rest.
          </Text>
        </View>

        {/* ── Continue Button ──────────────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>

        {/* ── Last Sync Info ───────────────────────────────────────── */}
        {permissions.last_sync && (
          <Text style={styles.lastSync}>
            Last synced: {new Date(permissions.last_sync).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
            })}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTxt: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
  page:     { padding: 12, paddingBottom: 40 },

  // Hero
  hero:      { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  heroIcon:  { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  heroSub:   { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

  // Permission card
  permCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  permCardGranted: { borderColor: 'rgba(20,184,166,0.3)', backgroundColor: '#F0FDFA' },
  permIcon:        { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  permInfo:        { flex: 1 },
  permTitle:       { fontSize: 13, fontWeight: '700', color: Colors.text },
  permDesc:        { fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  statusBadge:     { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start' },
  statusRequired:      { backgroundColor: '#FEF3C7' },
  statusOptional:      { backgroundColor: '#E0E7FF' },
  statusText:          { fontSize: 10, fontWeight: '600' },
  statusRequiredText:  { color: '#92400E' },
  statusOptionalText:  { color: '#3730A3' },

  // Privacy
  privacyNote: { flexDirection: 'row', gap: 8, backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: 'rgba(20,184,166,0.2)', borderRadius: 12, padding: 12, marginVertical: 10, alignItems: 'flex-start' },
  privacyText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 17 },

  // Button
  continueBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, marginTop: 6 },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Last sync
  lastSync: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 12 },
});
