/**
 * app/family/member-profile.tsx — S9: Member Profile
 * Updated to navigate to each sub-screen.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar }       from '@/components/family/FamilyTopBar';
import { MemberProfileCard }  from '@/components/family/MemberProfileCard';
import { useMemberProfile }   from '@/hooks/useFamily';
import { AskAIButton } from '@/components/ai/AskAIButton';

type SectionIcon = keyof typeof Ionicons.glyphMap;

interface Section {
  icon:    SectionIcon;
  label:   string;
  sub:     string;
  bg:      string;
  color:   string;
  route:   string;
}

const SECTIONS: Section[] = [
  {
    icon: 'heart-outline', label: 'Health Summary', sub: 'Vitals, BMI, trends',
    bg: '#E8F5F0', color: Colors.primary, route: '/family/health-summary',
  },
  {
    icon: 'document-text-outline', label: 'Reports', sub: 'Last: CBC Report',
    bg: '#E8F0FF', color: '#007AFF', route: '/family/reports',
  },
  {
    icon: 'medical-outline', label: 'Medications', sub: '3 Active',
    bg: '#E8F5F0', color: Colors.primary, route: '/family/medications',
  },
  {
    icon: 'navigate-outline', label: 'Activity & Commute', sub: 'Sleep, steps & daily travel',
    bg: '#E0FDFA', color: Colors.primary, route: '/family/activity-commute',
  },
  {
    icon: 'calendar-outline', label: 'Appointments', sub: '2 Upcoming',
    bg: '#FEF9E8', color: Colors.warning, route: '/family/appointments',
  },
  {
    icon: 'sparkles-outline', label: 'AI Insights', sub: '2 New Insights',
    bg: '#F0EAFF', color: '#8B5CF6', route: '/family/ai-insights',
  },
  {
    icon: 'call-outline', label: 'Emergency Details', sub: 'View Contacts',
    bg: '#FFE8E8', color: Colors.danger, route: '/family/emergency',
  },
];

export default function MemberProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();
  const { profile, loading, remove } = useMemberProfile(id);

  const handleRemove = () => {
    Alert.alert(
      'Remove Member',
      `Remove ${name} from your family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => { await remove(); router.replace('/family'); } },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <FamilyTopBar title={name} onBack={() => router.back()} />
        <View style={styles.centered}>
          <Ionicons name="person-outline" size={42} color={Colors.textMuted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyTxt}>Member profile not available.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar
        title={name}
        onBack={() => router.back()}
        rightIcon="ellipsis-vertical"
        onRight={handleRemove}
      />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        {<MemberProfileCard profile={profile} />}

        {SECTIONS.map((s) => (
          <Pressable
            key={s.label}
            style={({ pressed }) => [styles.section, pressed && { backgroundColor: '#F5FDF9' }]}
            onPress={() =>
              router.push({ pathname: s.route as any, params: { id, name } })
            }
          >
            <View style={[styles.secIcon, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={18} color={s.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.secLabel}>{s.label}</Text>
              {!!s.sub && <Text style={styles.secSub}>{s.sub}</Text>}
            </View>
            {s.label === 'AI Insights' && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeTxt}>2 New</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [styles.permBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.push({ pathname: '/family/permissions', params: { member_id: id, name } })}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
          <Text style={styles.permTxt}>Manage Permissions</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTxt: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
  page:     { padding: 12, paddingBottom: 40 },
  section:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 7 },
  secIcon:  { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0 },
  secLabel: { fontSize: 14, fontWeight: '500', color: Colors.text },
  secSub:   { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  newBadge: { backgroundColor: '#F0EAFF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4 },
  newBadgeTxt: { fontSize: 10, fontWeight: '600', color: '#6D28D9' },
  permBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8F5F0', borderRadius: 12, padding: 13, marginTop: 10 },
  permTxt:  { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
