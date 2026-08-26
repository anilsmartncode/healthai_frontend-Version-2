import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
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
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';

const STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/healthai/id6794323149'
    : 'https://play.google.com/store/apps/details?id=com.smartncode.healthai';


export default function Profile() {
  const { phone, signOut } = useAuth();
  const { t } = useLang();
  const { activePlan } = useUsage();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Refresh the display name from the real backend every time this tab is
  // focused — falls back to the local cache (written by account.tsx) if the
  // fetch fails, e.g. offline, so the name doesn't disappear on a network blip.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const cacheKey = `healthai_profile_name_${phone ?? 'guest'}`;
      const avatarCacheKey = `healthai_profile_avatar_${phone ?? 'guest'}`;

      (async () => {
        // Show cached name immediately so there's no blank flash while the
        // network call is in flight.
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
          const displayName = (data?.full_name ?? data?.name ?? '').trim();
          if (displayName) {
            setDisplayName(displayName);
            try { await AsyncStorage.setItem(cacheKey, displayName); } catch { /* ignore */ }
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
          // Network error / session expired — keep showing whatever the
          // cache already gave us above rather than clearing the name.
          console.warn('[Profile] Failed to refresh profile name', e);
        }
      })();

      return () => { cancelled = true; };
    }, [phone])
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all associated health data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call the delete account API endpoint
              await medicineApiCall(ENDPOINTS.deleteAccount, { method: 'DELETE' });

              Alert.alert('Account Deleted', 'Your account and data have been permanently deleted.', [
                {
                  text: 'OK', onPress: () => {
                    signOut().then(() => router.replace('/(auth)/onboarding'));
                  }
                }
              ]);
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete account. Please contact support.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('log_out') || 'Log Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('log_out') || 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await signOut();
              router.replace('/(auth)/onboarding');
            } catch (error) {
              console.error('[Profile] Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const items = [
    { icon: 'person-outline', label: t('account_info'), href: '/account' },
    { icon: 'star', label: 'Subscription & Plans', href: '/plans' },
    { icon: 'people-outline', label: t('family_health'), href: '/family' },
    { icon: 'notifications-outline', label: t('notifications'), href: '/notifications' },
    { icon: 'shield-checkmark-outline', label: t('legal_privacy'), href: '/legal-privacy' },
    { icon: 'help-circle-outline', label: t('help_support'), href: '/help-support' },
    { icon: 'star-outline', label: t('rate_app'), action: async () => {
      try {
        if (await StoreReview.isAvailableAsync()) {
          await StoreReview.requestReview();
        } else {
          await Linking.openURL(STORE_URL);
        }
      } catch (error) {
        try {
          await Linking.openURL(STORE_URL);
        } catch {
          Alert.alert("Error", "Could not open the App Store.");
        }
      }
    } },
  ];

  const initial = displayName.trim() ? displayName.trim()[0].toUpperCase() : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ padding: 16 }}>
          <Text style={styles.title}>{t('profile_settings')}</Text>
          <View style={styles.profile}>
            <View style={[styles.avatar, avatarUrl ? { backgroundColor: 'transparent' } : {}]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E7EB' }} resizeMode="cover" />
              ) : initial ? (
                <Text style={styles.avatarInitial}>{initial}</Text>
              ) : (
                <Ionicons name="person" size={28} color="#fff" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.name}>{displayName || t('profile')}</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{activePlan}</Text>
                </View>
              </View>
              <Text style={styles.sub}>{phone ?? 'guest@healthai.app'}</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 4 }}>
          {items.map((it) => (
            <Pressable key={it.label} style={styles.row} onPress={() => {
              if (it.action) {
                it.action();
              } else if (it.href) {
                router.push(it.href as any);
              }
            }}>
              <Ionicons name={it.icon as any} size={22} color={Colors.text} />
              <Text style={styles.rowLabel}>{it.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          ))}
          <Pressable
            style={styles.row}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={Colors.danger} style={{ width: 22 }} />
            ) : (
              <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
            )}
            <Text style={[styles.rowLabel, { color: Colors.danger }]}>
              {loggingOut ? 'Logging out...' : t('log_out')}
            </Text>
            <View />
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={handleDeleteAccount}
            disabled={loggingOut}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
            <Text style={[styles.rowLabel, { color: Colors.danger }]}>Delete Account</Text>
            <View />
          </Pressable>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {loggingOut && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Logging out...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 22, fontWeight: '700', color: '#fff' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sub: { color: Colors.textMuted },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.text },
  planBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  planBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
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