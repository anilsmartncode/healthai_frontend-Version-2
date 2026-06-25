/**
 * PersonOnboardingScreen.tsx
 *
 * Shown ONCE — only after a fresh signup (email or phone).
 * Login flows go directly to /(tabs)/home and never hit this screen.
 *
 * Flow:
 *   signup / Phonesignup  →  PersonOnboardingScreen  →  /(tabs)/home
 *
 * Rebuilt to match account.tsx visual language:
 *   - Light background, card-based sections
 *   - Single scroll form (no step wizard)
 *   - Fields: Name, Gender, DOB, Blood group, Height, Weight
 *   - "Skip for now" always available
 *
 * Guard: on mount reads AsyncStorage key "onboarding_done".
 * If already "1" (returning user somehow landed here), bounces to home instantly.
 *
 * MOCK-FIRST PATTERN
 * ───────────────────
 *  🟢 MOCK  → saves profile to AsyncStorage only
 *  🔴 REAL  → swap the body of `saveProfile()` for an API call
 *             (kept as a single function so this is the ONLY place to change)
 */

import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import { Input } from '@/components/ui/Input';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { DropdownField } from '@/components/ui/DropdownField';
import { useAuth } from '@/context/AuthContext';
import { saveOnboardingApi } from '@/services/authapi/apiService';

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', "I don't know"];
const GENDERS      = ['Male', 'Female', 'Other', 'Prefer not to say'];

// ─── Toggle ─────────────────────────────────────────────────────────────────
const USE_MOCK = false; // 🔴 REAL active | set true to roll back to 🟢 MOCK
// ────────────────────────────────────────────────────────────────────────────

export default function PersonOnboardingScreen() {
  const { token } = useAuth();
  const [name,       setName]       = useState('');
  const [gender,     setGender]     = useState<string | null>(null);
  const [dob,        setDob]        = useState<Date | null>(null);
  const [bloodGroup, setBloodGroup] = useState<string | null>(null);
  const [height,     setHeight]     = useState('');
  const [weight,     setWeight]     = useState('');

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // ── Guard: skip if already onboarded ──
  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then((val) => {
      if (val === '1') {
        router.replace('/(tabs)/home');
      } else {
        setChecking(false);
      }
    });
  }, []);

  // ── Save profile ──
  const saveProfile = async (payload: {
    name: string;
    gender: string | null;
    dob: Date | null;
    bloodGroup: string | null;
    height: string;
    weight: string;
  }) => {
    if (USE_MOCK) {
      // 🟢 MOCK: persist locally only
      await AsyncStorage.setItem('healthai_onboarding_profile', JSON.stringify({
        ...payload,
        dob: payload.dob ? payload.dob.toISOString().split('T')[0] : null,
      }));
      await new Promise((r) => setTimeout(r, 700));
      return;
    }

    // 🔴 REAL: POST /api/auth/onboarding
    // "I don't know" is a valid UI choice but not a real blood type — send
    // null rather than the literal string so the backend doesn't try to
    // store it as a blood_type value.
    const bloodType = payload.bloodGroup && payload.bloodGroup !== "I don't know"
      ? payload.bloodGroup
      : null;
    const heightNum = payload.height.trim() ? Number(payload.height) : undefined;
    const weightNum = payload.weight.trim() ? Number(payload.weight) : undefined;

    if (!token) {
      throw new Error('You need to be signed in to save your profile.');
    }

    await saveOnboardingApi(token, {
      full_name: payload.name,
      date_of_birth: payload.dob ? payload.dob.toISOString().split('T')[0] : null,
      gender: payload.gender,
      blood_type: bloodType,
      height_cm: Number.isFinite(heightNum) ? heightNum : undefined,
      weight_kg: Number.isFinite(weightNum) ? weightNum : undefined,
    });
  };

  const handleContinue = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name to continue');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await saveProfile({ name: trimmedName, gender, dob, bloodGroup, height, weight });
      await AsyncStorage.setItem('onboarding_done', '1');
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Skip (still marks done so screen never reappears) ──
  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_done', '1');
    router.replace('/(tabs)/home');
  };

  if (checking) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ width: 34 }} />
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <Pressable onPress={handleSkip} disabled={loading}>
          <Text style={styles.skipLink}>Skip for now</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {name.trim() ? (
              <Text style={styles.avatarInitial}>
                {name.trim()[0].toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={34} color="#fff" />
            )}
          </View>
          <Text style={styles.avatarHint}>
            Tell us a bit about yourself to personalize your health insights
          </Text>
        </View>

        {/* Basic info */}
        <Text style={styles.sectionLabel}>Basic information</Text>
        <View style={styles.card}>
          <Input
            label="Full name"
            value={name}
            onChangeText={(v) => { setName(v); setError(''); }}
            placeholder="Enter your full name"
            autoCapitalize="words"
          />
          {!!error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <DropdownField
            label="Gender"
            value={gender}
            options={GENDERS}
            onChange={setGender}
            placeholder="Select gender"
          />

          <DatePickerField
            label="Date of birth"
            value={dob}
            onChange={setDob}
            maximumDate={new Date()}
          />
        </View>

        {/* Health info */}
        <Text style={styles.sectionLabel}>Health details</Text>
        <View style={styles.card}>
          <DropdownField
            label="Blood group"
            value={bloodGroup}
            options={BLOOD_GROUPS}
            onChange={setBloodGroup}
            placeholder="Select blood group"
          />

          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Input
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="e.g. 172"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="e.g. 68"
              />
            </View>
          </View>
        </View>

        {/* Continue button */}
        <Pressable
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Continue</Text>}
        </Pressable>

        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.primary} />
          <Text style={styles.privacyText}>
            Your data is encrypted and never shared with third parties.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle:  { fontSize: 17, fontWeight: '600', color: Colors.text, flex: 1, textAlign: 'center' },
  skipLink:     { fontSize: 14, fontWeight: '600', color: Colors.primary },
  body:         { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },

  avatarWrap:    { alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#5DCAA5',
  },
  avatarInitial: { fontSize: 30, fontWeight: '700', color: '#fff' },
  avatarHint:    { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 24, lineHeight: 19 },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4,
  },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 },

  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: '500' },

  rowFields: { flexDirection: 'row', gap: Spacing.md },

  saveBtn: {
    backgroundColor: Colors.primary, paddingVertical: 14,
    borderRadius: Radius.md, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  privacyNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#ECFDF5', borderRadius: Radius.md,
    padding: 12, borderWidth: 1, borderColor: '#A7F3D0',
  },
  privacyText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },
});