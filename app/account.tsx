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
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { Colors, Radius } from '@/constants/Colors';
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
  location: '',
};

export default function Account() {
  const { phone } = useAuth();
  const { t, isRTL, rowDirection, textAlign } = useLang();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBloodGroupModal, setShowBloodGroupModal] = useState(false);

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
          setLocation(MOCK_PROFILE.location);
        } else {
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
          setLocation(data.location ?? data.address ?? data.city ?? '');

          let avUrl = data.avatar_url ?? data.image_url ?? data.profile_image ?? data.profile_image_url ?? data.avatar ?? null;
          const userKey = data.email || data.phone || authKey;
          
          if (avUrl) {
            if (avUrl.includes('.smartncode.com/uploads/')) {
              avUrl = avUrl.replace('.smartncode.com/uploads/', '.smartncode.com/api/uploads/');
            } else if (!avUrl.startsWith('http')) {
              avUrl = avUrl.startsWith('/') ? BASE_URL + avUrl : `${BASE_URL}/${avUrl}`;
            }
          }

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
          const localLocation = await AsyncStorage.getItem(`healthai_location_${userKey}`);

          if (localPhone && !data.phone) setPhoneNumber(localPhone);
          if (localHeight && !data.height) setHeight(localHeight);
          if (localWeight && !data.weight) setWeight(localWeight);
          if (localLocation && !data.location) setLocation(localLocation);

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
            gender: gender,
            location: location.trim(),
            address: location.trim(),
            blood_type: bloodGroup,
            height: height ? Number(height) || height : null,
            weight: weight ? Number(weight) || weight : null,
          }),
        });
      }
      Alert.alert('Success', t('profile_updated') || 'Profile updated successfully.');

      // Cache locally for instant UI responsiveness
      try {
        const userKey = email.trim() || (isActualPhone(phoneNumber) ? phoneNumber.trim() : (isActualPhone(phone) ? phone! : 'guest'));
        await AsyncStorage.setItem(`healthai_profile_name_${userKey}`, name.trim());
        if (phoneNumber) await AsyncStorage.setItem(`healthai_phone_${userKey}`, phoneNumber.trim());
        if (location) await AsyncStorage.setItem(`healthai_location_${userKey}`, location.trim());
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

  // ── Avatar Picker & Upload (Preserved completely) ──────────────────────────
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
        setAvatarUrl(asset.uri);

        const userKey = email.trim() || (isActualPhone(phoneNumber) ? phoneNumber.trim() : (isActualPhone(phone) ? phone! : 'guest'));
        try {
          await AsyncStorage.setItem(`healthai_avatar_${userKey}`, asset.uri);
        } catch { /* ignore */ }

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

          let newAvatarUrl = response?.user?.avatar_url || response?.avatar_url || response?.image_url || response?.profile_image || response?.user?.image_url || response?.user?.profile_image || response?.url || response?.file_url;
          
          if (newAvatarUrl) {
            if (newAvatarUrl.includes('.smartncode.com/uploads/')) {
              newAvatarUrl = newAvatarUrl.replace('.smartncode.com/uploads/', '.smartncode.com/api/uploads/');
            } else if (!newAvatarUrl.startsWith('http')) {
              newAvatarUrl = newAvatarUrl.startsWith('/') ? BASE_URL + newAvatarUrl : `${BASE_URL}/${newAvatarUrl}`;
            }
            
            setAvatarUrl(newAvatarUrl);
            setImageLoadError(false);
            await AsyncStorage.setItem(`healthai_avatar_${userKey}`, newAvatarUrl);
            Alert.alert('Success', 'Profile photo updated and saved on server!');
          } else {
            try {
              const freshProfile = await api.request<any>(ENDPOINTS.profileMePath);
              const freshData = freshProfile?.user ?? freshProfile;
              let freshUrl = freshData?.avatar_url ?? freshData?.image_url ?? freshData?.profile_image;
              if (freshUrl) {
                if (freshUrl.includes('.smartncode.com/uploads/')) {
                  freshUrl = freshUrl.replace('.smartncode.com/uploads/', '.smartncode.com/api/uploads/');
                } else if (!freshUrl.startsWith('http')) {
                  freshUrl = freshUrl.startsWith('/') ? BASE_URL + freshUrl : `${BASE_URL}/${freshUrl}`;
                }
                setAvatarUrl(freshUrl);
                setImageLoadError(false);
                await AsyncStorage.setItem(`healthai_avatar_${userKey}`, freshUrl);
                Alert.alert('Success', 'Profile photo updated successfully!');
                return;
              }
            } catch (freshErr) {
              console.warn('[Account] Fresh profile fetch error:', freshErr);
            }
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
      {/* ── Topbar matching Prototype v2 (scr-personalinfo) ── */}
      <View style={styles.topbar}>
        <View style={[styles.backrow, { flexDirection: rowDirection }]}>
          <Pressable
            style={styles.iconbtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={Colors.text} />
          </Pressable>
          <Text style={[styles.title, { textAlign }]}>{t('account_info')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Profile Photo Field (DO NOT TOUCH - 100% Intact) ── */}
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
                    onError={() => {
                      if (localAvatarUri && avatarUrl !== localAvatarUri) {
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
              style={[styles.changePhotoBtn, { flexDirection: rowDirection }]}
              onPress={handlePickImage}
              disabled={uploadingAvatar}
              hitSlop={8}
            >
              <Ionicons name="image-outline" size={15} color={Colors.primary} />
              <Text style={styles.changePhotoText}>
                {uploadingAvatar ? t('uploading_photo') : t('change_photo')}
              </Text>
            </Pressable>
          </View>

          {/* ══════════════════════════════════════════════════════════
              FROM FULL NAME DOWN — EXACT PROTOTYPE V2 LAYOUT (scr-personalinfo)
             ══════════════════════════════════════════════════════════ */}

          {/* 1. Full name */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { textAlign }]}>{t('full_name')}</Text>
            <TextInput
              style={[styles.input, { textAlign }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Arjun Kumar"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>

          {/* 2. Mobile number */}
          <View style={styles.fieldBlock}>
            <View style={[styles.labelRow, { flexDirection: rowDirection }]}>
              <Text style={[styles.fieldLabel, { textAlign, marginBottom: 0 }]}>{t('mobile_number')}</Text>
              {isActualPhone(phone) && (
                <View style={styles.lockedPill}>
                  <Ionicons name="lock-closed" size={10} color="#6B756F" />
                  <Text style={styles.lockedPillText}>{t('primary_login')}</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[styles.input, isActualPhone(phone) && styles.inputLocked, { textAlign }]}
              value={isActualPhone(phone) ? (phone ?? '') : phoneNumber}
              onChangeText={setPhoneNumber}
              editable={!isActualPhone(phone)}
              placeholder="+91 98765 43210"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>

          {/* 3. Email */}
          <View style={styles.fieldBlock}>
            <View style={[styles.labelRow, { flexDirection: rowDirection }]}>
              <Text style={[styles.fieldLabel, { textAlign, marginBottom: 0 }]}>{t('email')}</Text>
              {isActualEmail(phone) && (
                <View style={styles.lockedPill}>
                  <Ionicons name="lock-closed" size={10} color="#6B756F" />
                  <Text style={styles.lockedPillText}>{t('primary_login')}</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[styles.input, isActualEmail(phone) && styles.inputLocked, { textAlign }]}
              value={isActualEmail(phone) ? (phone ?? '') : email}
              onChangeText={setEmail}
              editable={!isActualEmail(phone)}
              placeholder="arjunkumar@gmail.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* 4. Grid 2: Date of birth & Gender */}
          <View style={[styles.grid2, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1 }}>
              <DatePickerField
                label={t('date_of_birth')}
                value={dob}
                onChange={setDob}
                maximumDate={new Date()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { textAlign }]}>{t('gender')}</Text>
              <Pressable
                style={[styles.selectBox, { flexDirection: rowDirection }]}
                onPress={() => setShowGenderModal(true)}
              >
                <Text style={[styles.selectText, { textAlign }]}>
                  {gender === 'Male' ? t('gender_male') : gender === 'Female' ? t('gender_female') : gender}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B756F" />
              </Pressable>
            </View>
          </View>

          {/* 5. Location */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { textAlign }]}>{t('location')}</Text>
            <TextInput
              style={[styles.input, { textAlign }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Hyderabad, Telangana, India"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* 6. Blood group (Option selection like Gender) */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { textAlign }]}>{t('blood_group')}</Text>
            <Pressable
              style={[styles.selectBox, { flexDirection: rowDirection }]}
              onPress={() => setShowBloodGroupModal(true)}
            >
              <Text style={[styles.selectText, { textAlign }]}>
                {bloodGroup || 'Select Blood Group'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B756F" />
            </Pressable>
          </View>

          {/* Dedicated Row: My Blood Group Contacts (without arrow) */}
          <Pressable
            style={[styles.bloodContactsCard, { flexDirection: rowDirection }]}
            onPress={() => router.push({ pathname: '/blood-group-contacts', params: { bloodGroup } })}
          >
            <View style={styles.bloodContactsIconWrap}>
              <Ionicons name="water" size={18} color="#DC2626" />
            </View>
            <View style={{ flex: 1, paddingHorizontal: 4 }}>
              <Text style={[styles.bloodContactsTitle, { textAlign }]}>
                {t('blood_group_contacts')}
              </Text>
              <Text style={[styles.bloodContactsSub, { textAlign }]}>
                {t('blood_group_contacts_sub')}
              </Text>
            </View>
          </Pressable>

          {/* 7. Grid 2: Height & Weight */}
          <View style={[styles.grid2, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { textAlign }]}>{t('height_cm')}</Text>
              <TextInput
                style={[styles.input, { textAlign }]}
                value={height}
                onChangeText={setHeight}
                placeholder="e.g. 175"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { textAlign }]}>{t('weight_kg')}</Text>
              <TextInput
                style={[styles.input, { textAlign }]}
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 70"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 6. Save changes Button (matching Prototype v2 .btn) */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              pressed && { opacity: 0.85 },
              saving && styles.btnDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnText}>{t('save_changes')}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Gender Selection Modal ── */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGenderModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('gender')}</Text>
            {GENDERS.map((g) => {
              const isSelected = gender === g;
              const displayLabel = g === 'Male' ? t('gender_male') : g === 'Female' ? t('gender_female') : g;
              return (
                <Pressable
                  key={g}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  onPress={() => {
                    setGender(g);
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                    {displayLabel}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* ── Blood Group Selection Modal (similar to Gender) ── */}
      <Modal
        visible={showBloodGroupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBloodGroupModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowBloodGroupModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('blood_group')}</Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = bloodGroup === bg;
                return (
                  <Pressable
                    key={bg}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      setBloodGroup(bg);
                      setShowBloodGroupModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {bg}
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
    gap: 12,
    paddingBottom: 40,
  },

  // ── Avatar Styles (Preserved) ──
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  avatarTouch: {
    position: 'relative',
    borderRadius: 44,
  },
  avatarPressed: {
    opacity: 0.8,
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
    backgroundColor: Colors.primary + '12',
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // ── Prototype v2 Form Fields ──
  fieldBlock: {
    gap: 4,
  },
  labelRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B756F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  subFieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6B756F',
    marginBottom: 6,
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
  inputLocked: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedPillText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },

  // ── Grid 2 ──
  grid2: {
    gap: 12,
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

  // ── Health Metrics Card ──
  healthMetricsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  metricsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2B2A',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E8E6',
    backgroundColor: '#F8FAFC',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12.5,
    color: '#1A2B2A',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  // ── Save Button matching Prototype v2 .btn ──
  btn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  bloodContactsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  bloodContactsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodContactsTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  bloodContactsSub: {
    fontSize: 11.5,
    color: '#6B756F',
    marginTop: 2,
    lineHeight: 16,
  },
  bloodContactsArrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E1F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});