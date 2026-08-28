/**
 * AddMemberForm.tsx — Add Family Member
 * Step 1: Basic Info | Step 2: Permissions (invite method options)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Colors, Radius } from '@/constants/Colors';
import { DropdownField } from '@/components/ui/DropdownField';

const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Husband',
  'Wife',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Other',
];

const GENDERS = ['Male', 'Female', 'Other'] as const;

const STEPS = [
  { n: 1, label: 'Basic Info' },
  { n: 2, label: 'Permissions' },
] as const;

const INVITE_OPTIONS = [
  {
    icon: 'phone-portrait-outline' as const,
    label: 'Invite via Mobile Number',
    sub: 'Send invitation on mobile',
    bg: '#E8F9F0',
    color: '#25D366',
    channel: 'sms',
  },
  {
    icon: 'mail-outline' as const,
    label: 'Invite via Email',
    sub: 'Send invitation on email',
    bg: '#E8F0FF',
    color: '#007AFF',
    channel: 'email',
  },
  {
    icon: 'link-outline' as const,
    label: 'Share Invite Link',
    sub: 'Share link via any app',
    bg: '#F0EAFF',
    color: '#8B5CF6',
    channel: 'link',
  },
  {
    icon: 'qr-code-outline' as const,
    label: 'Share QR Code',
    sub: 'Generate and share QR',
    bg: '#FEF9E8',
    color: '#F59E0B',
    channel: 'qr',
  },
];

export interface AddMemberFormData {
  relationship: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
  gender?: string;
  channel: string;
}

interface Props {
  step: 1 | 2;
  onStepChange: (step: 1 | 2) => void;
  onInvite: (data: AddMemberFormData) => void;
}

function formatDobDisplay(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function AddMemberForm({ step, onStepChange, onInvite }: Props) {
  const [name, setName] = useState('');
  const [rel, setRel] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState<(typeof GENDERS)[number]>('Male');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [dobOpen, setDobOpen] = useState(false);
  const [saved, setSaved] = useState<Omit<AddMemberFormData, 'channel'> | null>(null);

  const canContinue =
    name.trim().length > 0 &&
    !!rel &&
    phone.trim().length >= 10 &&
    consent;

  const isMinor = rel === 'Son' || rel === 'Daughter';
  const consentText = isMinor
    ? 'I confirm I am the legal parent/guardian of this minor and explicitly consent to HealthAI processing their health data.'
    : 'I confirm I have explicit consent from this individual to manage and process their health records on their behalf.';

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to add a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleDobChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setDobOpen(false);
    if (selected) setDob(selected);
  };

  const handleContinue = () => {
    if (!canContinue || !rel) return;
    const date_of_birth = dob
      ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`
      : '';
    const data = {
      relationship: rel,
      full_name: name.trim(),
      phone: phone.trim(),
      date_of_birth,
      gender,
    };
    setSaved(data);
    onStepChange(2);
  };

  const handleInvite = (channel: string) => {
    if (!saved) return;
    onInvite({ ...saved, channel });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((s, i) => {
          const active = s.n === step;
          const done = s.n < step;
          return (
            <React.Fragment key={s.n}>
              {i > 0 && (
                <View style={[styles.stepLine, (active || done) && styles.stepLineDone]} />
              )}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    (active || done) && styles.stepCircleActive,
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNum, active && styles.stepNumActive]}>{s.n}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, (active || done) && styles.stepLabelActive]}>
                  {s.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {step === 1 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          <Text style={styles.cardSub}>Enter basic details of your family member</Text>

          <Pressable style={styles.photoWrap} onPress={pickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImg} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={22} color={Colors.primary} />
                <Text style={styles.photoTxt}>Add Photo</Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.inp}
            placeholder="Enter full name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Mobile Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryTxt}>+91</Text>
            </View>
            <TextInput
              style={[styles.inp, styles.phoneInp]}
              placeholder="Enter mobile number"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
            />
          </View>

          <View style={styles.fieldBlock}>
            <DropdownField
              label="Relationship"
              value={rel}
              options={RELATIONSHIPS}
              onChange={setRel}
              placeholder="Select relationship"
            />
          </View>

          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <Pressable style={styles.inpRow} onPress={() => setDobOpen(true)}>
            <Text style={[styles.inpText, !dob && styles.placeholder]}>
              {dob ? formatDobDisplay(dob) : 'DD MMM YYYY'}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
          </Pressable>

          {Platform.OS === 'android' && dobOpen && (
            <DateTimePicker
              mode="date"
              display="calendar"
              value={dob ?? new Date(2000, 0, 1)}
              maximumDate={new Date()}
              onChange={handleDobChange}
            />
          )}

          {Platform.OS === 'ios' && (
            <Modal transparent animationType="slide" visible={dobOpen}>
              <Pressable style={styles.backdrop} onPress={() => setDobOpen(false)} />
              <View style={styles.sheet}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Date of Birth</Text>
                  <Pressable onPress={() => setDobOpen(false)}>
                    <Text style={styles.doneBtn}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  value={dob ?? new Date(2000, 0, 1)}
                  maximumDate={new Date()}
                  onChange={handleDobChange}
                  style={{ height: 200 }}
                />
              </View>
            </Modal>
          )}

          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => {
              const selected = gender === g;
              return (
                <Pressable
                  key={g}
                  style={[styles.genderChip, selected && styles.genderChipSel]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderTxt, selected && styles.genderTxtSel]}>{g}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.checkboxRow} onPress={() => setConsent(!consent)}>
            <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
              {consent && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>{consentText}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              !canContinue && styles.btnDisabled,
              pressed && canContinue && { opacity: 0.9 },
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.btnTxt}>Continue</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.inviteWrap}>
          <Text style={styles.inviteHeading}>How would you like to invite?</Text>
          <Text style={styles.inviteSub}>Choose your preferred method</Text>

          {INVITE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.channel}
              style={({ pressed }) => [styles.optCard, pressed && { backgroundColor: '#F5FDF9' }]}
              onPress={() => handleInvite(opt.channel)}
            >
              <View style={[styles.optIcon, { backgroundColor: opt.bg }]}>
                <Ionicons name={opt.icon} size={22} color={opt.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optLabel}>{opt.label}</Text>
                <Text style={styles.optSub}>{opt.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.dots}>
        <View style={[styles.dot, step === 1 && styles.dotActive]} />
        <View style={[styles.dot, step === 2 && styles.dotActive]} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  stepItem: { alignItems: 'center', width: 90 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepNum: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  stepNumActive: { color: '#fff' },
  stepLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: { color: Colors.primary },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 13,
    marginHorizontal: -4,
  },
  stepLineDone: { backgroundColor: Colors.primary },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  cardSub: { marginTop: 4, fontSize: 13, color: Colors.textMuted, marginBottom: 18 },

  photoWrap: { alignSelf: 'center', marginBottom: 18 },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoImg: { width: 88, height: 88, borderRadius: 44 },
  photoTxt: { fontSize: 11, fontWeight: '600', color: Colors.primary },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  fieldBlock: { marginBottom: 4 },
  inp: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  countryCode: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryTxt: { fontSize: 14, fontWeight: '600', color: Colors.text },
  phoneInp: { flex: 1, marginBottom: 0 },
  inpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
  },
  inpText: { fontSize: 14, color: Colors.text },
  placeholder: { color: Colors.textMuted },

  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  genderChipSel: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDFA',
  },
  genderTxt: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  genderTxtSel: { color: Colors.primary },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    fontWeight: '500',
  },

  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  btnDisabled: { opacity: 0.45 },
  btnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  inviteWrap: { paddingTop: 4 },
  inviteHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  inviteSub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  optCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  optLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  optSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: { backgroundColor: Colors.primary, width: 16 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  doneBtn: { fontSize: 15, fontWeight: '700', color: Colors.primary },
});
