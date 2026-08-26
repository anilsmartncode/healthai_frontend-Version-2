import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";

const DELETION_STEPS = [
  "Open the HealthAI app on your phone.",
  "Tap the Profile tab at the bottom right.",
  "Tap the \"Delete Account\" button.",
  "A confirmation popup will appear. Tap \"Delete Permanently\".",
  "Your account will be deleted and you will be signed out automatically.",
];

const DATA_SECTIONS = [
  {
    title: "What data is deleted?",
    content:
      "When you delete your account, we permanently remove all data associated with your account, including your personal information (name, email, phone number), health records, uploaded medical reports, medicine scan history, AI chat history, family member data, and any subscription records.",
  },
  {
    title: "How long does it take?",
    content:
      "Your account is deactivated immediately upon deletion. All associated data is permanently removed from our active servers within 30 days. Backup copies are purged within 90 days in accordance with our data retention policy.",
  },
  {
    title: "Can I recover my account?",
    content:
      "No. Once your account is deleted, the action is irreversible. All your health data, reports, and chat history will be permanently lost and cannot be recovered. Please make sure to download any important records before proceeding with deletion.",
  },
  {
    title: "What about my subscription?",
    content:
      "Deleting your account does not automatically cancel your App Store or Google Play subscription. Please cancel your subscription through your device's subscription settings before deleting your account to avoid future charges.",
  },
];

export default function AccountAndData() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>Account & Data Deletion</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Section 1: How to Delete Your Account */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-remove-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>How to Delete Your Account</Text>
          </View>
          <Text style={styles.sectionIntro}>
            You can delete your account at any time directly from the HealthAI app. Follow these steps:
          </Text>
          {DELETION_STEPS.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          <Text style={styles.altText}>
            Alternatively, you can request account deletion by emailing us at{" "}
            <Text
              style={{ color: Colors.primary, textDecorationLine: "underline" }}
              onPress={() => Linking.openURL("mailto:support@smartncode.com")}
            >
              support@smartncode.com
            </Text>{" "}
            with the subject line "Delete My Account" and your registered phone number.
          </Text>
        </View>

        {/* Section 2: How Your Data is Deleted */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trash-outline" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>How Your Data is Deleted</Text>
          </View>
          {DATA_SECTIONS.map((section, index) => (
            <View key={index} style={styles.dataBlock}>
              <Text style={styles.dataTitle}>{section.title}</Text>
              <Text style={styles.dataContent}>{section.content}</Text>
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            If you have questions about your account or data, please contact us:
          </Text>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={16} color={Colors.primary} />
            <Text
              style={styles.contactLink}
              onPress={() => Linking.openURL("mailto:support@smartncode.com")}
            >
              support@smartncode.com
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="globe-outline" size={16} color={Colors.primary} />
            <Text
              style={styles.contactLink}
              onPress={() => Linking.openURL("https://www.smartncode.com")}
            >
              www.smartncode.com
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © {new Date().getFullYear()} SMARTnCODE Technologies. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  scroll: { padding: 16, paddingBottom: 40, gap: 20 },

  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  sectionIntro: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },

  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  stepText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },

  altText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 19,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },

  dataBlock: { gap: 4 },
  dataTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  dataContent: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },

  contactCard: {
    backgroundColor: Colors.primary + "08",
    borderRadius: Radius.lg,
    padding: 20,
    gap: 10,
  },
  contactTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  contactText: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactLink: {
    fontSize: 13,
    color: Colors.primary,
    textDecorationLine: "underline",
    fontWeight: "500",
  },

  footer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
});
