import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, ClipPath, Rect, Defs } from "react-native-svg";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import { useAuth } from "@/context/AuthContext";
import * as AppleAuthentication from 'expo-apple-authentication';
import { firebaseLoginApi, loginApi } from "@/services/authapi/apiService";
import { signInWithGoogle } from "@/utils/googleAuth";
import { signInWithApple } from "@/utils/appleAuth";
import { getLocalizedAuthError } from "@/utils/errorLocalization";
import { COUNTRIES, CountryConfig } from "@/constants/countries";

// 🎛️ Toggle Switch for Authentication
const USE_FIREBASE_AUTH = true;
// Lazy-load Firebase Auth so the page still opens in Expo Go
function getAuth() {
  const mod = require('@react-native-firebase/auth');
  return (mod.default || mod)();
}

const { width: SW, height: SH } = Dimensions.get("window");

const rs = (size: number) => (SW / 390) * size;
const vs = (size: number) => (SH / 844) * size;
const ms = (size: number, f = 0.5) => size + (rs(size) - size) * f;

function GoogleIcon() {
  return (
    <Svg width={ms(20)} height={ms(20)} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="clip">
          <Rect width={48} height={48} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip)">
        <Path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.2z" />
        <Path fill="#34A853" d="M24 48c6.5 0 12-2.2 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.7 14.7 48 24 48z" />
        <Path fill="#FBBC05" d="M10.6 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6v-6.2H2.5C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l8.1-6.2z" />
        <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.2 30.4 0 24 0 14.7 0 6.5 5.3 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z" />
      </G>
    </Svg>
  );
}

export default function Login() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const { signIn, signInAsGuestSession } = useAuth();

  // ── Segment: "phone" | "email" ──
  const [activeTab, setActiveTab] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"input" | "otp">("input");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone form state
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<CountryConfig>(COUNTRIES[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(60);

  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string; otp?: string }>({});

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

  // ── Phone: Send OTP ──
  const handleSendOtp = async () => {
    const rawDigits = phone.replace(/\D/g, "");
    if (!phone.trim() || rawDigits.length < 7) {
      setErrors({ phone: t("err_invalid_phone") });
      return;
    }
    try {
      setLoading(true);
      setErrors({});
      await getAuth().signInWithPhoneNumber(fullNumber);
      router.push({
        pathname: "/(auth)/otp-verify",
        params: {
          phone: fullNumber,
          flag: country.flag,
          mode: "login",
        },
      });
    } catch (e: any) {
      setErrors({ phone: getLocalizedAuthError(e, "err_failed_send_otp", t) });
    } finally {
      setLoading(false);
    }
  };

  // ── Phone: Verify OTP ──
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
        router.replace("/(tabs)/home");
      } else {
        setErrors({ otp: getLocalizedAuthError(data?.message, "err_network", t) });
      }
    } catch (e: any) {
      setErrors({ otp: getLocalizedAuthError(e, "err_invalid_or_expired_code", t) });
    } finally {
      setLoading(false);
    }
  };

  // ── Email: Login ──
  const handleEmailLogin = async () => {
    const next: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = t("err_invalid_email");
    if (!password || password.length < 6)
      next.password = t("err_pw_min_length");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      setLoading(true);
      if (USE_FIREBASE_AUTH) {
        const userCredential = await getAuth().signInWithEmailAndPassword(email, password);
        const idToken = await userCredential.user.getIdToken();
        const data = await firebaseLoginApi(idToken);
        if (data?.token) {
          await signIn(data.token, email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
          router.replace("/(tabs)/home");
        } else {
          setErrors({ email: getLocalizedAuthError(data?.message, "err_network", t) });
        }
      } else {
        const data = await loginApi(email, password);
        if (data?.token) {
          await signIn(data.token, email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
          router.replace("/(tabs)/home");
        } else {
          setErrors({ email: getLocalizedAuthError(data?.message, "err_network", t) });
        }
      }
    } catch (error: any) {
      setErrors({ email: getLocalizedAuthError(error, "err_invalid_credentials", t) });
    } finally {
      setLoading(false);
    }
  };

  // ── Social / Guest Sign Ins ──
  const handleGoogleSignIn = async () => {
    Keyboard.dismiss();
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result.success && result.idToken) {
        const data = await firebaseLoginApi(result.idToken);
        if (data?.token) {
          await signIn(data.token, data.email || result.user?.email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
          router.replace("/(tabs)/home");
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

  const handleAppleSignIn = async () => {
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
        router.replace("/(tabs)/home");
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

  const handleGuestSignIn = async () => {
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
      console.warn('[Login] Guest sign in failed:', error);
      setErrors({ email: getLocalizedAuthError(error, 'err_generic', t) });
    } finally {
      setLoading(false);
    }
  };

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
            {step === "otp" ? (t("verify_otp") || "Verify OTP") : (t("login_title") || "Login / Sign up")}
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
        {/* ── Main Login Screen with Segment Switch (Prototype v2) ── */}
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
          /* ── 1. Phone Tab Form ── */
          <View style={{ gap: vs(14) }}>
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { textAlign }]}>{t("mobile_number")}</Text>
              <View style={[
                styles.inputRow,
                { flexDirection: rowDirection },
                !!errors.phone && styles.inputError,
                focusedField === "phone" && styles.inputFocused,
              ]}>
                {/* Dial code picker button */}
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

            {/* Send OTP Button */}
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                pressed && !loading && { opacity: 0.88 },
                loading && { opacity: 0.75 },
              ]}
              onPress={handleSendOtp}
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
          /* ── 2. Email Tab Form ── */
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
                <Ionicons name="mail-outline" size={ms(18)} color={focusedField === "email" ? "#0F6E56" : "#8A9995"} />
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
                  <Ionicons name="alert-circle-outline" size={ms(13)} color="#A32D2D" />
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
                <Ionicons name="lock-closed-outline" size={ms(18)} color={focusedField === "password" ? "#0F6E56" : "#8A9995"} />
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
                <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={ms(18)}
                    color="#8A9995"
                  />
                </Pressable>
              </View>
              {!!errors.password && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={ms(13)} color="#A32D2D" />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
              <Pressable onPress={() => router.push("/(auth)/ForgotPassword")} style={styles.forgotBtn}>
                <Text style={[styles.forgotText, { textAlign: isRTL ? "left" : "right" }]}>{t("forgot_password")}</Text>
              </Pressable>
            </View>

            {/* Login Button */}
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                pressed && !loading && { opacity: 0.88 },
                loading && { opacity: 0.75 },
              ]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{t("login")}</Text>
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

        {/* ── Social & Guest Buttons Stacked One by One (Prototype v2 style) ── */}
        <View style={styles.socialStack}>
          {/* Continue with Google */}
          <Pressable
            style={({ pressed }) => [styles.socialBtnStacked, pressed && { opacity: 0.85 }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            <Text style={styles.socialBtnTextStacked}>{t("google_signin") || "Continue with Google"}</Text>
          </Pressable>

          {/* Continue with Apple */}
          {Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
              cornerRadius={rs(12)}
              style={{ width: '100%', height: vs(48) }}
              onPress={handleAppleSignIn}
            />
          ) : (
            <Pressable
              style={({ pressed }) => [styles.socialBtnStacked, pressed && { opacity: 0.85 }]}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <Ionicons name="logo-apple" size={ms(20)} color="#1A2B2A" />
              <Text style={styles.socialBtnTextStacked}>{t("apple_signin") || "Continue with Apple"}</Text>
            </Pressable>
          )}

          {/* Continue as Guest */}
          <Pressable
            style={({ pressed }) => [styles.socialBtnStacked, pressed && { opacity: 0.85 }]}
            onPress={handleGuestSignIn}
            disabled={loading}
          >
            <Ionicons name="person-circle-outline" size={ms(20)} color="#0F6E56" />
            <Text style={styles.socialBtnTextStacked}>{t("guest_signin") || "Continue as guest"}</Text>
          </Pressable>
        </View>

        {/* ── Bottom Link: Don't have an account? Sign Up ── */}
        <View style={[styles.signupRow, { flexDirection: rowDirection }]}>
          <Text style={styles.signupText}>{t("dont_have_account")} </Text>
          <Pressable onPress={() => router.push("/(auth)/signup")} hitSlop={8}>
            <Text style={styles.signupLink}>{t("sign_up")}</Text>
          </Pressable>
        </View>

        {/* ── Terms & Privacy disclaimer ── */}
        <View style={styles.termsRow}>
          <Text style={styles.termsText}>
            {t("terms_text")}{" "}
            <Text style={styles.termsLink} onPress={() => router.push("/(auth)/terms")}>
              {t("terms_link")}
            </Text>
            {" "}{t("and")}{" "}
            <Text style={styles.termsLink} onPress={() => router.push("/privacy")}>
              {t("privacy_link")}
            </Text>
          </Text>
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

const styles = StyleSheet.create({
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
  inputFocused: { borderColor: "#0F6E56" },
  inputField: {
    flex: 1,
    fontSize: ms(14),
    fontWeight: "500",
    color: "#1A2B2A",
    paddingVertical: 0,
  },

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

  errorRow: { flexDirection: "row", alignItems: "center", gap: rs(4), marginTop: vs(2) },
  errorText: { fontSize: ms(11.5), color: "#A32D2D", fontWeight: "500", flex: 1 },

  forgotBtn: { alignSelf: "flex-end", marginTop: vs(4) },
  forgotText: { fontSize: ms(12), fontWeight: "600", color: "#0F6E56" },

  btn: {
    backgroundColor: "#0F6E56",
    borderRadius: rs(12),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(6),
    shadowColor: "#0F6E56",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btnText: { color: "#FFFFFF", fontSize: ms(15), fontWeight: "700" },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(6),
  },
  signupText: { fontSize: ms(13), color: "#6B756F", fontWeight: "500" },
  signupLink: { fontSize: ms(13), color: "#0F6E56", fontWeight: "700" },

  termsRow: {
    alignItems: "center",
    marginTop: vs(8),
  },
  termsText: {
    fontSize: ms(11),
    color: "#6B756F",
    textAlign: "center",
    lineHeight: ms(16),
  },
  termsLink: {
    color: "#0F6E56",
    fontWeight: "700",
  },
});