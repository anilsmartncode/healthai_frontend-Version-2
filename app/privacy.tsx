import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: "We collect personal and health-related data including name, date of birth, contact information, and health records solely to provide and improve our services. Your data is encrypted and stored securely.",
  },
  {
    title: "2. How We Use Your Data",
    content: "Your data is used solely to generate AI-powered health insights, manage appointments, and to share with family members you explicitly invite. We never sell or share your data with advertisers or data brokers.",
  },
  {
    title: "3. AI-Powered Analysis",
    content: "When you use our AI features (report analysis, health chat, medicine insights), the following data may be sent to our AI processing service: uploaded medical reports, extracted lab values, chat messages, medication information, and basic profile details (age, gender, health conditions). This data is processed by HealthAI / SMARTnCODE Technologies and securely transmitted to our trusted third-party multimodal AI providers (which may include Google Cloud, OpenAI, or Anthropic) for analysis. Your explicit consent is required before any data is sent for AI processing, and you can revoke this consent at any time from the app's Privacy & Legal settings.",
  },
  {
    title: "4. Data Security",
    content: "All data is AES-256 encrypted at rest and in transit. We implement strict technical and organizational measures to ensure your health information is kept confidential and secure at all times.",
  },
  {
    title: "5. Third-Party Services",
    content: "We use trusted third-party services for authentication (Firebase), secure data hosting, and AI-powered health analysis (Google Cloud Gemini). These services are bound by strict data processing agreements to protect your privacy. Google Cloud is strictly prohibited from using your personal health data to train their general AI models, for advertising, or for any purpose other than providing the requested analysis.",
  },
  {
    title: "6. Data Retention & Deletion",
    content: "You can request the deletion of your account and all associated health data at any time from within the app. Upon request, your data will be permanently deleted from our active servers within 30 days.",
  },
  {
    title: "7. Your Rights",
    content: "You have the right to access, correct, or delete your personal data. You also have the right to revoke consent for AI data processing at any time. If you have any questions or wish to exercise these rights, please contact our support team.",
  },
  {
    title: "8. Contact Us",
    content: (
      <Text style={{ fontSize: 12, color: Colors.textMuted, lineHeight: 19, fontWeight: "400" }}>
        If you have any questions about this Privacy Policy, please contact us at:{"\n\n"}
        SMARTnCODE Technologies{"\n"}
        Email:{" "}
        <Text
          style={{ color: Colors.primary, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL("mailto:support@smartncode.com")}
        >
          support@smartncode.com
        </Text>
        {"\n"}
        Website:{" "}
        <Text
          style={{ color: Colors.primary, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL("https://www.smartncode.com")}
        >
          www.smartncode.com
        </Text>
      </Text>
    ),
  },
];


export default function PrivacyPolicy() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => {
          if (Platform.OS === 'web') {
            window.location.href = '/';
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/");
          }
        }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSub}>
            HealthcareAI by SMARTnCODE Technologies
          </Text>
        </View>
        <View style={styles.shieldIcon}>
          <Ionicons name="lock-closed" size={22} color="#2D9C8E" />
        </View>
      </View>

      {/* Last updated badge */}
      <View style={styles.updatedRow}>
        <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.updatedText}>
          Last updated: August 2026 · Version 1.0
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={styles.introCard}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#2D9C8E"
          />
          <Text style={styles.introText}>
            SMARTnCODE Technologies respects your privacy. This Privacy Policy explains how we collect, use, and protect your personal and health information.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {typeof section.content === 'string' ? (
              <Text style={styles.sectionContent}>{section.content}</Text>
            ) : (
              section.content
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={28} color="#2D9C8E" />
          <Text style={styles.footerTitle}>SMARTnCODE Technologies</Text>
          <Text style={styles.footerSub}>
            Powering HealthcareAI with trust, security, and innovation.
          </Text>
          <Text style={styles.footerCopy}>
            © 2026 SMARTnCODE Technologies. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0F172A",
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "500",
    marginTop: 1,
  },
  shieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(45,156,142,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  updatedText: { fontSize: 11, color: Colors.textMuted, fontWeight: "500" },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#2D9C8E18",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2D9C8E30",
  },
  introText: {
    flex: 1,
    fontSize: 12,
    color: "#2D9C8E",
    fontWeight: "500",
    lineHeight: 18,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  sectionContent: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 19,
    fontWeight: "400",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 4,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 6,
  },
  footerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
  footerCopy: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
});
