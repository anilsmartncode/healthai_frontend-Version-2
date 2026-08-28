import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
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
import { getFamilyDashboard } from '@/services/familyApi';
import { reportsApi } from '@/services/reportsApi';

export default function Profile() {
  const { phone, memberId, signOut } = useAuth();
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const { activePlan } = useUsage();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [familyCount, setFamilyCount] = useState<number>(4);
  const [healthScore, setHealthScore] = useState<number>(78);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const cacheKey = `healthai_profile_name_${phone ?? 'guest'}`;
      const avatarCacheKey = `healthai_profile_avatar_${phone ?? 'guest'}`;

      (async () => {
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached && !cancelled) setDisplayName(cached);
          const cachedAvatar = await AsyncStorage.getItem(avatarCacheKey);
          if (cachedAvatar && !cancelled) setAvatarUrl(cachedAvatar);
        } catch { /* ignore */ }

        try {
          const raw = await api.request<any>(ENDPOINTS.profileMePath);
          const data = raw?.user ?? raw;
          if (cancelled) return;

          const name = (data?.full_name ?? data?.name ?? '').trim();
          if (name) {
            setDisplayName(name);
            try { await AsyncStorage.setItem(cacheKey, name); } catch { /* ignore */ }
          }

          let avUrl = data.avatar_url ?? data.image_url ?? data.profile_image ?? data.profile_image_url ?? null;
          if (avUrl) {
            if (avUrl.includes('.smartncode.com/uploads/')) {
              avUrl = avUrl.replace('.smartncode.com/uploads/', '.smartncode.com/api/uploads/');
            } else if (!avUrl.startsWith('http')) {
              avUrl = avUrl.startsWith('/') ? BASE_URL + avUrl : `${BASE_URL}/${avUrl}`;
            }
          }
          if (avUrl) {
            setAvatarUrl(avUrl);
            try { await AsyncStorage.setItem(avatarCacheKey, avUrl); } catch { /* ignore */ }
          }
        } catch (e) {
          console.warn('[Profile] Failed to refresh profile', e);
        }

        // Fetch dynamic Family member count
        try {
          const famData = await getFamilyDashboard();
          if (!cancelled && famData?.members && Array.isArray(famData.members) && famData.members.length > 0) {
            setFamilyCount(famData.members.length);
          }
        } catch { /* fallback to default */ }

        // Fetch dynamic latest Health score
        try {
          const repList = await reportsApi.list(phone);
          if (!cancelled && repList && repList.length > 0) {
            const valid = repList.find(r => (r.healthScore ?? 0) > 0);
            if (valid?.healthScore) {
              setHealthScore(valid.healthScore);
            }
          }
        } catch { /* fallback to default */ }
      })();

      return () => { cancelled = true; };
    }, [phone, memberId])
  );

  const initial = displayName ? displayName.charAt(0).toUpperCase() : '';

  const handleDeleteAccount = () => {
    Alert.alert(
      t('delete_account'),
      t('delete_account_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete_btn'),
          style: 'destructive',
          onPress: async () => {
            try {
              await medicineApiCall(ENDPOINTS.deleteAccount, { method: 'DELETE' });

              Alert.alert(t('account_deleted'), t('account_deleted_sub'), [
                {
                  text: 'OK', onPress: () => {
                    signOut().then(() => router.replace('/(auth)/onboarding'));
                  }
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete account. Please contact support.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('log_out'),
      t('logout_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('log_out'),
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await signOut();
              router.replace('/(auth)/onboarding');
            } catch (error) {
              console.error('[Profile] Logout error:', error);
              Alert.alert('Error', t('logout_error'));
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  type MenuItem = {
    icon: string;
    label: string;
    href: string;
    badge?: string;
  };

  // Kept exact current options intact
  const items: MenuItem[] = [
    { icon: 'person-outline', label: t('account_info'), href: '/account' },
    { icon: 'options-outline', label: t('health_preferences'), href: '/health-preferences' },
    { icon: 'globe-outline', label: t('language_pref'), href: '/(auth)/language' },
    { icon: 'accessibility-outline', label: t('accessibility'), href: '/accessibility' },
    { icon: 'shield-checkmark-outline', label: t('privacy_security'), href: '/privacy-security' },
    { icon: 'lock-closed-outline', label: t('app_lock'), href: '/app-lock' },
    { icon: 'link-outline', label: t('linked_accounts'), href: '/linked-accounts' },
    { icon: 'card-outline', label: t('subscription_plans'), href: '/plans' },
    { icon: 'help-circle-outline', label: t('help_support'), href: '/help-support' },
    { icon: 'information-circle-outline', label: t('about_app'), href: '/about', badge: 'v1.0.2' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar matching Prototype v2 */}
      <View style={styles.topbar}>
        <Text style={[styles.topTitle, { textAlign }]}>{t('profile')}</Text>
        <Text style={[styles.topSub, { textAlign }]}>{t('profile_settings')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Information Card — Prototype v2 Style (clickable to /account) */}
        <Pressable
          style={({ pressed }) => [
            styles.profileCard,
            { flexDirection: rowDirection },
            pressed && { backgroundColor: '#F8FAFC' },
          ]}
          onPress={() => router.push('/account')}
        >
          <View style={[styles.avatar, avatarUrl ? { backgroundColor: 'transparent' } : {}]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} resizeMode="cover" />
            ) : initial ? (
              <Text style={styles.avatarInitial}>{initial}</Text>
            ) : (
              <Ionicons name="person" size={24} color="#fff" />
            )}
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
              <Text style={[styles.name, { textAlign }]}>{displayName || t('profile')}</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>
                  {activePlan === 'FREE' ? t('free_plan') : (activePlan === 'PREMIUM' ? t('premium_plan') : t('family_plan'))}
                </Text>
              </View>
            </View>
            <Text style={[styles.sub, { textAlign }]}>{phone ?? 'guest@healthai.app'}</Text>
          </View>
          <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
        </Pressable>

        {/* 2 Quick Stat Tiles — Family & Health Score (Prototype v2 grid2) */}
        <View style={[styles.grid2, { flexDirection: rowDirection }]}>
          <Pressable
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/family')}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people" size={20} color="#2563EB" />
            </View>
            <Text style={styles.tileLabel}>Family ({familyCount})</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/(tabs)/reports')}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="shield-outline" size={20} color="#0F766E" />
            </View>
            <Text style={styles.tileLabel}>Health score {healthScore}</Text>
          </Pressable>
        </View>

        {/* Grouped Settings Menu Card (Prototype v2 container) */}
        <View style={styles.card}>
          {items.map((it, idx) => (
            <Pressable
              key={it.label}
              style={({ pressed }) => [
                styles.listItem,
                idx === items.length - 1 && styles.lastItem,
                { flexDirection: rowDirection },
                pressed && { backgroundColor: '#F8FAFC' },
              ]}
              onPress={() => router.push(it.href as any)}
            >
              <Ionicons name={it.icon as any} size={20} color={Colors.text} />
              <Text style={[styles.itemText, { textAlign }]}>{it.label}</Text>
              {it.badge && (
                <View style={styles.versionPill}>
                  <Text style={styles.versionPillText}>{it.badge}</Text>
                </View>
              )}
              <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
            </Pressable>
          ))}
        </View>

        {/* Account Actions Card (Log Out & Delete Account) */}
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={Colors.danger} style={{ width: 20 }} />
            ) : (
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            )}
            <Text style={[styles.itemText, { color: Colors.danger, textAlign }]}>
              {loggingOut ? t('logging_out') : t('log_out')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              styles.lastItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={handleDeleteAccount}
            disabled={loggingOut}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            <Text style={[styles.itemText, { color: Colors.danger, textAlign }]}>
              {t('delete_account')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {loggingOut && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('logging_out')}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  topbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  topSub: {
    fontSize: 12.5,
    color: '#6B756F',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  sub: {
    fontSize: 12,
    color: '#6B756F',
    marginTop: 2,
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
  grid2: {
    gap: 10,
    marginBottom: 14,
  },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  listItem: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
    gap: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2B2A',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '400',
    lineHeight: 20,
  },
  versionPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  versionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
