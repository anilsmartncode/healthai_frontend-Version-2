import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import { useCountry } from "@/context/CountryContext";
import { COUNTRIES, CountryConfig } from "@/constants/countries";
import type { LangCode } from "@/context/Translations";

interface LanguageItem {
  code: LangCode;
  name: string;
  native: string;
  flag: string;
}

const ALL_LANGUAGES: LanguageItem[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "French", native: "Français", flag: "🇨🇦" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "zh", name: "Chinese", native: "中文 (简体)", flag: "🇸🇬" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇸🇬" },
];

export default function LanguagePicker() {
  const { lang, setLang, t, isRTL, rowDirection, textAlign } = useLang();
  const { country, setCountryCode, isAutoDetected } = useCountry();
  const { height: SH } = useWindowDimensions();

  const [showOtherLangs, setShowOtherLangs] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");

  // Country-based recommended languages
  const recommendedCodes = new Set(
    (country.supportedLanguages || []).map((l) => l.code)
  );

  const recommendedList = ALL_LANGUAGES.filter((l) =>
    recommendedCodes.has(l.code)
  );

  // Other languages not recommended for this country
  const otherList = ALL_LANGUAGES.filter((l) => !recommendedCodes.has(l.code));

  // Filter countries for modal
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
      c.dial.includes(searchCountry)
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Header ── */}
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={20}
            color={Colors.text}
          />
        </Pressable>
        <Text style={[styles.title, { textAlign }]}>{t("choose_lang")}</Text>
      </View>

      {/* ── Country / Region Indicator (Tappable to change region) ── */}
      <Pressable
        style={[styles.countryBar, { flexDirection: rowDirection }]}
        onPress={() => setCountryPickerVisible(true)}
      >
        <View style={[styles.countryBarLeft, { flexDirection: rowDirection }]}>
          <Text style={styles.countryFlag}>{country.flag}</Text>
          <View>
            <Text style={[styles.countryLabel, { textAlign }]}>
              {country.name}{" "}
              <Text style={styles.countrySub}>
                {isAutoDetected ? "(Auto-detected)" : ""}
              </Text>
            </Text>
            <Text style={[styles.countryHint, { textAlign }]}>Tap to change country</Text>
          </View>
        </View>
        <View style={[styles.changeBadge, { flexDirection: rowDirection }]}>
          <Text style={styles.changeBadgeText}>Change</Text>
          <Ionicons name="chevron-down" size={14} color="#2D9C8E" />
        </View>
      </Pressable>

      <Text style={[styles.sub, { textAlign }]}>{t("choose_lang_sub")}</Text>

      {/* ── Main Scroll List ── */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Recommended for this Country */}
        <View style={[styles.sectionHeader, { flexDirection: rowDirection }]}>
          <Ionicons name="sparkles" size={15} color="#2D9C8E" />
          <Text style={[styles.sectionTitle, { textAlign }]}>
            Recommended for {country.name}
          </Text>
        </View>

        {recommendedList.map((l) => (
          <Pressable
            key={l.code}
            style={[
              styles.item,
              { flexDirection: rowDirection },
              lang === l.code && styles.itemSelected,
            ]}
            onPress={() => setLang(l.code)}
          >
            <Text style={styles.flag}>{l.flag}</Text>
            <View style={{ flex: 1 }}>
              <View style={[styles.nameRow, { flexDirection: rowDirection }]}>
                <Text style={[styles.langName, { textAlign }]}>{l.name}</Text>
                <View style={styles.recommendedTag}>
                  <Text style={styles.recommendedTagText}>Recommended</Text>
                </View>
              </View>
              <Text style={[styles.langNative, { textAlign }]}>{l.native}</Text>
            </View>
            <View
              style={[styles.checkCircle, lang === l.code && styles.checkActive]}
            >
              {lang === l.code && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
          </Pressable>
        ))}

        {/* Section: Other Available Languages */}
        {otherList.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Pressable
              style={[styles.expandToggle, { flexDirection: rowDirection }]}
              onPress={() => setShowOtherLangs((prev) => !prev)}
            >
              <Text style={styles.expandToggleText}>
                {showOtherLangs
                  ? "Hide other languages"
                  : `Show other languages (${otherList.length})`}
              </Text>
              <Ionicons
                name={showOtherLangs ? "chevron-up" : "chevron-down"}
                size={16}
                color="#64748B"
              />
            </Pressable>

            {showOtherLangs &&
              otherList.map((l) => (
                <Pressable
                  key={l.code}
                  style={[
                    styles.item,
                    styles.itemSecondary,
                    { flexDirection: rowDirection },
                    lang === l.code && styles.itemSelected,
                  ]}
                  onPress={() => setLang(l.code)}
                >
                  <Text style={styles.flag}>{l.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.langName, { textAlign }]}>{l.name}</Text>
                    <Text style={[styles.langNative, { textAlign }]}>{l.native}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkCircle,
                      lang === l.code && styles.checkActive,
                    ]}
                  >
                    {lang === l.code && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                </Pressable>
              ))}
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Continue Button ── */}
      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            { flexDirection: rowDirection },
            pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
          ]}
          onPress={() => router.push("/(auth)/Phonesignup")}
        >
          <Text style={styles.btnText}>{t("continue")}</Text>
          <Ionicons
            name={isRTL ? "arrow-back" : "arrow-forward"}
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>

      {/* ── Quick Country Picker Modal ── */}
      <Modal
        visible={countryPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCountryPickerVisible(false)}
        />
        <View style={[styles.modalSheet, { maxHeight: SH * 0.72 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Change Country / Region</Text>

          {/* Search Box */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={17} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search country..."
              placeholderTextColor="#94A3B8"
              value={searchCountry}
              onChangeText={setSearchCountry}
              autoCorrect={false}
            />
            {!!searchCountry && (
              <Pressable onPress={() => setSearchCountry("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* List of Countries */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryRow,
                  item.code === country.code && styles.countryRowActive,
                ]}
                onPress={() => {
                  setCountryCode(item.code);
                  setCountryPickerVisible(false);
                  setSearchCountry("");
                }}
              >
                <Text style={styles.countryRowFlag}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.countryRowName}>{item.name}</Text>
                  {item.isLaunchCountry && (
                    <Text style={styles.launchMarketBadge}>Launch Market</Text>
                  )}
                </View>
                {item.code === country.code && (
                  <Ionicons name="checkmark-circle" size={18} color="#2D9C8E" />
                )}
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </Modal>
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
    paddingTop: 14,
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

  // Country Bar Indicator
  countryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#DCFCE7",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  countryBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countryFlag: { fontSize: 24 },
  countryLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#166534",
  },
  countrySub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#22C55E",
  },
  countryHint: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2D9C8E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  changeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D9C8E",
  },

  sub: {
    fontSize: 14,
    color: Colors.textMuted,
    paddingHorizontal: 18,
    marginBottom: 10,
    fontWeight: "600",
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F766E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Language Cards
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 15,
  },
  itemSecondary: {
    opacity: 0.95,
    marginBottom: 8,
  },
  itemSelected: {
    borderColor: "#2D9C8E",
    backgroundColor: "rgba(45,156,142,0.08)",
  },
  flag: { fontSize: 28, width: 38, textAlign: "center" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langName: { fontSize: 16, fontWeight: "800", color: Colors.text },
  recommendedTag: {
    backgroundColor: "rgba(45,156,142,0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0F766E",
  },
  langNative: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  checkActive: {
    backgroundColor: "#2D9C8E",
    borderColor: "#2D9C8E",
  },

  // Expand Toggle
  expandToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  expandToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },

  // Bottom action
  bottom: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 10 },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "800" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E2ECEC",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  countryRowActive: {
    backgroundColor: "rgba(45,156,142,0.08)",
    borderRadius: 12,
  },
  countryRowFlag: { fontSize: 24 },
  countryRowName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  launchMarketBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2D9C8E",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
});
