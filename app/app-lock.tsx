/**
 * app/app-lock.tsx
 *
 * App Lock & Security Settings Screen — Matching Prototype v2 (scr-applock).
 * Controls Require PIN toggle, Use Face ID/Fingerprint toggle, and PIN configuration.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import {
  getAppLockSettings,
  setAppLockEnabled,
  setUseBiometrics,
  savePin,
} from '@/utils/appLock';

export default function AppLockScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();

  const [enabled, setEnabled] = useState(false);
  const [useBio, setUseBio] = useState(true);
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const settings = await getAppLockSettings();
      setEnabled(settings.enabled);
      setUseBio(settings.useBiometrics);
      setHasExistingPin(settings.hasPin);
      setLoading(false);
    })();
  }, []);

  const handleToggleEnabled = async (value: boolean) => {
    if (value && !hasExistingPin && !newPin) {
      Alert.alert(
        t('app_lock'),
        'Please set a 4-digit PIN below to enable App Lock.',
      );
      return;
    }
    setEnabled(value);
    await setAppLockEnabled(value);
  };

  const handleToggleBio = async (value: boolean) => {
    setUseBio(value);
    await setUseBiometrics(value);
  };

  const handleSavePin = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert('Invalid PIN', t('pin_invalid'));
      return;
    }

    if (confirmPin.length !== 4) {
      Alert.alert('Confirm PIN', 'Please confirm your 4-digit PIN.');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'The entered PINs do not match. Please try again.');
      return;
    }

    await savePin(newPin);
    await setAppLockEnabled(true);
    setEnabled(true);
    setHasExistingPin(true);
    setNewPin('');
    setConfirmPin('');
    Alert.alert('Success', t('pin_saved'));
  };

  if (loading) {
    return <SafeAreaView style={styles.safe} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={[styles.backrow, { flexDirection: rowDirection }]}>
          <Pressable
            style={styles.iconbtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={18}
              color={Colors.text}
            />
          </Pressable>
          <Text style={[styles.title, { textAlign }]}>{t('app_lock')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Card 1 — Require PIN toggle */}
          <View style={[styles.card, styles.row, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.cardLabel, { textAlign }]}>{t('require_pin')}</Text>
              <Text style={[styles.cardSub, { textAlign }]}>
                Locks app automatically when in background
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Card 2 — Biometrics toggle */}
          <View style={[styles.card, styles.row, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.cardLabel, { textAlign }]}>{t('use_face_id')}</Text>
              <Text style={[styles.cardSub, { textAlign }]}>
                Unlock instantly using Touch ID / Face ID
              </Text>
            </View>
            <Switch
              value={useBio}
              onValueChange={handleToggleBio}
              trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              thumbColor="#FFFFFF"
              disabled={!enabled}
            />
          </View>

          {/* PIN Setup Card */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { textAlign }]}>
              {hasExistingPin ? t('change_pin') : 'Set 4-Digit PIN'}
            </Text>

            <Text style={[styles.fieldLabel, { textAlign }]}>{t('enter_new_pin')}</Text>
            <TextInput
              style={[styles.input, { textAlign: 'center' }]}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
            />

            <Text style={[styles.fieldLabel, { textAlign, marginTop: 12 }]}>
              Confirm 4-digit PIN
            </Text>
            <TextInput
              style={[styles.input, { textAlign: 'center' }]}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={confirmPin}
              onChangeText={setConfirmPin}
            />

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && { opacity: 0.85 },
                (!newPin || !confirmPin) && styles.saveBtnDisabled,
              ]}
              onPress={handleSavePin}
              disabled={!newPin || !confirmPin}
            >
              <Text style={styles.saveBtnText}>{t('save_pin')}</Text>
            </Pressable>
          </View>

          {/* Privacy & Hardware Encryption Note */}
          <View style={styles.noteCard}>
            <Ionicons name="shield-checkmark" size={16} color="#0F766E" />
            <Text style={styles.noteText}>
              Your PIN is encrypted locally inside your device's secure hardware enclave. It is never transmitted across the network.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    padding: 16,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  cardSub: {
    fontSize: 12,
    color: '#6B756F',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2B2A',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B756F',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2B2A',
    letterSpacing: 8,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 17,
  },
});
