/**
 * app/family/invite-otp.tsx — Son-side: OTP Verification
 * ─────────────────────────────────────────────────────────────────────
 * Sends OTP to the son's phone, collects 4-digit code, then calls
 * acceptInvitation(invite_id, otp_code).
 * ─────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import { acceptInvitation } from '@/services/familyApi';
import auth from '@react-native-firebase/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

export default function InviteOtpScreen() {
  const insets = useSafeAreaInsets();
  const { invite_id, invited_by, relationship } =
    useLocalSearchParams<{ invite_id: string; invited_by: string; relationship: string }>();

  // OTP digits stored as a single string
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);   // sendOTP in progress
  const [verifying, setVerifying] = useState(false);   // acceptInvitation in progress
  const [cooldown, setCooldown] = useState(0);       // resend countdown
  const [otpSent, setOtpSent] = useState(false);
  const [phone, setPhone] = useState('');      // entered phone
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [confirmation, setConfirmation] = useState<any>(null);

  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setSending(true);
    try {
      const conf = await auth().signInWithPhoneNumber('+91' + phone);
      setConfirmation(conf);
      setOtpSent(true);
      setStep('otp');
      startCooldown();
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setSending(true);
    try {
      const conf = await auth().signInWithPhoneNumber('+91' + phone);
      setConfirmation(conf);
      startCooldown();
      setOtp('');
      Alert.alert('OTP Sent', 'A new OTP has been sent to your number.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not resend OTP.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH || !confirmation) return;
    setVerifying(true);
    try {
      await confirmation.confirm(otp);

      const idToken = await auth().currentUser?.getIdToken();
      if (!idToken) throw new Error("Could not retrieve secure token from Firebase");

      // We send the secure Firebase ID Token to the backend, NOT the 6-digit OTP
      const acceptRes = await acceptInvitation(invite_id ?? '', idToken);

      if (!acceptRes.success) throw new Error(acceptRes.message ?? 'Acceptance failed');

      router.replace({
        pathname: '/family/invite-success',
        params: { invited_by: invited_by ?? '', relationship: relationship ?? '' },
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Auto-verify when all digits are entered
  useEffect(() => {
    if (otp.length === OTP_LENGTH && step === 'otp') handleVerify();
  }, [otp]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <FamilyTopBar
          title="Verify Phone"
          onBack={() => (step === 'otp' ? setStep('phone') : router.back())}
        />

        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">

          {/* Context pill */}
          <View style={styles.contextPill}>
            <Ionicons name="people-outline" size={14} color={Colors.primary} />
            <Text style={styles.contextTxt}>
              Joining <Text style={styles.bold}>{invited_by}</Text>'s family as{' '}
              <Text style={styles.bold}>{relationship}</Text>
            </Text>
          </View>

          {step === 'phone' ? (
            <>
              <Text style={styles.heading}>Enter your phone number</Text>
              <Text style={styles.sub}>
                We'll send a one-time code to verify your identity.
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.dialCode}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && { opacity: 0.85 },
                  (sending || phone.replace(/\D/g, '').length < 10) && styles.btnDisabled,
                ]}
                onPress={handleSendOTP}
                disabled={sending || phone.replace(/\D/g, '').length < 10}
              >
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnTxt}>Send OTP</Text>
                }
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.heading}>Enter verification code</Text>
              <Text style={styles.sub}>
                We sent a {OTP_LENGTH}-digit code to{' '}
                <Text style={styles.bold}>+91 {phone}</Text>
              </Text>

              {/* Hidden text input drives the OTP boxes */}
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus
              />

              {/* OTP box display */}
              <Pressable style={styles.otpRow} onPress={() => inputRef.current?.focus()}>
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      otp[i] ? styles.otpBoxFilled : null,
                      i === otp.length && styles.otpBoxActive,
                    ]}
                  >
                    <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
                  </View>
                ))}
              </Pressable>

              {verifying && (
                <View style={styles.verifyRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.verifyTxt}>Verifying…</Text>
                </View>
              )}

              {/* Resend */}
              <Pressable
                style={[styles.resendBtn, (cooldown > 0 || sending) && { opacity: 0.4 }]}
                onPress={handleResend}
                disabled={cooldown > 0 || sending}
              >
                <Text style={styles.resendTxt}>
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.changePhone}
                onPress={() => { setStep('phone'); setOtp(''); }}
              >
                <Text style={styles.changePhoneTxt}>Change phone number</Text>
              </Pressable>
            </>
          )}



        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7F6' },
  page: { padding: 20, paddingBottom: 40 },

  contextPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F9F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'center', marginBottom: 24 },
  contextTxt: { fontSize: 12, color: Colors.primary },
  bold: { fontWeight: '700' },

  heading: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  sub: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 24 },

  // Phone step
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 16, overflow: 'hidden' },
  dialCode: { paddingHorizontal: 14, paddingVertical: 16, fontSize: 15, fontWeight: '600', color: Colors.text, borderRightWidth: 1, borderRightColor: Colors.border },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 16, fontSize: 16, color: Colors.text },

  // OTP step
  hiddenInput: { position: 'absolute', opacity: 0, height: 0 },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20 },
  otpBox: { width: 46, height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: '#F0FDF8' },
  otpBoxActive: { borderColor: Colors.primary, borderWidth: 2 },
  otpDigit: { fontSize: 22, fontWeight: '700', color: Colors.text },

  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 12 },
  verifyTxt: { fontSize: 13, color: Colors.primary },

  resendBtn: { alignItems: 'center', marginBottom: 10, paddingVertical: 8 },
  resendTxt: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  changePhone: { alignItems: 'center', paddingVertical: 6 },
  changePhoneTxt: { fontSize: 13, color: Colors.textMuted, textDecorationLine: 'underline' },

  btnPrimary: { backgroundColor: Colors.primary, borderRadius: 14, padding: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.45 },
  btnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  mockNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F0FF', borderRadius: 10, padding: 10, marginTop: 32 },
  mockTxt: { fontSize: 11, color: '#6D28D9' },
});
