import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Colors, Radius } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/Languagecontext';
import { useUsage } from '@/context/UsageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { api } from '@/services/api';
import { ENDPOINTS, BASE_URL } from '@/constants/api';
import { reportsApi } from '@/services/reportsApi';
import { getFamilyDashboard } from '@/services/familyApi';

const PROFILE_AVATAR = require('@/assets/images/profile_avatar.png');
const STAT_GAP = 8;

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  dob: string | null;
  gender: string | null;
  location: string | null;
};

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function formatDob(dob: string | null): string | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDisplayName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export default function Profile() {
  const { phone, signOut } = useAuth();
  const { t } = useLang();
  const { activePlan } = useUsage();
  const { unreadCount } = useNotifications();

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: phone ?? '',
    avatarUrl: null,
    dob: null,
    gender: null,
    location: null,
  });
  const [familyCount, setFamilyCount] = useState<number | null>(null);
  const [healthScore, setHealthScore] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const cacheKey = `healthai_profile_name_${phone ?? 'guest'}`;

      (async () => {
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached && !cancelled) {
            setProfile((p) => ({ ...p, name: cached }));
          }
        } catch { /* ignore */ }

        try {
          const raw = await api.request<any>(ENDPOINTS.profileMePath);
          const data = raw?.user ?? raw;
          if (cancelled) return;

          const displayName = (data?.full_name ?? data?.name ?? '').trim();
          let avUrl = data?.avatar_url ?? null;
          if (avUrl && !String(avUrl).startsWith('http')) {
            avUrl = String(avUrl).startsWith('/')
              ? BASE_URL + avUrl
              : `${BASE_URL}/${avUrl}`;
          }

          const next: ProfileData = {
            name: displayName || '',
            email: data?.email ?? '',
            phone: data?.phone ?? phone ?? '',
            avatarUrl: avUrl,
            dob: data?.date_of_birth ?? data?.dob ?? null,
            gender: data?.gender ?? null,
            location:
              data?.location
              || [data?.city, data?.state, data?.country].filter(Boolean).join(', ')
              || null,
          };
          setProfile(next);

          if (displayName) {
            try { await AsyncStorage.setItem(cacheKey, displayName); } catch { /* ignore */ }
          }
        } catch (e) {
          console.warn('[Profile] Failed to refresh profile', e);
        }

        try {
          const [dash, score] = await Promise.all([
            getFamilyDashboard().catch(() => null),
            reportsApi.getScorecard().catch(() => null),
          ]);
          if (cancelled) return;
          if (dash) setFamilyCount(dash.total_members ?? dash.members?.length ?? 0);
          if (score?.overallScore != null) setHealthScore(score.overallScore);
        } catch { /* ignore */ }
      })();

      return () => { cancelled = true; };
    }, [phone])
  );

  const isPremium = String(activePlan || '').toUpperCase() !== 'FREE';
  const age = calcAge(profile.dob);
  const dobLabel = formatDob(profile.dob);
  const dobLine = [dobLabel, age != null ? `${age} Years` : null]
    .filter(Boolean)
    .join(' • ');

  const settingsItems = [
    {
      icon: 'person-outline' as const,
      iconBg: '#E0F2F1',
      iconColor: '#0F766E',
      title: 'Personal Information',
      subtitle: 'Name, email, phone & personal details',
      href: '/account',
      badge: null as string | null,
      trailing: null as string | null,
    },
    {
      icon: 'heart-outline' as const,
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      title: 'Health Preferences',
      subtitle: 'Goals, reminders & notification prefs',
      href: '/notifications',
      badge: null,
      trailing: null,
    },
    {
      icon: 'shield-checkmark-outline' as const,
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
      title: 'Privacy & Security',
      subtitle: 'Data sharing, permissions & security',
      href: '/legal-privacy',
      badge: null,
      trailing: null,
    },
    {
      icon: 'link-outline' as const,
      iconBg: '#FFEDD5',
      iconColor: '#EA580C',
      title: 'Linked Accounts & Devices',
      subtitle: 'Manage connected apps and devices',
      href: '/notifications',
      badge: null,
      trailing: null,
    },
    {
      icon: 'diamond-outline' as const,
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
      title: 'Subscription & Plan',
      subtitle: 'Billing, upgrades and plan details',
      href: '/plans',
      badge: isPremium ? 'Premium' : String(activePlan || 'FREE'),
      trailing: null,
    },
    {
      icon: 'chatbubble-ellipses-outline' as const,
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      title: t('help_support'),
      subtitle: 'FAQs, chat support & feedback',
      href: '/help-support',
      badge: null,
      trailing: null,
    },
    {
      icon: 'information-circle-outline' as const,
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
      title: 'About HealthAI',
      subtitle: 'App info, version & rate the app',
      href: '/rate-app',
      badge: null,
      trailing: 'v1.0.0',
    },
  ];

  const quickStats = [
    {
      key: 'family',
      label: 'Family Health',
      value: familyCount != null ? `${familyCount} Members` : 'View',
      icon: 'people' as const,
      color: '#16A34A',
      bg: '#ECFDF5',
      onPress: () => router.push('/family' as any),
    },
    {
      key: 'score',
      label: 'Health Score',
      value: healthScore != null ? `${healthScore} / 100` : '— / 100',
      icon: 'shield-checkmark' as const,
      color: '#7C3AED',
      bg: '#F5F3FF',
      onPress: () => router.push('/(tabs)/reports' as any),
    },
    {
      key: 'badges',
      label: 'Achievements',
      value: '5 Badges',
      icon: 'star' as const,
      color: '#EA580C',
      bg: '#FFF7ED',
      onPress: () => router.push('/rate-app' as any),
    },
    {
      key: 'id',
      label: 'Health ID',
      value: 'View',
      icon: 'document-lock' as const,
      color: '#2563EB',
      bg: '#EFF6FF',
      onPress: () => router.push('/account' as any),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your account and preferences</Text>
          </View>
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.push('/account' as any)}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.text} />
          </Pressable>
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.push('/notifications' as any)}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Profile card */}
        <Pressable
          style={styles.profileCard}
          onPress={() => router.push('/account' as any)}
        >
          <View style={styles.avatarWrap}>
            <Image source={PROFILE_AVATAR} style={styles.avatarImg} />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {profile.name ? formatDisplayName(profile.name) : t('profile')}
              </Text>
              <View style={[styles.memberBadge, isPremium ? styles.memberBadgePremium : styles.memberBadgeFree]}>
                <Ionicons
                  name={isPremium ? 'ribbon' : 'sparkles'}
                  size={12}
                  color={isPremium ? '#15803D' : Colors.primary}
                />
                <Text style={[styles.memberBadgeText, isPremium ? styles.memberBadgeTextPremium : styles.memberBadgeTextFree]}>
                  {isPremium ? 'Premium' : String(activePlan || 'FREE')}
                </Text>
              </View>
            </View>

            {!!profile.phone && (
              <View style={styles.metaRow}>
                <Ionicons name="call-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{profile.phone}</Text>
              </View>
            )}
            {!!profile.email && (
              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={13} color={Colors.textMuted} style={styles.metaIcon} />
                <Text style={styles.metaText}>{profile.email}</Text>
              </View>
            )}
            {!!dobLine && (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{dobLine}</Text>
              </View>
            )}
            {!!profile.gender && (
              <View style={styles.metaRow}>
                <Ionicons name="male-female-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{profile.gender}</Text>
              </View>
            )}
            {!!profile.location && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{profile.location}</Text>
              </View>
            )}
            {!profile.email && !profile.phone && (
              <Text style={styles.metaText}>{phone ?? 'guest@healthai.app'}</Text>
            )}
          </View>
        </Pressable>

        {/* Quick stats — fixed 2×2 rows so every label/value is fully visible */}
        <View style={styles.statsGrid}>
          {[0, 1].map((row) => (
            <View key={`stat-row-${row}`} style={styles.statsRow}>
              {quickStats.slice(row * 2, row * 2 + 2).map((s) => (
                <Pressable
                  key={s.key}
                  style={styles.statCard}
                  onPress={s.onPress}
                >
                  <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={18} color={s.color} />
                  </View>
                  <View style={styles.statTextWrap}>
                    <Text style={styles.statLabel}>{s.label}</Text>
                    <Text style={styles.statValue}>{s.value}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {/* Account & Settings */}
        <Text style={styles.sectionTitle}>Account & Settings</Text>
        <View style={styles.menuCard}>
          {settingsItems.map((item, i) => (
            <Pressable
              key={item.title}
              style={[styles.menuRow, i !== 0 && styles.menuDivider]}
              onPress={() => router.push(item.href as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
              {item.badge ? (
                <View style={styles.planChip}>
                  <Text style={styles.planChipText}>{item.badge}</Text>
                </View>
              ) : null}
              {item.trailing ? (
                <Text style={styles.versionText}>{item.trailing}</Text>
              ) : null}
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Security banner */}
        <View style={styles.secureBanner}>
          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.secureTitle}>Your health data is secure</Text>
            <Text style={styles.secureSub}>
              We use industry-standard encryption to keep your data safe and private.
            </Text>
          </View>
          <Pressable
            style={styles.learnMore}
            onPress={() => router.push('/legal-privacy' as any)}
          >
            <Text style={styles.learnMoreText}>Learn More</Text>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/onboarding');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>{t('log_out')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  subtitle: { marginTop: 2, fontSize: 13, color: Colors.textMuted },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarWrap: { width: 72, height: 72, marginTop: 2 },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: { flex: 1, minWidth: 0, gap: 5 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  name: { flex: 1, flexShrink: 1, fontSize: 17, fontWeight: '700', color: Colors.text, marginRight: 8 },
  memberBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  memberBadgePremium: { backgroundColor: '#DCFCE7' },
  memberBadgeFree: { backgroundColor: Colors.primary + '18' },
  memberBadgeText: { fontSize: 11, fontWeight: '700' },
  memberBadgeTextPremium: { color: '#15803D' },
  memberBadgeTextFree: { color: Colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, width: '100%' },
  metaIcon: { marginTop: 2 },
  metaText: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },

  statsGrid: {
    marginTop: 14,
    gap: STAT_GAP,
  },
  statsRow: {
    flexDirection: 'row',
    gap: STAT_GAP,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 64,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: { flex: 1 },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  statValue: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700',
    flexWrap: 'wrap',
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  menuSubtitle: { marginTop: 2, fontSize: 11, color: Colors.textMuted },
  planChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  planChipText: { fontSize: 10, fontWeight: '700', color: '#15803D' },
  versionText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginRight: 2 },

  secureBanner: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  secureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureTitle: { fontSize: 13, fontWeight: '700', color: '#166534' },
  secureSub: { marginTop: 2, fontSize: 11, color: '#15803D', lineHeight: 15 },
  learnMore: {
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  learnMoreText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

  logoutBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});
