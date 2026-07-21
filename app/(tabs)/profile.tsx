import { View, Text, StyleSheet, Pressable } from 'react-native';
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
import { ENDPOINTS } from '@/constants/api';

export default function Profile() {
  const { phone, signOut } = useAuth();
  const { t } = useLang();
  const { activePlan } = useUsage();
  const [displayName, setDisplayName] = useState('');

  // Refresh the display name from the real backend every time this tab is
  // focused — falls back to the local cache (written by account.tsx) if the
  // fetch fails, e.g. offline, so the name doesn't disappear on a network blip.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const cacheKey = `healthai_profile_name_${phone ?? 'guest'}`;

      (async () => {
        // Show cached name immediately so there's no blank flash while the
        // network call is in flight.
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached && !cancelled) setDisplayName(cached);
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
        } catch (e) {
          // Network error / session expired — keep showing whatever the
          // cache already gave us above rather than clearing the name.
          console.warn('[Profile] Failed to refresh profile name', e);
        }
      })();

      return () => { cancelled = true; };
    }, [phone])
  );

  const items = [
    { icon: 'person-outline',           label: t('account_info'),  href: '/account'         },
    { icon: 'star',                     label: 'Subscription & Plans', href: '/plans'       },
    { icon: 'people-outline',           label: t('family_health'), href: '/family'          },
    { icon: 'notifications-outline',    label: t('notifications'), href: '/notifications'   },
    { icon: 'shield-checkmark-outline', label: t('legal_privacy'), href: '/legal-privacy'   },
    { icon: 'help-circle-outline',      label: t('help_support'),  href: '/help-support'    },
    { icon: 'star-outline',             label: t('rate_app'),      href: '/rate-app'        },
  ] as const;

  const initial = displayName.trim() ? displayName.trim()[0].toUpperCase() : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={styles.title}>{t('profile_settings')}</Text>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            {initial
              ? <Text style={styles.avatarInitial}>{initial}</Text>
              : <Ionicons name="person" size={28} color="#fff" />
            }
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
          <Pressable key={it.label} style={styles.row} onPress={() => router.push(it.href as any)}>
            <Ionicons name={it.icon as any} size={22} color={Colors.text} />
            <Text style={styles.rowLabel}>{it.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        ))}
        <Pressable
          style={styles.row}
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/onboarding');
          }}
        >
          <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
          <Text style={[styles.rowLabel, { color: Colors.danger }]}>{t('log_out')}</Text>
          <View />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title:        { fontSize: 22, fontWeight: '700', color: Colors.text },
  profile:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  avatar:       { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial:{ fontSize: 22, fontWeight: '700', color: '#fff' },
  name:         { fontSize: 16, fontWeight: '700', color: Colors.text },
  sub:          { color: Colors.textMuted },
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
  }
});