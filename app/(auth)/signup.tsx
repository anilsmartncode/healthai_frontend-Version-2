import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  useWindowDimensions,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, ClipPath, Rect, Defs } from "react-native-svg";
import { useLang } from "@/context/Languagecontext";
import { useAuth } from "@/context/AuthContext";
import { firebaseLoginApi } from "@/services/authapi/apiService";
import { signInWithGoogle } from "@/utils/googleAuth";
import { signInWithApple } from "@/utils/appleAuth";
import * as AppleAuthentication from 'expo-apple-authentication';
import { getLocalizedAuthError } from "@/utils/errorLocalization";
import { COUNTRIES, CountryConfig } from "@/constants/countries";
// Lazy-load Firebase Auth so the page still opens in Expo Go
function getAuth() {
  const mod = require('@react-native-firebase/auth');
  return (mod.default || mod)();
}

// ── Real OAuth imports (uncomment when libraries are installed) ──
// import * as Google from "expo-auth-session/providers/google";
// import * as AppleAuthentication from "expo-apple-authentication";
// import * as WebBrowser from "expo-web-browser";
// WebBrowser.maybeCompleteAuthSession();

// ── Mock account data ─────────────────────────────────
// 🟢 MOCK ONLY — delete MOCK_GOOGLE_ACCOUNTS & MOCK_APPLE_ACCOUNTS when integrating real SDK
const MOCK_GOOGLE_ACCOUNTS = [
  { email: "john.doe@gmail.com",       name: "John Doe",   initials: "JD" },
  { email: "sarah.smith@gmail.com",    name: "Sarah Smith",initials: "SS" },
  { email: "test.user@googlemail.com", name: "Test User",  initials: "TU" },
];

const MOCK_APPLE_ACCOUNTS = [
  { email: "john.doe@icloud.com",            name: "John Doe", initials: "JD" },
  { email: "j.doe@privaterelay.appleid.com", name: "J. Doe",   initials: "JD" },
];

// ── Scalers (matching Phonesignup pattern) ─────────────
function useScalers() {
  const { width: SW, height: SH } = useWindowDimensions();
  const rs = (n: number) => (SW / 390) * n;
  const vs = (n: number) => (SH / 844) * n;
  const ms = (n: number, f = 0.45) => n + (rs(n) - n) * f;
  return { rs, vs, ms, SW, SH };
}

// ── Google Icon ───────────────────────────────────────
function GoogleIcon() {
  const { ms } = useScalers();
  return (
    <Svg width={ms(20)} height={ms(20)} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="clipG">
          <Rect width={48} height={48} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clipG)">
        <Path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.2z" />
        <Path fill="#34A853" d="M24 48c6.5 0 12-2.2 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.7 14.7 48 24 48z" />
        <Path fill="#FBBC05" d="M10.6 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6v-6.2H2.5C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l8.1-6.2z" />
        <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.2 30.4 0 24 0 14.7 0 6.5 5.3 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z" />
      </G>
    </Svg>
  );
}



// ── Mock Account Picker ───────────────────────────────
// 🟢 MOCK ONLY — delete this entire component when integrating real SDK
function MockAccountPicker({
  visible,
  type,
  onSelect,
  onClose,
}: {
  visible: boolean;
  type: "google" | "apple" | null;
  onSelect: (email: string) => void;
  onClose: () => void;
}) {
  const { rs, vs, ms } = useScalers();
  const isGoogle   = type === "google";
  const accounts   = isGoogle ? MOCK_GOOGLE_ACCOUNTS : MOCK_APPLE_ACCOUNTS;
  const brandColor = isGoogle ? "#4285F4" : "#1a1a1a";
  const brandName  = isGoogle ? "Google"  : "Apple";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}
        onPress={onClose}
      >
        <View
          style={{
            width: "88%",
            backgroundColor: "#fff",
            borderRadius: rs(20),
            overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View style={{
            backgroundColor: brandColor,
            paddingVertical: vs(16),
            paddingHorizontal: rs(20),
            flexDirection: "row",
            alignItems: "center",
            gap: rs(10),
          }}>
            {isGoogle ? <GoogleIcon /> : <Ionicons name="logo-apple" size={16} color="#1a2e35" />}
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: ms(15), fontWeight: "800" }}>
                Sign up with {brandName}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: ms(11), marginTop: vs(2) }}>
                Choose an account to continue
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={ms(20)} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>

          {/* Account list */}
          {accounts.map((acc, i) => (
            <Pressable
              key={acc.email}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: rs(14),
                paddingVertical: vs(14),
                paddingHorizontal: rs(20),
                backgroundColor: pressed ? "rgba(0,0,0,0.04)" : "#fff",
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: "#F0F0F0",
              })}
              onPress={() => onSelect(acc.email)}
            >
              {/* Avatar */}
              <View style={{
                width: rs(40),
                height: rs(40),
                borderRadius: rs(20),
                backgroundColor: brandColor,
                justifyContent: "center",
                alignItems: "center",
              }}>
                <Text style={{ color: "#fff", fontSize: ms(14), fontWeight: "700" }}>
                  {acc.initials}
                </Text>
              </View>
              {/* Name + email */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: ms(14), fontWeight: "600", color: "#1a2e35" }}>{acc.name}</Text>
                <Text style={{ fontSize: ms(12), color: "#8aabab", marginTop: vs(1) }}>{acc.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(14)} color="#ccc" />
            </Pressable>
          ))}

          {/* Footer */}
          <View style={{ borderTopWidth: 1, borderTopColor: "#F0F0F0", padding: rs(14), alignItems: "center" }}>
            <Text style={{ fontSize: ms(11), color: "#b0bec5", fontWeight: "500" }}>
              🟢 Mock picker — replace with real Apple SDK
            </Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────
export default function SignUp() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const { signIn, signInAsGuestSession } = useAuth();
  const { rs, vs, ms } = useScalers();

  // ── Segment: "phone" | "email" ──
  const [activeTab, setActiveTab] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"input" | "otp">("input");

  // Email form state
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone form state
  const [phone, setPhone]           = useState("");
  const [country, setCountry]       = useState<CountryConfig>(COUNTRIES[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [otp, setOtp]               = useState("");
  const [confirm, setConfirm]       = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(60);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDPDP, setAgreedToDPDP]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    phone?: string;
    otp?: string;
    terms?: string;
    dpdp?: string;
  }>({});

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const fullNumber = `${country.dial}${phone}`;

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const pwChecks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    numOrSym:  /[0-9!@#$%^&*]/.test(password),
  };

  const validateConsent = (): boolean => {
    const next: typeof errors = {};
    if (!agreedToTerms)
      next.terms = t("err_terms_required");
    if (!agreedToDPDP)
      next.dpdp = t("err_consent_required");
    setErrors((p) => ({ ...p, ...next }));
    return Object.keys(next).length === 0;
  };

  // ── Phone: Send OTP for Signup ──
  const handlePhoneSignUp = async () => {
    const rawDigits = phone.replace(/\D/g, "");
    if (!phone.trim() || rawDigits.length < 7) {
      setErrors((p) => ({ ...p, phone: t("err_invalid_phone") }));
      return;
    }
    if (!validateConsent()) return;

    try {
      setLoading(true);
      setErrors({});
      await getAuth().signInWithPhoneNumber(fullNumber);
      router.push({
        pathname: "/(auth)/otp-verify",
        params: {
          phone: fullNumber,
          flag: country.flag,
          mode: "signup",
        },
      });
    } catch (e: any) {
      setErrors({ phone: getLocalizedAuthError(e, "err_failed_send_otp", t) });
    } finally {
      setLoading(false);
    }
  };

  // ── Phone: Verify OTP for Signup ──
  const handleVerifyOtp = async () => {
    if (otp.trim().length < 6) {
      setErrors({ otp: t("err_enter_code") });
      return;
    }
    try {
      setLoading(true);
      setErrors({});
      const userCredential = await confirm.confirm(otp.trim());
      const idToken = await userCredential.user.getIdToken();
      const data = await firebaseLoginApi(idToken);
      if (data?.token) {
        await signIn(data.token, fullNumber, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
        router.replace("/(auth)/PersonOnboardingScreen");
      } else {
        setErrors({ otp: getLocalizedAuthError(data?.message, "err_network", t) });
      }
    } catch (e: any) {
      setErrors({ otp: getLocalizedAuthError(e, "err_invalid_or_expired_code", t) });
    } finally {
      setLoading(false);
    }
  };

  // ── Email/Password Sign Up ──
  const handleEmailSignUp = async () => {
    const next: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = t("err_invalid_email");
    if (!password || password.length < 8)
      next.password = t("err_pw_min_length");
    if (!agreedToTerms)
      next.terms = t("err_terms_required");
    if (!agreedToDPDP)
      next.dpdp = t("err_consent_required");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      setLoading(true);
      const userCredential = await getAuth().createUserWithEmailAndPassword(email, password);
      await userCredential.user.sendEmailVerification();
      const idToken = await userCredential.user.getIdToken();
      const data = await firebaseLoginApi(idToken);
      if (data?.token) {
        await signIn(data.token, email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
        router.replace({ pathname: "/(auth)/email-verify", params: { email } });
      } else {
        setErrors({ email: getLocalizedAuthError(data?.message, "err_network", t) });
      }
    } catch (error: any) {
      setErrors({ email: getLocalizedAuthError(error, "err_network", t) });
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign Up ──
  const handleGoogleSignUp = async () => {
    Keyboard.dismiss();
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result.success && result.idToken) {
        const data = await firebaseLoginApi(result.idToken);
        if (data?.token) {
          await signIn(data.token, data.email || result.user?.email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
          router.replace("/(auth)/PersonOnboardingScreen");
        } else {
          setErrors({ email: getLocalizedAuthError(data?.message, "err_network", t) });
        }
      } else if (!result.success && result.error !== 'Sign-in cancelled') {
        setErrors({ email: getLocalizedAuthError(result.error, "err_generic", t) });
      }
    } catch (error: any) {
      setErrors({ email: getLocalizedAuthError(error, "err_generic", t) });
    } finally {
      setLoading(false);
    }
  };

  // ── Apple Sign Up ──
  const handleAppleSignUp = async () => {
    Keyboard.dismiss();
    try {
      setLoading(true);
      setErrors({});
      const result = await signInWithApple();
      if (!result) {
        setLoading(false);
        return;
      }
      const data = await firebaseLoginApi(result.idToken);
      if (data?.token) {
        await signIn(data.token, data.email || result.user.email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
        router.replace("/(auth)/PersonOnboardingScreen");
      } else {
        setErrors({ email: getLocalizedAuthError(data?.message, "err_network", t) });
      }
    } catch (error: any) {
      console.error("Apple sign-in error:", error);
      setErrors({ email: getLocalizedAuthError(error, "err_generic", t) });
    } finally {
      setLoading(false);
    }
  };

  // ── Guest Sign Up ──
  const handleGuestSignUp = async () => {
    Keyboard.dismiss();
    try {
      setLoading(true);
      setErrors({});
      const { signInAsGuest } = await import('@/utils/guestAuth');
      const result = await signInAsGuest();
      if (result.success) {
        await signInAsGuestSession(result.idToken, result.uid);
        router.replace('/(tabs)/home');
      } else {
        setErrors({ email: getLocalizedAuthError(result.error, 'err_generic', t) });
      }
    } catch (error: any) {
      console.warn('[SignUp] Guest sign in failed:', error);
      setErrors({ email: getLocalizedAuthError(error, 'err_generic', t) });
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(rs, vs, ms);

  return (
    <View style={styles.container}>
      {/* ── Topbar matching Prototype v2 ── */}
      <View style={styles.topbar}>
        <View style={[styles.backrow, { flexDirection: rowDirection }]}>
          <Pressable
            style={styles.iconbtn}
            onPress={() => {
              if (step === "otp") {
                setStep("input");
              } else {
                router.back();
              }
            }}
            hitSlop={10}
          >
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color="#1A2B2A" />
          </Pressable>
          <Text style={[styles.topbarTitle, { textAlign }]}>
            {step === "otp" ? (t("verify_otp") || "Verify OTP") : t("sign_up")}
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 100}
      >
        {/* ── Main Signup Form with Segment Switch (Prototype v2 style) ── */}
        {/* ── Segment Toggle: Phone | Email ── */}
            <View style={styles.segment}>
              <Pressable
                style={[styles.segOpt, activeTab === "phone" && styles.segOptActive]}
                onPress={() => { setActiveTab("phone"); setErrors({}); }}
              >
                <Text style={[styles.segOptText, activeTab === "phone" && styles.segOptTextActive]}>
                  Phone
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segOpt, activeTab === "email" && styles.segOptActive]}
                onPress={() => { setActiveTab("email"); setErrors({}); }}
              >
                <Text style={[styles.segOptText, activeTab === "email" && styles.segOptTextActive]}>
                  Email
                </Text>
              </Pressable>
            </View>

            {activeTab === "phone" ? (
              /* ── 1. Phone Signup Tab ── */
              <View style={{ gap: vs(14) }}>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign }]}>{t("mobile_number")}</Text>
                  <View style={[
                    styles.inputRow,
                    { flexDirection: rowDirection },
                    !!errors.phone && styles.inputError,
                    focusedField === "phone" && styles.inputFocused,
                  ]}>
                    <Pressable
                      style={styles.dialPickerBtn}
                      onPress={() => setPickerVisible(true)}
                    >
                      <Text style={styles.flagText}>{country.flag}</Text>
                      <Text style={styles.dialText}>{country.dial}</Text>
                      <Ionicons name="chevron-down" size={ms(12)} color="#6B756F" />
                    </Pressable>
                    <View style={styles.dialDivider} />

                    <TextInput
                      style={[styles.inputField, { textAlign }]}
                      placeholder="98765 43210"
                      placeholderTextColor="#A0ABA7"
                      value={phone}
                      onChangeText={(v) => { setPhone(v.replace(/\D/g, "")); clearError("phone"); }}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="phone-pad"
                      maxLength={14}
                    />
                  </View>
                  {!!errors.phone && (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle-outline" size={ms(13)} color="#A32D2D" />
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    </View>
                  )}
                </View>

                {/* Terms checkbox */}
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => { setAgreedToTerms((v) => !v); clearError("terms"); }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreedToTerms }}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked, !!errors.terms && styles.checkboxError]}>
                    {agreedToTerms && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to the{" "}
                    <Text style={styles.termsLink} onPress={() => router.push("/(auth)/terms")}>
                      Terms & Conditions
                    </Text>{" "}
                    and{" "}
                    <Text style={styles.termsLink} onPress={() => router.push("/privacy")}>
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </Pressable>
                {!!errors.terms && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#A32D2D" />
                    <Text style={styles.errorText}>{errors.terms}</Text>
                  </View>
                )}

                {/* DPDP Consent checkbox */}
                <Pressable
                  style={[styles.checkboxRow, { marginTop: 4 }]}
                  onPress={() => { setAgreedToDPDP((v) => !v); clearError("dpdp"); }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreedToDPDP }}
                >
                  <View style={[styles.checkbox, agreedToDPDP && styles.checkboxChecked, !!errors.dpdp && styles.checkboxError]}>
                    {agreedToDPDP && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I explicitly consent to HealthAI storing and processing my personal and health data for the purpose of generating medical insights using AI, as detailed in the Privacy Policy.
                  </Text>
                </Pressable>
                {!!errors.dpdp && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#A32D2D" />
                    <Text style={styles.errorText}>{errors.dpdp}</Text>
                  </View>
                )}

                {/* Send OTP Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.btnPrimary,
                    pressed && !loading && { opacity: 0.88 },
                    loading && styles.btnDisabled,
                  ]}
                  onPress={handlePhoneSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>{t("send_otp")}</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              /* ── 2. Email Signup Tab ── */
              <View style={{ gap: vs(14) }}>
                {/* Email Address */}
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign }]}>{t("email_address")}</Text>
                  <View style={[
                    styles.inputRow,
                    { flexDirection: rowDirection },
                    !!errors.email && styles.inputError,
                    focusedField === "email" && styles.inputFocused,
                  ]}>
                    <Ionicons name="mail-outline" size={18} color={focusedField === "email" ? "#0F6E56" : "#8A9995"} />
                    <TextInput
                      style={[styles.inputField, { textAlign }]}
                      placeholder={t("enter_email")}
                      placeholderTextColor="#A0ABA7"
                      value={email}
                      onChangeText={(v) => { setEmail(v); clearError("email"); }}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {!!errors.email && (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle-outline" size={13} color="#A32D2D" />
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                  )}
                </View>

                {/* Password */}
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign }]}>{t("password")}</Text>
                  <View style={[
                    styles.inputRow,
                    { flexDirection: rowDirection },
                    !!errors.password && styles.inputError,
                    focusedField === "password" && styles.inputFocused,
                  ]}>
                    <Ionicons name="lock-closed-outline" size={18} color={focusedField === "password" ? "#0F6E56" : "#8A9995"} />
                    <TextInput
                      style={[styles.inputField, { textAlign }]}
                      placeholder={t("enter_password")}
                      placeholderTextColor="#A0ABA7"
                      value={password}
                      onChangeText={(v) => { setPassword(v); clearError("password"); }}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <Pressable onPress={() => setShowPassword((p) => !p)}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color="#8A9995"
                      />
                    </Pressable>
                  </View>
                  {!!errors.password && (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle-outline" size={13} color="#A32D2D" />
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                  )}

                  {/* Password strength hints */}
                  {password.length > 0 && (
                    <View style={styles.pwHints}>
                      <View style={styles.pwHintRow}>
                        <Ionicons
                          name={pwChecks.length ? "checkmark-circle" : "ellipse-outline"}
                          size={14}
                          color={pwChecks.length ? "#0F6E56" : "#A0ABA7"}
                        />
                        <Text style={[styles.pwHintText, pwChecks.length && styles.pwHintDone]}>
                          At least 8 characters
                        </Text>
                      </View>
                      <View style={styles.pwHintRow}>
                        <Ionicons
                          name={pwChecks.uppercase ? "checkmark-circle" : "ellipse-outline"}
                          size={14}
                          color={pwChecks.uppercase ? "#0F6E56" : "#A0ABA7"}
                        />
                        <Text style={[styles.pwHintText, pwChecks.uppercase && styles.pwHintDone]}>
                          At least one uppercase letter
                        </Text>
                      </View>
                      <View style={styles.pwHintRow}>
                        <Ionicons
                          name={pwChecks.numOrSym ? "checkmark-circle" : "ellipse-outline"}
                          size={14}
                          color={pwChecks.numOrSym ? "#0F6E56" : "#A0ABA7"}
                        />
                        <Text style={[styles.pwHintText, pwChecks.numOrSym && styles.pwHintDone]}>
                          At least one number or symbol
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Terms checkbox */}
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => { setAgreedToTerms((v) => !v); clearError("terms"); }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreedToTerms }}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked, !!errors.terms && styles.checkboxError]}>
                    {agreedToTerms && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to the{" "}
                    <Text style={styles.termsLink} onPress={() => router.push("/(auth)/terms")}>
                      Terms & Conditions
                    </Text>{" "}
                    and{" "}
                    <Text style={styles.termsLink} onPress={() => router.push("/privacy")}>
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </Pressable>
                {!!errors.terms && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#A32D2D" />
                    <Text style={styles.errorText}>{errors.terms}</Text>
                  </View>
                )}

                {/* DPDP Consent checkbox */}
                <Pressable
                  style={[styles.checkboxRow, { marginTop: 4 }]}
                  onPress={() => { setAgreedToDPDP((v) => !v); clearError("dpdp"); }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreedToDPDP }}
                >
                  <View style={[styles.checkbox, agreedToDPDP && styles.checkboxChecked, !!errors.dpdp && styles.checkboxError]}>
                    {agreedToDPDP && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I explicitly consent to HealthAI storing and processing my personal and health data for the purpose of generating medical insights using AI, as detailed in the Privacy Policy.
                  </Text>
                </Pressable>
                {!!errors.dpdp && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#A32D2D" />
                    <Text style={styles.errorText}>{errors.dpdp}</Text>
                  </View>
                )}

                {/* Create Account Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.btnPrimary,
                    pressed && !loading && { opacity: 0.88 },
                    loading && styles.btnDisabled,
                  ]}
                  onPress={handleEmailSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>{t("sign_up")}</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Divider ── */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>{t("or_continue")}</Text>
              <View style={styles.orLine} />
            </View>

            {/* ── Social & Guest Buttons Stacked One by One ── */}
            <View style={styles.socialStack}>
              <Pressable
                style={({ pressed }) => [styles.socialBtnStacked, pressed && { opacity: 0.85 }]}
                onPress={handleGoogleSignUp}
                disabled={loading}
              >
                <GoogleIcon />
                <Text style={styles.socialBtnTextStacked}>{t("google_signin") || "Continue with Google"}</Text>
              </Pressable>

              {Platform.OS === 'ios' ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                  cornerRadius={rs(12)}
                  style={{ width: '100%', height: vs(48) }}
                  onPress={handleAppleSignUp}
                />
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.socialBtnStacked, pressed && { opacity: 0.85 }]}
                  disabled={loading}
                  onPress={handleAppleSignUp}
                >
                  <Ionicons name="logo-apple" size={20} color="#1A2B2A" />
                  <Text style={styles.socialBtnTextStacked}>{t("apple_signin") || "Continue with Apple"}</Text>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [styles.socialBtnStacked, pressed && { opacity: 0.85 }]}
                onPress={handleGuestSignUp}
                disabled={loading}
              >
                <Ionicons name="person-circle-outline" size={20} color="#0F6E56" />
                <Text style={styles.socialBtnTextStacked}>{t("guest_signin") || "Continue as guest"}</Text>
              </Pressable>
            </View>

            {/* ── Already have account ── */}
            <View style={[styles.loginRow, { flexDirection: rowDirection }]}>
              <Text style={styles.loginText}>{t("have_account")} </Text>
              <Pressable onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.loginLink}>{t("login")}</Text>
              </Pressable>
            </View>
      </KeyboardAwareScrollView>

      {/* Country Picker Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>Select Country</Text>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={styles.countryRow}
                onPress={() => {
                  setCountry(item);
                  setPickerVisible(false);
                }}
              >
                <Text style={{ fontSize: ms(20) }}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDial}>{item.dial}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (
  rs: (n: number) => number,
  vs: (n: number) => number,
  ms: (n: number, f?: number) => number
) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F5" },

  topbar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: rs(18),
    paddingTop: Platform.OS === 'ios' ? vs(54) : vs(24),
    paddingBottom: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#E4E8E6",
  },
  backrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(12),
  },
  iconbtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    borderWidth: 1,
    borderColor: "#E4E8E6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  topbarTitle: {
    fontSize: ms(19),
    fontWeight: "700",
    color: "#1A2B2A",
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: rs(18),
    paddingTop: vs(20),
    paddingBottom: vs(40),
    gap: vs(16),
  },

  headerBlock: {
    marginBottom: vs(4),
  },
  welcomeTitle: {
    fontSize: ms(22),
    fontWeight: "700",
    color: "#1A2B2A",
    marginBottom: vs(4),
  },
  welcomeSub: {
    fontSize: ms(13),
    color: "#6B756F",
    lineHeight: ms(19),
  },

  socialStack: {
    gap: vs(10),
    marginTop: vs(2),
  },
  socialBtnStacked: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(10),
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#0F6E56",
    borderRadius: rs(12),
    paddingVertical: vs(13),
    paddingHorizontal: rs(16),
  },
  socialBtnTextStacked: {
    fontSize: ms(14),
    fontWeight: "700",
    color: "#0F6E56",
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
    marginVertical: vs(2),
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#E4E8E6" },
  orText: { fontSize: ms(11.5), color: "#6B756F", fontWeight: "500" },

  fieldWrap: { gap: vs(5) },
  fieldLabel: {
    fontSize: ms(12.5),
    fontWeight: "600",
    color: "#6B756F",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E4E8E6",
    borderRadius: rs(10),
    paddingHorizontal: rs(14),
    paddingVertical: vs(12),
    gap: rs(10),
  },
  inputError: { borderColor: "#A32D2D" },
  inputFocused: {
    borderColor: "#0F6E56",
  },
  inputField: {
    flex: 1,
    fontSize: ms(14),
    fontWeight: "500",
    color: "#1A2B2A",
    paddingVertical: 0,
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    marginTop: vs(2),
  },
  errorText: { fontSize: ms(11.5), color: "#A32D2D", fontWeight: "500", flex: 1 },

  usePhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: rs(3),
    marginTop: vs(4),
  },
  usePhoneText: { fontSize: ms(12), fontWeight: "600", color: "#0F6E56" },

  pwHints: { marginTop: vs(6), gap: vs(3) },
  pwHintRow: { flexDirection: "row", alignItems: "center", gap: rs(6) },
  pwHintText: { fontSize: ms(11), color: "#8A9995", fontWeight: "500" },
  pwHintDone: { color: "#0F6E56" },

  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: rs(10) },
  checkbox: {
    width: rs(18),
    height: rs(18),
    borderRadius: rs(5),
    borderWidth: 2,
    borderColor: "#D0E0E0",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(1),
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#0F6E56",
    borderColor: "#0F6E56",
  },
  checkboxError: { borderColor: "#A32D2D" },
  checkboxLabel: {
    flex: 1,
    fontSize: ms(12),
    color: "#6B756F",
    lineHeight: ms(17),
    fontWeight: "500",
  },
  termsLink: { color: "#0F6E56", fontWeight: "700" },

  btnPrimary: {
    backgroundColor: "#0F6E56",
    borderRadius: rs(12),
    paddingVertical: vs(14),
    alignItems: "center",
    marginTop: vs(6),
    shadowColor: "#0F6E56",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btnText: { color: "#FFFFFF", fontSize: ms(15), fontWeight: "700" },
  btnDisabled: { backgroundColor: "#8AB5AA", elevation: 0, shadowOpacity: 0 },

  segment: {
    flexDirection: "row",
    backgroundColor: "#EBEFEF",
    borderRadius: rs(10),
    padding: rs(3),
    marginBottom: vs(6),
  },
  segOpt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(9),
    borderRadius: rs(8),
  },
  segOptActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segOptText: {
    fontSize: ms(13),
    fontWeight: "600",
    color: "#6B756F",
  },
  segOptTextActive: {
    color: "#085041",
    fontWeight: "700",
  },

  dialPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    paddingRight: rs(8),
  },
  dialDivider: {
    width: 1,
    height: vs(18),
    backgroundColor: "#E4E8E6",
    marginRight: rs(4),
  },
  flagText: { fontSize: ms(18) },
  dialText: { fontSize: ms(13), fontWeight: "700", color: "#1A2B2A" },

  otpInputField: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#0F6E56",
    borderRadius: rs(10),
    fontSize: ms(24),
    fontWeight: "700",
    color: "#1A2B2A",
    textAlign: "center",
    paddingVertical: vs(12),
    letterSpacing: rs(8),
  },
  otpMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: vs(2),
  },
  resendTimerText: {
    fontSize: ms(12),
    color: "#6B756F",
    fontWeight: "500",
  },
  linkText: {
    fontSize: ms(12),
    color: "#0F6E56",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,20,18,0.45)",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: rs(20),
    borderTopRightRadius: rs(20),
    paddingHorizontal: rs(18),
    paddingTop: vs(14),
    paddingBottom: vs(34),
    maxHeight: "70%",
  },
  sheetHandle: {
    width: rs(36),
    height: vs(4),
    backgroundColor: "#E4E8E6",
    borderRadius: rs(4),
    alignSelf: "center",
    marginBottom: vs(12),
  },
  modalTitle: {
    fontSize: ms(16),
    fontWeight: "700",
    color: "#1A2B2A",
    marginBottom: vs(12),
    textAlign: "center",
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#E4E8E6",
    gap: rs(12),
  },
  countryName: {
    flex: 1,
    fontSize: ms(14),
    fontWeight: "500",
    color: "#1A2B2A",
  },
  countryDial: {
    fontSize: ms(13),
    fontWeight: "700",
    color: "#0F6E56",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(6),
  },
  loginText: { fontSize: ms(13), color: "#6B756F", fontWeight: "500" },
  loginLink: { fontSize: ms(13), color: "#0F6E56", fontWeight: "700" },
});