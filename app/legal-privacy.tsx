import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import Constants from 'expo-constants';

const SECTIONS = [
  {
    heading: 'Data we collect',
    body: 'We collect health reports, vitals, and medicine data that you upload. This data is stored encrypted and is only accessible to you and the family members you authorise.',
  },
  {
    heading: 'How we use your data',
    body: 'Your data is used solely to generate AI-powered health insights and to share with family members you explicitly invite. We never sell or share your data with advertisers.',
  },
  {
    heading: 'Data retention',
    body: 'You can delete your account and all associated data at any time from this screen. Deletion is permanent and takes effect within 30 days.',
  },
];

const LINKS = [
  { label: 'Privacy Policy',        url: 'https://healthai.smartncode.com/privacy'  },
  { label: 'Terms of Service',      url: 'https://healthai.smartncode.com/terms'    },
  { label: 'Cookie Policy',         url: 'https://healthai.smartncode.com/cookies'  },
  { label: 'Data deletion request', url: 'https://healthai.smartncode.com/delete'   },
];

export default function LegalPrivacy() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Legal &amp; Privacy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Encryption badge */}
        <View style={styles.encBadge}>
          <Ionicons name="lock-closed" size={18} color={Colors.primary} />
          <Text style={styles.encText}>
            All data is AES-256 encrypted at rest and in transit.
          </Text>
        </View>

        {/* Info sections */}
        {SECTIONS.map((s) => (
          <View key={s.heading} style={styles.card}>
            <Text style={styles.cardHeading}>{s.heading}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}

        {/* Links */}
        <View style={styles.linkGroup}>
          {LINKS.map((l, i) => (
            <Pressable
              key={l.label}
              style={[styles.linkRow, i < LINKS.length - 1 && styles.linkBorder]}
              onPress={() => Linking.openURL(l.url)}
            >
              <Text style={styles.linkLabel}>{l.label}</Text>
              <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.version}>HealthAI · v{Constants.expoConfig?.version ?? '1.0.0'} · © 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text, flex: 1 },
  body: { padding: Spacing.lg, gap: Spacing.md },
  encBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  encText: { flex: 1, fontSize: 13, color: Colors.primary, fontWeight: '500' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  cardHeading: { fontSize: 14, fontWeight: '600', color: Colors.text },
  cardBody: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  linkGroup: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  linkBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  linkLabel: { fontSize: 14, color: Colors.text },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
