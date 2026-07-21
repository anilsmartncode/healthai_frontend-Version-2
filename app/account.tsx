import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import { Input } from '@/components/ui/Input';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/Languagecontext';
import { api } from '@/services/api';
import { ENDPOINTS, BASE_URL } from '@/constants/api';

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const GENDERS      = ['Male', 'Female', 'Other', 'Prefer not to say'];

// 🔴 REAL active | set true to roll back to 🟢 MOCK
const USE_MOCK = false;

const MOCK_PROFILE = {
  name: '',
  email: '',
  dob: null as Date | null,
  bloodGroup: 'B+',
  gender: 'Male',
  height: '',
  weight: '',
};

export default function Account() {
  const { phone } = useAuth();
  const { t }     = useLang();

  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob,        setDob]        = useState<Date | null>(null);
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [gender,     setGender]     = useState('Male');
  const [height,     setHeight]     = useState('');
  const [weight,     setWeight]     = useState('');
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  // ── Load profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        if (USE_MOCK) {
          // 🟢 MOCK: start with empty fields so user fills their real info
          setName(MOCK_PROFILE.name);
          setEmail(MOCK_PROFILE.email);
          setDob(MOCK_PROFILE.dob);
          setBloodGroup(MOCK_PROFILE.bloodGroup);
          setGender(MOCK_PROFILE.gender);
          setHeight(MOCK_PROFILE.height);
          setWeight(MOCK_PROFILE.weight);
        } else {
          // 🔴 REAL: GET /api/user/profile
          const raw = await api.request<any>(ENDPOINTS.profileMePath);
          console.log('[Account] RAW API RESPONSE:', JSON.stringify(raw, null, 2));
          // GET returns flat: { user_id, full_name, email, phone, avatar_url,
          //                     date_of_birth, gender, blood_type, created_at }
          // PATCH response wraps under user: { user_id, full_name, ... }
          const data = raw?.user ?? raw;
          setName(data.full_name ?? data.name ?? '');
          setEmail(data.email ?? '');
          setPhoneNumber(data.phone ?? '');
          const dobValue = data.date_of_birth ?? data.dob;
          setDob(dobValue ? new Date(dobValue) : null);
          let avUrl = data.avatar_url ?? null;
          if (avUrl && !avUrl.startsWith('http')) {
            avUrl = avUrl.startsWith('/') ? BASE_URL + avUrl : `${BASE_URL}/${avUrl}`;
          }
          setAvatarUrl(avUrl);
          setBloodGroup(data.blood_type ?? data.blood_group ?? 'B+');
          setGender(data.gender ?? 'Male');
          
          // Use the email returned by the API as a consistent key (falls back to phone or guest)
          const userKey = data.email || data.phone || 'guest';
          const localPhone = await AsyncStorage.getItem(`healthai_phone_${userKey}`);
          const localHeight = await AsyncStorage.getItem(`healthai_height_${userKey}`);
          const localWeight = await AsyncStorage.getItem(`healthai_weight_${userKey}`);
          
          if (localPhone) setPhoneNumber(localPhone);
          if (localHeight) setHeight(localHeight);
          if (localWeight) setWeight(localWeight);
          
          if (!localHeight && data.height) setHeight(String(data.height));
          if (!localWeight && data.weight) setWeight(String(data.weight));
          const displayName = (data.full_name ?? data.name ?? '').trim();
          if (displayName) {
            try {
              await AsyncStorage.setItem(
                `healthai_profile_name_${userKey}`,
                displayName
              );
            } catch { /* ignore */ }
          }
        }
      } catch (e) {
        console.warn('[Account] Failed to load profile', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Full name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      if (USE_MOCK) {
        // 🟢 MOCK: simulate save delay
        await new Promise((r) => setTimeout(r, 900));
      } else {
        // 🔴 REAL: PATCH /api/user/profile
        await api.request(ENDPOINTS.profileMePath, {
          method: 'PATCH',
          body: JSON.stringify({
            full_name:     name,
            email,
            phone:         phoneNumber,
            date_of_birth: dob ? dob.toISOString().split('T')[0] : null,
            blood_type:    bloodGroup,
            gender:        gender,
            height:        height || null,
            weight:        weight || null,
          }),
        });
      }
      Alert.alert('Saved', 'Your profile has been updated.');
      // Cache extra fields locally so they persist without causing a 500 on the backend
      try {
        const userKey = email || phone || 'guest';
        await AsyncStorage.setItem(`healthai_profile_name_${userKey}`, name.trim());
        if (phoneNumber) await AsyncStorage.setItem(`healthai_phone_${userKey}`, phoneNumber);
        if (height) await AsyncStorage.setItem(`healthai_height_${userKey}`, height);
        if (weight) await AsyncStorage.setItem(`healthai_weight_${userKey}`, weight);
      } catch { /* ignore */ }
    } catch (e: any) {
      if (e?.message === 'SESSION_EXPIRED') {
        Alert.alert('Session Expired', 'Please sign in again to continue.');
        return;
      }
      Alert.alert('Error', e?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingAvatar(true);

        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName || 'avatar.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as any);

        const response = await api.request<any>(ENDPOINTS.profileAvatarPath, {
          method: 'POST',
          body: formData,
        });

        let newAvatarUrl = response?.user?.avatar_url || response?.avatar_url;
        if (newAvatarUrl) {
          if (!newAvatarUrl.startsWith('http')) {
            newAvatarUrl = newAvatarUrl.startsWith('/') ? BASE_URL + newAvatarUrl : `${BASE_URL}/${newAvatarUrl}`;
          }
          setAvatarUrl(newAvatarUrl);
        } else {
          // Show local image immediately if backend didn't return the URL but succeeded
          setAvatarUrl(asset.uri);
        }
        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (e: any) {
      console.warn('[Account] Photo upload error:', e);
      Alert.alert('Error', e.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
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
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('account_info')}</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.saveLink}>{t('save_changes')}</Text>}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 78, height: 78, borderRadius: 39 }} resizeMode="cover" />
            ) : name.trim() ? (
              <Text style={styles.avatarInitial}>
                {name.trim()[0].toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={34} color="#fff" />
            )}
          </View>
          <Pressable onPress={handlePickImage} disabled={uploadingAvatar}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.changePhoto}>Change photo</Text>
            )}
          </Pressable>
        </View>

        {/* Basic info */}
        <Text style={styles.sectionLabel}>Basic information</Text>
        <View style={styles.card}>
          <Input
            label={t('full_name')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          {/* Email Field */}
          {phone?.includes('@') ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>{t('email')}</Text>
                <Text style={styles.phoneHint}>(Cannot be changed)</Text>
              </View>
              <View style={styles.phoneRow}>
                <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.phoneVal}>{phone}</Text>
              </View>
            </View>
          ) : (
            <Input
              label={t('email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}

          {/* Phone Field */}
          {!phone?.includes('@') ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>{t('phone')}</Text>
                <Text style={styles.phoneHint}>(Cannot be changed)</Text>
              </View>
              <View style={styles.phoneRow}>
                <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.phoneVal}>{phone ?? '—'}</Text>
              </View>
            </View>
          ) : (
            <Input
              label={t('phone')}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          )}

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
          <View>
            <Text style={styles.fieldLabel}>Blood group</Text>
            <View style={styles.chipRow}>
              {BLOOD_GROUPS.map((bg) => (
                <Pressable
                  key={bg}
                  style={[styles.chip, bloodGroup === bg && styles.chipSelected]}
                  onPress={() => setBloodGroup(bg)}
                >
                  <Text style={[styles.chipText, bloodGroup === bg && styles.chipTextSelected]}>
                    {bg}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g}
                  style={[styles.chip, gender === g && styles.chipSelected]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextSelected]}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

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

        {/* Save button */}
        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{t('save_changes')}</Text>}
        </Pressable>

        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.primary} />
          <Text style={styles.privacyText}>
            Your data is encrypted and never shared with third parties.
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle:   { fontSize: 17, fontWeight: '600', color: Colors.text, flex: 1 },
  saveLink:      { fontSize: 14, fontWeight: '600', color: Colors.primary },
  body:          { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  avatarWrap:    { alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#5DCAA5', overflow: 'hidden',
  },
  avatarInitial: { fontSize: 30, fontWeight: '700', color: '#fff' },
  changePhoto:   { fontSize: 14, fontWeight: '600', color: Colors.primary },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4,
  },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.surface,
  },
  phoneVal:        { flex: 1, fontSize: 15, color: Colors.text },
  phoneHint:       { fontSize: 11, color: Colors.textMuted },
  chipRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:         { fontSize: 13, color: Colors.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  rowFields:        { flexDirection: 'row', gap: Spacing.md },
  saveBtn: {
    backgroundColor: Colors.primary, paddingVertical: 14,
    borderRadius: Radius.md, alignItems: 'center', marginTop: 4,
  },
  saveBtnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  privacyNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#ECFDF5', borderRadius: Radius.md,
    padding: 12, borderWidth: 1, borderColor: '#A7F3D0',
  },
  privacyText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },
});