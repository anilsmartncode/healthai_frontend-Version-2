import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content:
      'By downloading, installing, or using the HealthcareAI application ("App"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the App. These terms constitute a legally binding agreement between you and SmartNCode Technologies.',
  },
  {
    title: "2. About HealthcareAI",
    content:
      "HealthcareAI is an AI-powered healthcare platform developed and maintained by SmartNCode Technologies. The App provides health information, appointment management, symptom analysis, and wellness guidance. The App is intended for informational purposes only and does not replace professional medical advice, diagnosis, or treatment.",
  },
  {
    title: "3. Medical Disclaimer",
    content:
      "The information provided by HealthcareAI is for general informational and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something you read on the App.",
  },
  {
    title: "4. User Eligibility",
    content:
      "You must be at least 18 years of age to use this App. By using the App, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. Users under 18 may use the App only with the involvement and consent of a parent or legal guardian.",
  },
  {
    title: "5. User Account & Registration",
    content:
      "To access certain features of the App, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.",
  },
  {
    title: "6. Privacy & Data Collection",
    content:
      "SmartNCode Technologies takes your privacy seriously. We collect personal and health-related data including name, date of birth, contact information, and health records solely to provide and improve our services. Your data is encrypted and stored securely. We do not sell your personal health data to third parties. Our full Privacy Policy is incorporated into these Terms by reference.",
  },
  {
    title: "7. Health Data Usage",
    content:
      "By using HealthcareAI, you consent to the collection, processing, and storage of your health information for the purpose of providing personalized healthcare services. This data may be used to generate health insights, recommend services, and improve AI models. All health data is handled in compliance with applicable data protection laws including DPDP Act (India) and HIPAA guidelines.",
  },
  {
    title: "8. AI-Powered Features",
    content:
      "The App uses artificial intelligence to provide health insights and recommendations. While our AI models are designed to be accurate and helpful, they are not infallible. AI-generated content should be treated as a starting point for discussion with healthcare professionals, not as definitive medical advice. SmartNCode Technologies is not liable for decisions made solely based on AI recommendations.",
  },
  {
    title: "9. Prohibited Activities",
    content:
      "You agree not to: (a) use the App for any unlawful purpose; (b) impersonate any person or entity; (c) submit false or misleading health information; (d) attempt to gain unauthorized access to the App's systems; (e) reverse-engineer or decompile any part of the App; (f) use the App to harass, abuse, or harm others; or (g) violate any applicable local, national, or international law.",
  },
  {
    title: "10. Intellectual Property",
    content:
      "All content, features, and functionality of the App — including but not limited to text, graphics, logos, icons, and software — are the exclusive property of SmartNCode Technologies and are protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without express written permission from SmartNCode Technologies.",
  },
  {
    title: "11. Payments, Subscriptions, and Refunds",
    content:
      "Certain features of the App may require a paid subscription or one-time purchase. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current billing period. Payments are charged to your Apple ID or Google Play account at confirmation of purchase. You may manage or cancel your subscriptions in your device account settings. All purchases are final, and SmartNCode Technologies does not provide refunds for unused portions of a subscription term, except as required by applicable law or the respective app store policies.",
  },
  {
    title: "12. Limitation of Liability",
    content:
      "To the maximum extent permitted by law, SmartNCode Technologies shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the App. Our total liability to you for any claims arising out of or related to these Terms or the App shall not exceed the amount you paid to us in the twelve months preceding the claim.",
  },
  {
    title: "13. Termination",
    content:
      "SmartNCode Technologies reserves the right to suspend or terminate your account and access to the App at any time, with or without cause or notice, including for violation of these Terms. Upon termination, your right to use the App will immediately cease. Provisions of these Terms that by their nature should survive termination shall remain in effect.",
  },
  {
    title: "14. Changes to Terms",
    content:
      "We may update these Terms and Conditions from time to time. We will notify you of significant changes via the App or by email. Your continued use of the App after any changes constitutes your acceptance of the new Terms. We encourage you to review these Terms periodically.",
  },
  {
    title: "15. Governing Law",
    content:
      "These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Hyderabad, Telangana, India.",
  },
  {
    title: "16. Contact Us",
    content: (
      <Text style={{ fontSize: 12, color: Colors.textMuted, lineHeight: 19, fontWeight: "400" }}>
        If you have any questions about these Terms and Conditions, please contact us at:{"\n\n"}
        SmartNCode Technologies{"\n"}
        Email:{" "}
        <Text
          style={{ color: Colors.primary, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL("mailto:support@healthai.com")}
        >
          support@healthai.com
        </Text>
        {"\n"}
        Website:{" "}
        <Text
          style={{ color: Colors.primary, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL("https://www.smartncode.com")}
        >
          www.smartncode.com
        </Text>
        {"\n"}
        Address: Hyderabad, Telangana, India
      </Text>
    ),
  },
];

export default function TermsAndConditions() {
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
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <Text style={styles.headerSub}>
            HealthcareAI by SmartNCode Technologies
          </Text>
        </View>
        <View style={styles.shieldIcon}>
          <Ionicons name="shield-checkmark" size={22} color="#2D9C8E" />
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
            Please read these Terms and Conditions carefully before using
            HealthcareAI. By creating an account or continuing to use the App,
            you agree to all terms listed below.
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
          <Text style={styles.footerTitle}>SmartNCode Technologies</Text>
          <Text style={styles.footerSub}>
            Powering HealthcareAI with trust, security, and innovation.
          </Text>
          <Text style={styles.footerCopy}>
            © 2026 SmartNCode Technologies. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Accept button */}
      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>I Understand & Accept</Text>
        </Pressable>
      </View>
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

  bottom: {
    padding: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
