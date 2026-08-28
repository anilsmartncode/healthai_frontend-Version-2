import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { useCountry } from '@/context/CountryContext';
import { COUNTRIES, CountryConfig } from '@/constants/countries';
import type { LangCode } from '@/context/Translations';
import { useAuth } from '@/context/AuthContext';

interface LanguageItem {
  code: LangCode;
  name: string;
  native: string;
  flag: string;
  reviewed: boolean;
}

const ALL_LANGUAGES: LanguageItem[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', reviewed: true },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', reviewed: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', reviewed: true },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', reviewed: true },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', reviewed: true },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', reviewed: true },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', reviewed: true },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇨🇦', reviewed: true },
  { code: 'zh', name: 'Chinese', native: '中文 (简体)', flag: '🇸🇬', reviewed: true },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', flag: '🇸🇬', reviewed: true },
];

export default function LanguageScreen() {
  const { lang, setLang, t, isRTL, rowDirection, textAlign } = useLang();
  const { country, setCountryCode, isAutoDetected } = useCountry();
  const { token } = useAuth();

  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [saving, setSaving] = useState(false);

  // Country-based recommended languages
  const recommendedCodes = useMemo(() => {
    return new Set((country.supportedLanguages || []).map((l) => l.code));
  }, [country]);

  const recommendedList = useMemo(() => {
    return ALL_LANGUAGES.filter((l) => recommendedCodes.has(l.code));
  }, [recommendedCodes]);

  const otherList = useMemo(() => {
    return ALL_LANGUAGES.filter((l) => !recommendedCodes.has(l.code));
  }, [recommendedCodes]);

  // Filter countries for modal
  const filteredCountries = useMemo(() => {
    const q = searchCountry.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q)
    );
  }, [searchCountry]);

  const handleLanguageSelect = async (code: LangCode) => {
    await setLang(code);
  };

  const handleApply = async () => {
    setSaving(true);
    try {
      if (token) {
        Alert.alert('Saved', t('preferences_saved') || 'Language updated successfully.', [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)/profile');
            },
          },
        ]);
      } else {
        router.push('/(auth)/Phonesignup');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save language');
    } finally {
      setSaving(false);
    }
  };

  const renderLangRow = (item: LanguageItem, isLast: boolean) => {
    const isSelected = lang === item.code;
    return (
      <React.Fragment key={item.code}>
        <Pressable
          style={[
            styles.langRow,
            { flexDirection: rowDirection },
            isSelected && styles.langRowSelected,
          ]}
          onPress={() => handleLanguageSelect(item.code)}
          accessible={true}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected }}
        >
          <View style={styles.flagBox}>
            <Text style={styles.flagText}>{item.flag}</Text>
          </View>

          <View style={styles.langMeta}>
            <Text
              style={[
                styles.langPrimary,
                { textAlign },
                isSelected && styles.langPrimarySelected,
              ]}
            >
              {item.name}
            </Text>
            <Text style={[styles.langNative, { textAlign }]}>{item.native}</Text>
          </View>

          <View
            style={[
              styles.radioCircle,
              isSelected && styles.radioCircleActive,
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
        </Pressable>
        {!isLast && <View style={styles.rowDivider} />}
      </React.Fragment>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Topbar matching Prototype v2 (scr-languageregion) ── */}
      <View style={styles.topbar}>
        <View style={[styles.backrow, { flexDirection: rowDirection }]}>
          <Pressable
            style={styles.iconbtn}
            onPress={() => router.back()}
            hitSlop={10}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={Colors.text} />
          </Pressable>
          <Text style={[styles.title, { textAlign }]}>
            {t('language_pref') || 'Language'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Auto-detected Country / Region Banner (Formal & Clean) ── */}
        <Pressable
          style={[styles.countryBar, { flexDirection: rowDirection }]}
          onPress={() => setCountryPickerVisible(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Selected region: ${country.name}`}
        >
          <View style={[styles.countryBarLeft, { flexDirection: rowDirection }]}>
            <View style={styles.countryFlagTile}>
              <Text style={styles.countryFlag}>{country.flag}</Text>
            </View>
            <View style={styles.countryInfo}>
              <View style={[styles.countryNameRow, { flexDirection: rowDirection }]}>
                <Text style={[styles.countryName, { textAlign }]}>{country.name}</Text>
                {isAutoDetected && (
                  <View style={styles.autoDetectBadge}>
                    <Ionicons name="location-sharp" size={10} color="#0F766E" />
                    <Text style={styles.autoDetectText}>Auto-detected</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.countryDial, { textAlign }]}>
                {country.dial} • Tap to switch region
              </Text>
            </View>
          </View>

          <View style={[styles.changeBtn, { flexDirection: rowDirection }]}>
            <Text style={styles.changeBtnText}>Change</Text>
            <Ionicons name="chevron-forward" size={14} color="#0F766E" />
          </View>
        </Pressable>

        {/* ── Subtitle ── */}
        <Text style={[styles.subText, { textAlign }]}>
          HealthAI provides medically reviewed localization across clinical terms, dosages, and reports.
        </Text>

        {/* ── Section 1: Recommended for Current Country ── */}
        {recommendedList.length > 0 && (
          <View>
            <Text style={[styles.sectionLabel, { textAlign }]}>
              Recommended languages for {country.name}
            </Text>
            <View style={styles.cardList}>
              {recommendedList.map((item, idx) =>
                renderLangRow(item, idx === recommendedList.length - 1)
              )}
            </View>
          </View>
        )}

        {/* ── Section 2: Other Available Languages ── */}
        {otherList.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={[styles.sectionLabel, { textAlign }]}>
              All Other Languages
            </Text>
            <View style={styles.cardList}>
              {otherList.map((item, idx) =>
                renderLangRow(item, idx === otherList.length - 1)
              )}
            </View>
          </View>
        )}

        {/* ── Bottom Action Button ── */}
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            pressed && { opacity: 0.85 },
            saving && styles.btnDisabled,
          ]}
          onPress={handleApply}
          disabled={saving}
        >
          <Text style={styles.btnText}>
            {token ? t('save_changes') || 'Save changes' : t('continue') || 'Continue'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* ── Country Picker Modal ── */}
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
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Region</Text>
            <Pressable onPress={() => setCountryPickerVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={20} color="#6B756F" />
            </Pressable>
          </View>

          <View style={styles.modalSearchBox}>
            <Ionicons name="search-outline" size={16} color="#6B756F" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search country or code..."
              placeholderTextColor="#9CA3AF"
              value={searchCountry}
              onChangeText={setSearchCountry}
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = country.code === item.code;
              return (
                <Pressable
                  style={[
                    styles.countryItem,
                    isSelected && styles.countryItemSelected,
                  ]}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCountryPickerVisible(false);
                    setSearchCountry('');
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemDial}>{item.dial}</Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#0F766E" />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  topbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  backrow: {
    alignItems: 'center',
    gap: 12,
  },
  iconbtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E4E8E6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  // ── Auto-detected Country Bar (Formal & Clean) ──
  countryBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryBarLeft: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  countryFlagTile: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryFlag: {
    fontSize: 20,
  },
  countryInfo: {
    flex: 1,
    gap: 2,
  },
  countryNameRow: {
    alignItems: 'center',
    gap: 8,
  },
  countryName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  autoDetectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  autoDetectText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  countryDial: {
    fontSize: 12,
    color: '#6B756F',
  },
  changeBtn: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F0FDF9',
  },
  changeBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F766E',
  },

  subText: {
    fontSize: 12,
    color: '#6B756F',
    lineHeight: 17,
  },

  // ── Section Headers ──
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B756F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  // ── Unified Language Card List ──
  cardList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    overflow: 'hidden',
  },
  langRow: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    alignItems: 'center',
    gap: 12,
  },
  langRowSelected: {
    backgroundColor: '#F0FDF9',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 56,
  },
  flagBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 18,
  },
  langMeta: {
    flex: 1,
    gap: 2,
  },
  langPrimary: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  langPrimarySelected: {
    color: '#0F766E',
    fontWeight: '700',
  },
  langNative: {
    fontSize: 12,
    color: '#6B756F',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },

  // ── Bottom Action Button ──
  btn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 30,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1A2B2A',
    padding: 0,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
  },
  countryItemSelected: {
    backgroundColor: '#F0FDF9',
  },
  countryItemFlag: {
    fontSize: 18,
  },
  countryItemName: {
    flex: 1,
    fontSize: 14,
    color: '#1A2B2A',
    fontWeight: '500',
  },
  countryItemDial: {
    fontSize: 12.5,
    color: '#6B756F',
    fontWeight: '500',
  },
});
