import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/Languagecontext';
import { useUsage } from '@/context/UsageContext';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { api } from '@/services/api';
import { ENDPOINTS, BASE_URL } from '@/constants/api';
import { medicineApiCall } from '@/services/Medicineapiclient';

type ProfileData = {
  name: string;
  email: string;
  avatarUrl: string | null;
  plan: string | null;
};

export default function Profile() {
  const { phone, memberId, signOut } = useAuth();
  const { t } = useLang();
  const { activePlan } = useUsage();

  const isActualPhone = (val?: string | null) => !!val && !val.includes('@') && /\d/.test(val);
  const isActualEmail = (val?: string | null) => !!val && val.includes('@');

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: isActualEmail(phone) ? phone! : '',
    avatarUrl: null,
    plan: null,
  });

  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const sanitizeAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null;
    let clean = String(url).trim();
    if (!clean) return null;
    if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
      clean = clean.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, BASE_URL);
    }
    if (clean.startsWith('http://healthai.smartncode.com')) {
      clean = clean.replace('http://', 'https://');
    }
    if (clean.startsWith('https://healthai.smartncode.com/uploads/')) {
      clean = clean.replace('https://healthai.smartncode.com/uploads/', 'https://healthai.smartncode.com/api/uploads/');
    } else if (clean.startsWith('http://healthai.smartncode.com/uploads/')) {
      clean = clean.replace('http://healthai.smartncode.com/uploads/', 'https://healthai.smartncode.com/api/uploads/');
    } else if (clean.startsWith('/uploads/')) {
      clean = `${BASE_URL}/api${clean}`;
    } else if (clean.startsWith('uploads/')) {
      clean = `${BASE_URL}/api/${clean}`;
    } else if (
      !clean.startsWith('http://') &&
      !clean.startsWith('https://') &&
      !clean.startsWith('file://') &&
      !clean.startsWith('content://') &&
      !clean.startsWith('blob:')
    ) {
      clean = clean.startsWith('/') ? `${BASE_URL}${clean}` : `${BASE_URL}/${clean}`;
    }
    return clean;
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const userKey = profile.email || (isActualPhone(phone) ? phone! : 'guest');
      const cacheKey = `healthai_profile_name_${userKey}`;
      setAvatarLoadError(false);

      (async () => {
        try {
          const [cachedName, cachedAvatar] = await Promise.all([
            AsyncStorage.getItem(cacheKey),
            AsyncStorage.getItem(`healthai_avatar_${userKey}`),
          ]);
          if (!cancelled) {
            setProfile((p) => ({
              ...p,
              ...(cachedName ? { name: cachedName } : {}),
              ...(cachedAvatar ? { avatarUrl: sanitizeAvatarUrl(cachedAvatar) } : {}),
            }));
          }
        } catch { /* ignore */ }

        try {
          const raw = await api.request<any>(ENDPOINTS.profileMePath);
          const data = raw?.user ?? raw;
          if (cancelled) return;

          const displayName = (data?.full_name ?? data?.name ?? '').trim();
          let avUrl = data?.avatar_url ?? data?.profile_image ?? data?.avatar ?? null;
          avUrl = sanitizeAvatarUrl(avUrl);

          const key = data?.email || (isActualPhone(phone) ? phone : 'guest');

          let localPhone = '';
          let localAvatar = '';
          try {
            const [pVal, aVal] = await Promise.all([
              AsyncStorage.getItem(`healthai_phone_${key}`),
              AsyncStorage.getItem(`healthai_avatar_${key}`),
            ]);
            localPhone = pVal || '';
            localAvatar = aVal || '';
          } catch { /* ignore */ }

          if (!avUrl && localAvatar) {
            avUrl = sanitizeAvatarUrl(localAvatar);
          } else if (avUrl) {
            try { await AsyncStorage.setItem(`healthai_avatar_${key}`, avUrl); } catch { /* ignore */ }
          }

          const resolvedEmail = data?.email || (isActualEmail(phone) ? phone : '');

          const next: ProfileData = {
            name: displayName || '',
            email: isActualEmail(resolvedEmail) ? resolvedEmail : '',
            avatarUrl: avUrl,
            plan: data?.plan || data?.subscription_tier || data?.subscription || null,
          };
          setProfile(next);

          if (displayName) {
            try { await AsyncStorage.setItem(cacheKey, displayName); } catch { /* ignore */ }
          }
        } catch (e) {
          console.warn('[Profile] Failed to refresh profile', e);
        }
      })();

      return () => { cancelled = true; };
    }, [phone, memberId])
  );

  const currentPlan = (profile.plan || activePlan || 'FREE').toUpperCase();
  const planLabel = currentPlan === 'FAMILY' ? 'FAMILY' : (currentPlan === 'PREMIUM' ? 'PREMIUM' : 'FREE');

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all associated health data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicineApiCall(ENDPOINTS.deleteAccount, { method: 'DELETE' });
              Alert.alert('Account Deleted', 'Your account and data have been permanently deleted.', [
                {
                  text: 'OK',
                  onPress: () => {
                    signOut().then(() => router.replace('/(auth)/onboarding'));
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete account. Please contact support.');
            }
          },
        },
      ]
    );
  };

  const settingsItems = [
    { icon: 'person-outline', title: 'Personal Information', href: '/account' },
    { icon: 'people-outline', title: 'Family Health', href: '/family' },
    { icon: 'shield-checkmark-outline', title: 'Legal & Privacy', href: '/legal-privacy' },
    { icon: 'card-outline', title: 'Subscription & Plans', href: '/plans' },
    { icon: 'help-circle-outline', title: 'Help & Support', href: '/help-support' },
    { icon: 'star-outline', title: 'Rate the app', href: '/rate-app' },
  ];

  const formatDisplayName = (name: string): string => {
    return name
      .trim()
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.headerTitle}>Profile and Settings</Text>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            {profile.avatarUrl && !avatarLoadError ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatarImg}
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color={Colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>
                {profile.name ? formatDisplayName(profile.name) : 'Guest User'}
              </Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{planLabel}</Text>
              </View>
            </View>
            {!!profile.email && (
              <Text style={styles.emailText}>{profile.email}</Text>
            )}
          </View>
        </View>

        {/* Links */}
        <View style={styles.linksContainer}>
          {settingsItems.map((item, index) => (
            <Pressable
              key={index}
              style={styles.linkRow}
              onPress={() => router.push(item.href as any)}
            >
              <Ionicons name={item.icon as any} size={22} color="#1F2937" style={styles.linkIcon} />
              <Text style={styles.linkText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </Pressable>
          ))}

          <Pressable style={styles.linkRow} onPress={async () => {
            await signOut();
            router.replace('/(auth)/onboarding');
          }}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" style={styles.linkIcon} />
            <Text style={[styles.linkText, { color: '#EF4444' }]}>Log Out</Text>
          </Pressable>

          <Pressable style={styles.linkRow} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" style={styles.linkIcon} />
            <Text style={[styles.linkText, { color: '#EF4444' }]}>Delete Account</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  planBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  planBadgeText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '700',
  },
  emailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linksContainer: {
    marginTop: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '400',
  },
});
