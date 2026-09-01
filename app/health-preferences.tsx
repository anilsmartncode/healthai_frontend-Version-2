import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import type { LangCode } from '@/context/Translations';
import {
  getHealthPreferences,
  saveHealthPreferences,
  type HealthPreferences,
  DEFAULT_HEALTH_PREFERENCES,
} from '@/services/healthPreferencesApi';

const LANGUAGES: { code: LangCode; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
];

export default function HealthPreferencesScreen() {
  const { lang, setLang, t, isRTL, rowDirection, textAlign } = useLang();

  const [prefs, setPrefs] = useState<HealthPreferences>(DEFAULT_HEALTH_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await getHealthPreferences();
        setPrefs(loaded);
      } catch (err) {
        console.warn('[health-preferences] Error loading:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = (key: keyof HealthPreferences) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // Auto-save on toggle
      saveHealthPreferences(updated).catch(() => {});
      return updated;
    });
  };

  const handleSelectUnits = (units: 'metric' | 'imperial') => {
    setPrefs((prev) => {
      const updated = { ...prev, units };
      saveHealthPreferences(updated).catch(() => {});
      return updated;
    });
    setShowUnitsModal(false);
  };

  const handleSelectLang = async (code: LangCode) => {
    await setLang(code);
    setShowLangModal(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveHealthPreferences(prefs);
      Alert.alert('Success', t('preferences_saved') || 'Preferences saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Topbar matching Prototype v2 (scr-healthpreferences) ── */}
      <View style={styles.topbar}>
        <View style={[styles.backrow, { flexDirection: rowDirection }]}>
          <Pressable style={styles.iconbtn} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={Colors.text} />
          </Pressable>
          <Text style={[styles.title, { textAlign }]}>{t('health_preferences')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Units Field ── */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { textAlign }]}>{t('units')}</Text>
          <Pressable
            style={[styles.selectBox, { flexDirection: rowDirection }]}
            onPress={() => setShowUnitsModal(true)}
          >
            <Text style={[styles.selectText, { textAlign }]}>
              {prefs.units === 'metric' ? t('metric_units') : t('imperial_units')}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B756F" />
          </Pressable>
        </View>

        {/* ── Language Field ── */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { textAlign }]}>{t('language_pref')}</Text>
          <Pressable
            style={[styles.selectBox, { flexDirection: rowDirection }]}
            onPress={() => setShowLangModal(true)}
          >
            <Text style={[styles.selectText, { textAlign }]}>
              {currentLangObj.name} ({currentLangObj.nativeName})
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B756F" />
          </Pressable>
        </View>

        {/* ── Notifications Section ── */}
        <Text style={[styles.sectionTitle, { textAlign }]}>{t('notifications')}</Text>

        <View style={styles.card}>
          {/* Medicine reminders */}
          <View style={[styles.switchRow, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.switchLabel, { textAlign }]}>{t('medicine_reminders')}</Text>
            </View>
            <Switch
              value={prefs.medicineReminders}
              onValueChange={() => handleToggle('medicineReminders')}
              trackColor={{ false: '#D1D5DB', true: '#0F766E' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Appointment reminders */}
          <View style={[styles.switchRow, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.switchLabel, { textAlign }]}>{t('appointment_reminders')}</Text>
            </View>
            <Switch
              value={prefs.appointmentReminders}
              onValueChange={() => handleToggle('appointmentReminders')}
              trackColor={{ false: '#D1D5DB', true: '#0F766E' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Health tips and insights */}
          <View style={[styles.switchRow, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.switchLabel, { textAlign }]}>{t('health_tips_insights')}</Text>
            </View>
            <Switch
              value={prefs.healthTips}
              onValueChange={() => handleToggle('healthTips')}
              trackColor={{ false: '#D1D5DB', true: '#0F766E' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Family activity alerts */}
          <View style={[styles.switchRow, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.switchLabel, { textAlign }]}>{t('family_activity_alerts')}</Text>
            </View>
            <Switch
              value={prefs.familyAlerts}
              onValueChange={() => handleToggle('familyAlerts')}
              trackColor={{ false: '#D1D5DB', true: '#0F766E' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ── Quiet Hours Section ── */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { textAlign }]}>{t('quiet_hours')}</Text>
          <View style={[styles.grid2, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { textAlign }]}
                value={prefs.quietHoursStart}
                onChangeText={(val) => setPrefs((prev) => ({ ...prev, quietHoursStart: val }))}
                placeholder="10:00 PM"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { textAlign }]}
                value={prefs.quietHoursEnd}
                onChangeText={(val) => setPrefs((prev) => ({ ...prev, quietHoursEnd: val }))}
                placeholder="7:00 AM"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* ── Save Changes Button ── */}
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            pressed && { opacity: 0.85 },
            saving && styles.btnDisabled,
          ]}
          onPress={handleSaveAll}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.btnText}>{t('save_changes')}</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* ── Units Modal ── */}
      <Modal
        visible={showUnitsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowUnitsModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('units')}</Text>
            <Pressable
              style={[styles.modalOption, prefs.units === 'metric' && styles.modalOptionSelected]}
              onPress={() => handleSelectUnits('metric')}
            >
              <Text style={[styles.modalOptionText, prefs.units === 'metric' && styles.modalOptionTextSelected]}>
                {t('metric_units')}
              </Text>
              {prefs.units === 'metric' && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
            </Pressable>
            <Pressable
              style={[styles.modalOption, prefs.units === 'imperial' && styles.modalOptionSelected]}
              onPress={() => handleSelectUnits('imperial')}
            >
              <Text style={[styles.modalOptionText, prefs.units === 'imperial' && styles.modalOptionTextSelected]}>
                {t('imperial_units')}
              </Text>
              {prefs.units === 'imperial' && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Language Modal ── */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('language_pref')}</Text>
            <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((l) => {
                const isSelected = lang === l.code;
                return (
                  <Pressable
                    key={l.code}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => handleSelectLang(l.code)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {l.name} ({l.nativeName})
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
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
    gap: 14,
    paddingBottom: 40,
  },

  fieldBlock: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B756F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 14,
    color: '#1A2B2A',
    fontWeight: '500',
  },

  sectionTitle: {
    fontWeight: '700',
    fontSize: 13.5,
    color: '#1A2B2A',
    marginTop: 8,
    marginBottom: 2,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  switchRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 13,
    color: '#1A2B2A',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  grid2: {
    gap: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A2B2A',
  },

  btn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B2A',
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#1A2B2A',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
