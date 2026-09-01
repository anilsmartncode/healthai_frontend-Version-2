import React, { useState, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
  Platform,
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
import { ALL_LANGUAGES, type LanguageItem } from '@/constants/allLanguages';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

export default function LanguageScreen() {
  const { lang, setLang, t, isRTL, rowDirection, textAlign, isTranslatingLang } = useLang();
  const { country, setCountryCode, isAutoDetected } = useCountry();
  const { token } = useAuth();

  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [searchLang, setSearchLang] = useState('');
  const [saving, setSaving] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageItem[]>(ALL_LANGUAGES);

  // Fetch supported languages from backend API on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.request<any>(ENDPOINTS.supportedLanguagesPath);
        const rawList = res?.languages ?? res?.data ?? res?.supported_languages ?? res ?? [];
        if (Array.isArray(rawList) && rawList.length > 0 && isMounted) {
          const merged: LanguageItem[] = [];
          const seen = new Set<string>();

          rawList.forEach((item: any) => {
            const code = typeof item === 'string' ? item.toLowerCase() : String(item?.code || item?.lang || '').toLowerCase();
            if (!code || seen.has(code)) return;
            seen.add(code);
            const found = ALL_LANGUAGES.find((l) => l.code.toLowerCase() === code);
            if (found) {
              merged.push(found);
            } else {
              merged.push({
                code: code as LangCode,
                name: typeof item === 'object' && item?.name ? item.name : code.toUpperCase(),
                native: typeof item === 'object' && item?.native ? item.native : code.toUpperCase(),
                flag: '🌐',
                reviewed: false,
              });
            }
          });

          // Append remaining global languages
          ALL_LANGUAGES.forEach((item) => {
            if (!seen.has(item.code.toLowerCase())) {
              seen.add(item.code.toLowerCase());
              merged.push(item);
            }
          });

          setAvailableLanguages(merged);
        }
      } catch (err) {
        console.log('[LanguageScreen] Using default ALL_LANGUAGES:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Country-based recommended languages
  const recommendedCodes = useMemo(() => {
    return new Set((country.supportedLanguages || []).map((l) => l.code));
  }, [country]);

  // Filter languages based on user search query
  const filteredAllLanguages = useMemo(() => {
    const q = searchLang.toLowerCase().trim();
    if (!q) return availableLanguages;
    return availableLanguages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [availableLanguages, searchLang]);

  const recommendedList = useMemo(() => {
    if (searchLang.trim()) return [];
    return availableLanguages.filter((l) => recommendedCodes.has(l.code));
  }, [availableLanguages, recommendedCodes, searchLang]);

  const otherList = useMemo(() => {
    if (searchLang.trim()) return filteredAllLanguages;
    return availableLanguages.filter((l) => !recommendedCodes.has(l.code));
  }, [availableLanguages, recommendedCodes, filteredAllLanguages, searchLang]);

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
        router.push('/(auth)/first-run-consent');
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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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

        {/* ── Search Bar for 100+ Global Languages ── */}
        <View style={[styles.searchBox, { flexDirection: rowDirection }]}>
          <Ionicons name="search" size={17} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { textAlign }]}
            placeholder="Search all 100+ languages"
            placeholderTextColor="#94A3B8"
            value={searchLang}
            onChangeText={setSearchLang}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchLang.length > 0 && (
            <Pressable onPress={() => setSearchLang('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* ── Subtitle ── */}
        <Text style={[styles.subText, { textAlign }]}>
          HealthAI provides medically reviewed localization across clinical terms, dosages, and reports.
        </Text>

        {/* ── Section 1: Recommended / Regional Languages ── */}
        {recommendedList.length > 0 && (
          <View>
            <Text style={[styles.sectionLabel, { textAlign }]}>
              {country.code === 'IN'
                ? `Indian Regional Languages (${recommendedList.length})`
                : `Recommended for ${country.name} (${recommendedList.length})`}
            </Text>
            <View style={styles.cardList}>
              {recommendedList.map((item, idx) =>
                renderLangRow(item, idx === recommendedList.length - 1)
              )}
            </View>
          </View>
        )}

        {/* ── Section 2: Global & Other Languages ── */}
        {otherList.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={[styles.sectionLabel, { textAlign }]}>
              {searchLang.trim()
                ? `Matching Languages (${otherList.length})`
                : `Global & International Languages (${otherList.length})`}
            </Text>
            <View style={styles.cardList}>
              {otherList.map((item, idx) =>
                renderLangRow(item, idx === otherList.length - 1)
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Fixed Sticky Bottom Action Container ── */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            pressed && { opacity: 0.85 },
            (saving || isTranslatingLang) && styles.btnDisabled,
          ]}
          onPress={handleApply}
          disabled={saving || isTranslatingLang}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={token ? t('save_changes') || 'Save changes' : t('continue') || 'Continue'}
        >
          {saving || isTranslatingLang ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.btnText}>
                {isTranslatingLang ? 'Applying language...' : t('continue')}
              </Text>
            </View>
          ) : (
            <Text style={styles.btnText}>
              {token ? t('save_changes') || 'Save changes' : t('continue') || 'Continue'}
            </Text>
          )}
        </Pressable>
      </View>

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
                  onPress={async () => {
                    await setCountryCode(item.code);
                    if (item.defaultLanguage) {
                      await setLang(item.defaultLanguage as LangCode);
                    }
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
    paddingBottom: 16,
  },

  // ── Search Bar ──
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
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

  // ── Bottom Action Button & Container ──
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  btn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
