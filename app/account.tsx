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
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

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
  const { t } = useLang();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isActualPhone = (val?: string | null) => !!val && !val.includes('@') && /\d/.test(val);
  const isActualEmail = (val?: string | null) => !!val && val.includes('@');

  const sanitizeAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null;
    let clean = String(url).trim();
    if (!clean) return null;

    // Replace localhost or 127.0.0.1 with production BASE_URL host
    if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
      clean = clean.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, BASE_URL);
    }

    // Upgrade http to https if it matches BASE_URL domain
    if (clean.startsWith('http://healthai.smartncode.com')) {
      clean = clean.replace('http://', 'https://');
    }

    // CRITICAL BACKEND NGINX ROUTE FIX:
    // Backend returns '/uploads/avatars/...' but Nginx routes backend static files under '/api/uploads/...'
    // Without '/api', Nginx returns index.html (SPA frontend HTML) which causes 'unknown image format'
    if (clean.startsWith('https://healthai.smartncode.com/uploads/')) {
      clean = clean.replace('https://healthai.smartncode.com/uploads/', 'https://healthai.smartncode.com/api/uploads/');
    } else if (clean.startsWith('http://healthai.smartncode.com/uploads/')) {
      clean = clean.replace('http://healthai.smartncode.com/uploads/', 'https://healthai.smartncode.com/api/uploads/');
    } else if (clean.startsWith('/uploads/')) {
      clean = `${BASE_URL}/api${clean}`;
    } else if (clean.startsWith('uploads/')) {
      clean = `${BASE_URL}/api/${clean}`;
    } else if (
      !clean.startsWith('http://') &&
      !clean.startsWith('https://') &&
      !clean.startsWith('file://') &&
      !clean.startsWith('content://') &&
      !clean.startsWith('blob:')
    ) {
      clean = clean.startsWith('/') ? `${BASE_URL}${clean}` : `${BASE_URL}/${clean}`;
    }

    return clean;
  };

  // ── Load profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        if (USE_MOCK) {
          setName(MOCK_PROFILE.name);
          setEmail(MOCK_PROFILE.email);
          setDob(MOCK_PROFILE.dob);
          setBloodGroup(MOCK_PROFILE.bloodGroup);
          setGender(MOCK_PROFILE.gender);
          setHeight(MOCK_PROFILE.height);
          setWeight(MOCK_PROFILE.weight);
        } else {
          // Check cached local avatar first
          const authKey = email || (isActualPhone(phone) ? phone! : 'guest');
          let cachedAvatar: string | null = null;
          try {
            cachedAvatar = await AsyncStorage.getItem(`healthai_avatar_${authKey}`);
            if (cachedAvatar) {
              setAvatarUrl(cachedAvatar);
              setLocalAvatarUri(cachedAvatar);
            }
          } catch { /* ignore */ }

          // 🔴 REAL: GET /api/user/profile
          const raw = await api.request<any>(ENDPOINTS.profileMePath);
          console.log('[Account] GET PROFILE RAW RESPONSE:', JSON.stringify(raw, null, 2));
          const data = raw?.user ?? raw;

          setName(data.full_name ?? data.name ?? '');
          setEmail(data.email ?? '');
          setPhoneNumber(data.phone ?? '');
          const dobValue = data.date_of_birth ?? data.dob;
          setDob(dobValue ? new Date(dobValue) : null);

          let avUrl = data.avatar_url ?? data.profile_image ?? data.avatar ?? null;
          avUrl = sanitizeAvatarUrl(avUrl);

          const userKey = data.email || data.phone || authKey;

          // If API didn't return an avatar, look up local storage
          if (!avUrl) {
            try {
              const localAv = await AsyncStorage.getItem(`healthai_avatar_${userKey}`);
              if (localAv) {
                avUrl = localAv;
                setLocalAvatarUri(localAv);
              }
            } catch { /* ignore */ }
          } else {
            try {
              await AsyncStorage.setItem(`healthai_avatar_${userKey}`, avUrl);
            } catch { /* ignore */ }
          }

          if (avUrl) {
            setAvatarUrl(avUrl);
            setImageLoadError(false);
          }

          setBloodGroup(data.blood_type ?? data.blood_group ?? 'B+');
          setGender(data.gender ?? 'Male');

          const localPhone = await AsyncStorage.getItem(`healthai_phone_${userKey}`);
          const localHeight = await AsyncStorage.getItem(`healthai_height_${userKey}`);
          const localWeight = await AsyncStorage.getItem(`healthai_weight_${userKey}`);

          if (localPhone && !data.phone) setPhoneNumber(localPhone);
          if (localHeight && !data.height) setHeight(localHeight);
          if (localWeight && !data.weight) setWeight(localWeight);

          if (data.height) setHeight(String(data.height));
          if (data.weight) setWeight(String(data.weight));

          const displayName = (data.full_name ?? data.name ?? '').trim();
          if (displayName) {
            try {
              await AsyncStorage.setItem(`healthai_profile_name_${userKey}`, displayName);
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
        await new Promise((r) => setTimeout(r, 900));
      } else {
        // 🔴 REAL: PATCH /api/user/profile
        await api.request(ENDPOINTS.profileMePath, {
          method: 'PATCH',
          body: JSON.stringify({
            full_name: name.trim(),
            email: email.trim(),
            phone: phoneNumber.trim(),
            date_of_birth: dob ? dob.toISOString().split('T')[0] : null,
            blood_type: bloodGroup,
            gender: gender,
            height: height ? Number(height) || height : null,
            weight: weight ? Number(weight) || weight : null,
          }),
        });
      }
      Alert.alert('Saved', 'Your profile has been updated successfully.');

      // Cache locally for instant UI responsiveness
      try {
        const userKey = email.trim() || (isActualPhone(phoneNumber) ? phoneNumber.trim() : (isActualPhone(phone) ? phone! : 'guest'));
        await AsyncStorage.setItem(`healthai_profile_name_${userKey}`, name.trim());
        if (phoneNumber) await AsyncStorage.setItem(`healthai_phone_${userKey}`, phoneNumber.trim());
        if (height) await AsyncStorage.setItem(`healthai_height_${userKey}`, height);
        if (weight) await AsyncStorage.setItem(`healthai_weight_${userKey}`, weight);
        if (avatarUrl) await AsyncStorage.setItem(`healthai_avatar_${userKey}`, avatarUrl);
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
        Alert.alert('Permission needed', 'Please allow camera roll access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[Account] Picked Image Asset:', { uri: asset.uri, width: asset.width, height: asset.height, mimeType: asset.mimeType });

        setUploadingAvatar(true);
        setImageLoadError(false);
        setLocalAvatarUri(asset.uri);
        // Immediately preview selected image
        setAvatarUrl(asset.uri);

        const userKey = email.trim() || (isActualPhone(phoneNumber) ? phoneNumber.trim() : (isActualPhone(phone) ? phone! : 'guest'));
        try {
          await AsyncStorage.setItem(`healthai_avatar_${userKey}`, asset.uri);
        } catch { /* ignore */ }

        // Construct FormData for multipart upload
        const formData = new FormData();
        const filename = asset.fileName || `avatar_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';

        formData.append('file', {
          uri: asset.uri,
          name: filename,
          type: mimeType,
        } as any);

        formData.append('avatar', {
          uri: asset.uri,
          name: filename,
          type: mimeType,
        } as any);

        console.log('[Account] POSTing avatar to:', ENDPOINTS.profileAvatarPath);

        try {
          const response = await api.request<any>(ENDPOINTS.profileAvatarPath, {
            method: 'POST',
            body: formData,
          });

          console.log('[Account] RAW AVATAR UPLOAD RESPONSE:', JSON.stringify(response, null, 2));

          const serverUrl =
            response?.avatar_url ||
            response?.user?.avatar_url ||
            response?.data?.avatar_url ||
            response?.data?.user?.avatar_url ||
            response?.url ||
            response?.data?.url ||
            response?.file_url ||
            response?.data?.file_url ||
            response?.image ||
            response?.profile_image;

          if (serverUrl) {
            const formattedUrl = sanitizeAvatarUrl(serverUrl);
            console.log('[Account] Parsed server avatar URL:', formattedUrl);
            if (formattedUrl) {
              setAvatarUrl(formattedUrl);
              setImageLoadError(false);
              await AsyncStorage.setItem(`healthai_avatar_${userKey}`, formattedUrl);
            }
            Alert.alert('Success', 'Profile photo updated and saved on server!');
          } else {
            console.log('[Account] Backend returned success status but no URL in response body. Querying fresh profile...');
            // Check fresh profile from server
            try {
              const freshProfile = await api.request<any>(ENDPOINTS.profileMePath);
              console.log('[Account] FRESH PROFILE RAW:', JSON.stringify(freshProfile, null, 2));
              const freshData = freshProfile?.user ?? freshProfile;
              const freshUrl = sanitizeAvatarUrl(freshData?.avatar_url ?? freshData?.profile_image);
              if (freshUrl) {
                setAvatarUrl(freshUrl);
                setImageLoadError(false);
                await AsyncStorage.setItem(`healthai_avatar_${userKey}`, freshUrl);
                Alert.alert('Success', 'Profile photo updated successfully!');
                return;
              }
            } catch (freshErr) {
              console.warn('[Account] Fresh profile fetch error:', freshErr);
            }

            // Local preview remains active
            Alert.alert('Photo Updated', 'Profile photo preview updated on this device.');
          }
        } catch (err: any) {
          console.error('[Account] Backend avatar upload ERROR:', err);
          Alert.alert(
            'Upload Error',
            `Server error: ${err?.message || 'Failed to upload photo to server'}.\n\nYour photo has been saved locally for preview.`
          );
        }
      }
    } catch (e: any) {
      console.error('[Account] Photo selection error:', e);
      Alert.alert('Error', e?.message || 'Failed to select photo');
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.7, backgroundColor: '#E2E8F0' },
          ]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {t('account_info')}
          </Text>
        </View>

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
          {/* ── Interactive Avatar Section ── */}
          <View style={styles.avatarSection}>
            <Pressable
              style={({ pressed }) => [
                styles.avatarTouch,
                pressed && styles.avatarPressed,
              ]}
              onPress={handlePickImage}
              disabled={uploadingAvatar}
              hitSlop={10}
            >
              <View style={styles.avatarContainer}>
                {avatarUrl && !imageLoadError ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImg}
                    resizeMode="cover"
                    onLoadStart={() => {
                      console.log('[Account] Avatar Image loading started for:', avatarUrl);
                    }}
                    onLoad={() => {
                      console.log('[Account] Avatar Image rendered successfully!');
                      setImageLoadError(false);
                    }}
                    onError={(err) => {
                      console.warn('[Account] Avatar Image FAILED to load from URL:', avatarUrl, err.nativeEvent);
                      if (localAvatarUri && avatarUrl !== localAvatarUri) {
                        console.log('[Account] Falling back to local file URI:', localAvatarUri);
                        setAvatarUrl(localAvatarUri);
                      } else {
                        setImageLoadError(true);
                      }
                    }}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    {name.trim() ? (
                      <Text style={styles.avatarInitial}>
                        {name.trim().charAt(0).toUpperCase()}
                      </Text>
                    ) : (
                      <Ionicons name="person" size={38} color={Colors.primary} />
                    )}
                  </View>
                )}
                {uploadingAvatar && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={13} color="#fff" />
              </View>
            </Pressable>

            <Pressable
              style={styles.changePhotoBtn}
              onPress={handlePickImage}
              disabled={uploadingAvatar}
              hitSlop={8}
            >
              <Ionicons name="image-outline" size={15} color={Colors.primary} />
              <Text style={styles.changePhotoText}>
                {uploadingAvatar ? 'Uploading photo...' : 'Change Photo'}
              </Text>
            </Pressable>
          </View>

          {/* ── Basic Information Card ── */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="person" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Personal Details</Text>
          </View>

          <View style={styles.card}>
            <Input
              label={t('full_name')}
              value={name}
              onChangeText={setName}
              placeholder="e.g. John Doe"
              autoCapitalize="words"
            />

            {/* Email Field */}
            {isActualEmail(phone) ? (
              <View>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.fieldLabel}>{t('email')}</Text>
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={10} color={Colors.textMuted} />
                    <Text style={styles.lockedText}>Primary login</Text>
                  </View>
                </View>
                <View style={styles.readOnlyRow}>
                  <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.readOnlyVal}>{phone}</Text>
                </View>
              </View>
            ) : (
              <Input
                label={t('email')}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}

            {/* Phone Field */}
            {isActualPhone(phone) ? (
              <View>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.fieldLabel}>{t('phone')}</Text>
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={10} color={Colors.textMuted} />
                    <Text style={styles.lockedText}>Primary login</Text>
                  </View>
                </View>
                <View style={styles.readOnlyRow}>
                  <Ionicons name="call-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.readOnlyVal}>{phone}</Text>
                </View>
              </View>
            ) : (
              <Input
                label={t('phone')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+1 234 567 8900"
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

          {/* ── Health & Vitals Card ── */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="medkit" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Health & Medical Info</Text>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.fieldLabel}>Blood Group</Text>
              <View style={styles.chipRow}>
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = bloodGroup === bg;
                  return (
                    <Pressable
                      key={bg}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setBloodGroup(bg)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {bg}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.chipRow}>
                {GENDERS.map((g) => {
                  const isSelected = gender === g;
                  return (
                    <Pressable
                      key={g}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {g}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Height (cm)"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="e.g. 175"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Weight (kg)"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="e.g. 70"
                />
              </View>
            </View>
          </View>

          {/* ── Save Action Button ── */}
          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.saveBtnContent}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{t('save_changes')}</Text>
              </View>
            )}
          </Pressable>

          {/* ── Security Note (Matching Profile page) ── */}
          <View style={styles.secureBanner}>
            <View style={styles.secureIcon}>
              <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.secureTitle}>Encrypted & Private</Text>
              <Text style={styles.secureSub}>
                Your health data is protected with end-to-end encryption and is never shared without your consent.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 62,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },

  body: { padding: 16, gap: 16, paddingBottom: 40 },

  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  avatarTouch: {
    position: 'relative',
    borderRadius: 44,
  },
  avatarPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary + '10',
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },

  card: {
    gap: 14,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  lockedText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  readOnlyVal: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },

  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },

  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  secureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 2,
  },
  secureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureTitle: { fontSize: 13, fontWeight: '700', color: '#166534' },
  secureSub: { marginTop: 2, fontSize: 11, color: '#15803D', lineHeight: 15 },
});