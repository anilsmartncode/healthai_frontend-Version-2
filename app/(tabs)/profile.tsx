import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/Languagecontext';

export default function Profile() {
  const { phone, signOut } = useAuth();
  const { t } = useLang();

  const items = [
    { icon: 'person-outline', label: t('account_info'), href: '/account' },
    { icon: 'notifications-outline', label: t('notifications'), href: '/notifications' },
    { icon: 'language-outline', label: t('language_pref'), href: '/(auth)/language' },
    { icon: 'people-outline', label: t('family_health'), href: '/family' },
    { icon: 'shield-checkmark-outline', label: t('legal_privacy'), href: '/account' },
    { icon: 'help-circle-outline', label: t('help_support'), href: '/account' },
    { icon: 'star-outline', label: t('rate_app'), href: '/account' },
  ] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={styles.title}>{t('profile_settings')}</Text>
        <View style={styles.profile}>
          <View style={styles.avatar}><Ionicons name="person" size={28} color="#fff" /></View>
          <View>
            <Text style={styles.name}>{t('profile')}</Text>
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
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sub: { color: Colors.textMuted },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.text },
});
