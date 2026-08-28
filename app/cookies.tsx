import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";

const SECTIONS = [
  {
    title: "1. What are cookies?",
    content: "Cookies are small text files that are stored on your device when you visit our website or use our app. They help us remember your preferences, keep you logged in, and understand how you interact with our services.",
  },
  {
    title: "2. How we use cookies",
    content: "We use strictly necessary cookies to ensure the app functions properly (like authentication tokens). We may also use analytical cookies to understand app usage and improve performance. We do not use advertising cookies.",
  },
  {
    title: "3. Managing cookies",
    content: "You can instruct your browser or device to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept essential cookies, you may not be able to use some portions of our App.",
  },
];

export default function CookiePolicy() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Cookie Policy</Text>
          <Text style={styles.headerSub}>
            HealthcareAI by SMARTnCODE Technologies
          </Text>
        </View>
        <View style={styles.shieldIcon}>
          <Ionicons name="document-text" size={22} color="#2D9C8E" />
        </View>
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
            This Cookie Policy explains how SMARTnCODE Technologies uses cookies and similar technologies to recognize you when you visit HealthcareAI.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
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
  scroll: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16 },
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
});
