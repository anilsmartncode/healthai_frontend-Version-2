import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import type { LangCode } from "@/context/Translations";

const LANGUAGES: {
  code: LangCode;
  name: string;
  native: string;
  flag: string;
}[] = [
  { code: "en", name: "English", native: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
];

export default function LanguagePicker() {
  const { lang, setLang, t } = useLang();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.replace("/(auth)/onboarding")}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>{t("choose_lang")}</Text>
      </View>
      <Text style={styles.sub}>{t("choose_lang_sub")}</Text>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {LANGUAGES.map((l) => (
          <Pressable
            key={l.code}
            style={[styles.item, lang === l.code && styles.itemSelected]}
            onPress={() => setLang(l.code)}
          >
            <Text style={styles.flag}>{l.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.langName}>{l.name}</Text>
              <Text style={styles.langNative}>{l.native}</Text>
            </View>
            {lang === l.code && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.push("/(auth)/Phonesignup")}
        >
          <Text style={styles.btnText}>{t("continue")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "900", color: Colors.text },
  sub: {
    fontSize: 14,
    color: Colors.textMuted,
    paddingHorizontal: 20,
    marginBottom: 8,
    fontWeight: "600",
  },
  list: { padding: 20, gap: 10 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
  },
  itemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "12",
  },
  flag: { fontSize: 28, width: 40, textAlign: "center" },
  langName: { fontSize: 16, fontWeight: "800", color: Colors.text },
  langNative: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
    marginTop: 1,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  bottom: { padding: 20, paddingBottom: 40 },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
