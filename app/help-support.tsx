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

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface ContactOption {
  icon: IoniconName;
  label: string;
  sub: string;
  action: () => void;
}

const FAQS = [
  {
    q: 'How do I upload a health report?',
    a: 'Tap the Reports tab → Upload Report → pick a PDF or image from your gallery or camera.',
  },
  {
    q: 'Can I add my family members?',
    a: 'Yes. Go to Profile → Family Health → Invite member. They will receive an OTP-based invite link.',
  },
  {
    q: 'Is my health data secure?',
    a: 'All data is AES-256 encrypted at rest and in transit. We never share your data with third parties.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile → tap "Delete Account" → tap "Delete Permanently" to confirm.',
  },
];

export default function HelpSupport() {
  const contactOptions: ContactOption[] = [
    {
      icon: 'mail-outline',
      label: 'Email us',
      sub: 'support@smartncode.com',
      action: () => Linking.openURL('mailto:support@smartncode.com'),
    },
    {
      icon: 'call-outline',
      label: 'Call helpline',
      sub: 'Mon – Sat, 9 AM – 6 PM',
      action: () => Linking.openURL('tel:+917337284666'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Help &amp; Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Contact options */}
        <Text style={styles.sectionLabel}>Contact us</Text>
        <View style={styles.group}>
          {contactOptions.map((c, i) => (
            <Pressable
              key={c.label}
              style={[styles.menuRow, i < contactOptions.length - 1 && styles.rowBorder]}
              onPress={c.action}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={c.icon} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{c.label}</Text>
                <Text style={styles.rowSub}>{c.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* FAQs */}
        <Text style={styles.sectionLabel}>Frequently asked questions</Text>
        {FAQS.map((faq) => (
          <View key={faq.q} style={styles.faqCard}>
            <View style={styles.faqQ}>
              <Ionicons name="help-circle" size={18} color={Colors.primary} style={{ marginTop: 1 }} />
              <Text style={styles.faqQText}>{faq.q}</Text>
            </View>
            <Text style={styles.faqA}>{faq.a}</Text>
          </View>
        ))}

        {/* App version */}
        <View style={styles.versionBadge}>
          <Text style={styles.versionTitle}>App version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text style={styles.versionSub}>You're on the latest version</Text>
        </View>
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  group: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '500', color: Colors.text },
  rowSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  faqCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  faqQ: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  faqQText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  faqA: { fontSize: 13, color: Colors.textMuted, lineHeight: 20, paddingLeft: 26 },
  versionBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  versionTitle: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  versionSub: { fontSize: 12, color: Colors.textMuted },
});
