import { useState } from "react";
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
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, ClipPath, Rect, Defs } from "react-native-svg";
import { useLang } from "@/context/Languagecontext";
import { useAuth } from "@/context/AuthContext";
import { firebaseLoginApi } from "@/services/authapi/apiService";
import { signInWithGoogle } from "@/utils/googleAuth";
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

// ── Apple Icon ────────────────────────────────────────
function AppleIcon() {
  const { ms } = useScalers();
  return (
    <Svg width={ms(20)} height={ms(20)} viewBox="0 0 814 1000">
      <Path
        fill="#1a1a1a"
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4C46 690.7 0 601.1 0 514.4c0-162.7 106.4-248.8 210.3-248.8 55.4 0 101.5 36.7 136.5 36.7 33.5 0 85.3-38.8 147.8-38.8 23.5 0 108.2 2.6 168.4 90.6zm-56.4-190.5c26.3-30.8 45-72.7 45-114.6 0-5.8-.6-11.6-1.3-17.4-42.8 1.9-93.4 28.5-124.1 63.9-23.5 26.3-46.4 68.2-46.4 110.7 0 6.4.6 12.9 1.3 15.1 2.6.6 6.4 1.3 10.3 1.3 38.8 0 87.5-25.7 115.2-59z"
      />
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
            {isGoogle ? <GoogleIcon /> : <AppleIcon />}
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
              🟢 Mock picker — replace with real {brandName} SDK
            </Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────
export default function SignUp() {
  const { t } = useLang();
  const { signIn } = useAuth();
  const { rs, vs, ms } = useScalers();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDPDP, setAgreedToDPDP] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    terms?: string;
    dpdp?: string;
  }>({});

  // 🟢 MOCK — account picker state (remove when using real SDK)
  const [accountPicker, setAccountPicker] = useState<"google" | "apple" | null>(null);

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const pwChecks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    numOrSym:  /[0-9!@#$%^&*]/.test(password),
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address";
    if (!password || password.length < 8)
      next.password = "Password must be at least 8 characters";
    if (!agreedToTerms)
      next.terms = "You must agree to the Terms & Conditions to continue";
    if (!agreedToDPDP)
      next.dpdp = "You must consent to health data processing to use this app";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Email/Password Sign Up ─────────────────────────

  const handleCreateAccount = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      
      // 1. Create User with Firebase
      const userCredential = await getAuth().createUserWithEmailAndPassword(email, password);
      
      // 2. Send email verification link
      await userCredential.user.sendEmailVerification();
      
      // 3. Get the ID token and register with backend
      const idToken = await userCredential.user.getIdToken();
      const data = await firebaseLoginApi(idToken);
      if (data?.token) {
        await signIn(data.token, email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
        // 4. Navigate to email verification screen
        router.replace({ pathname: "/(auth)/email-verify", params: { email } });
      } else {
        setErrors({ email: data?.message || "Signup failed on backend" });
      }
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'That email address is already in use!' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'That email address is invalid!' });
      } else {
        setErrors({ email: error.message || "Network error. Check connection." });
      }
    } finally {
      setLoading(false);
    }
  };

  // 🟢 MOCK — uncomment this function and comment out REAL above to use mock
  // const handleCreateAccount = async () => {
  //   if (!validate()) return;
  //   try {
  //     setLoading(true);
  //     await new Promise((r) => setTimeout(r, 900));        // fake network delay
  //     // simulate taken email: if (email === "taken@test.com") throw new Error("Email already in use");
  //     await signIn("mock-token-signup", email);
  //     router.replace("/(auth)/PersonOnboardingScreen");
  //   } catch (error: any) {
  //     setErrors({ email: error.message || "Network error. Check connection." });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // ── Google Sign Up ─────────────────────────────────

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result.success && result.idToken) {
        // Exchange token with backend using googleLoginApi 
        // (Assuming backend uses googleLoginApi for both login and signup for Google)
        const data = await firebaseLoginApi(result.idToken);
        if (data?.token) {
          await signIn(data.token, data.email || result.user?.email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
          router.replace("/(auth)/PersonOnboardingScreen");
        } else {
          setErrors({ email: data?.message || "Google Sign-Up failed on backend" });
        }
      } else if (!result.success && result.error !== 'Sign-in cancelled') {
        setErrors({ email: result.error });
      }
    } catch (error: any) {
      setErrors({ email: error.message || "Google Sign-Up failed" });
    } finally {
      setLoading(false);
    }
  };

  // ── Apple Sign Up ──────────────────────────────────

  // 🔴 REAL — uncomment this and comment out MOCK below when Apple SDK is ready
  // const handleAppleSignUp = async () => {
  //   try {
  //     const credential = await AppleAuthentication.signInAsync({
  //       requestedScopes: [
  //         AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
  //         AppleAuthentication.AppleAuthenticationScope.EMAIL,
  //       ],
  //     });
  //     // exchange identityToken with your backend
  //     const data = await appleSignupApi(credential.identityToken);
  //     if (data?.token) {
  //       await signIn(data.token, credential.email ?? "");
  //       router.replace("/(auth)/PersonOnboardingScreen");
  //     }
  //   } catch (error: any) {
  //     if (error.code !== "ERR_CANCELED") {
  //       setErrors({ email: error.message || "Apple Sign-Up failed" });
  //     }
  //   }
  // };

  // 🟢 MOCK — comment out this and uncomment REAL above when Apple SDK is ready
  const handleAppleSignUp = () => {
    console.log("[DEBUG] Apple button tapped");
    setAccountPicker("apple");
  };

  // 🟢 MOCK — called when user picks an account from the fake picker
  // 🔴 REAL: this whole function goes away — the SDK gives you the token directly
  const handleMockAccountSelect = async (selectedEmail: string) => {
    setAccountPicker(null);
    const isGoogle = selectedEmail.includes("gmail") || selectedEmail.includes("googlemail");
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 900));          // fake network delay
      const mockToken = isGoogle ? "mock-token-google" : "mock-token-apple";
      console.log("[MOCK] Account selected →", selectedEmail, "token →", mockToken);
      await signIn(mockToken, selectedEmail);
      router.replace("/(auth)/PersonOnboardingScreen");
    } catch (error: any) {
      setErrors({ email: error.message || "Sign-Up failed" });
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(rs, vs, ms);

  return (
    <>
      {/* 🟢 MOCK — remove MockAccountPicker when using real SDK */}
      <MockAccountPicker
        visible={accountPicker !== null}
        type={accountPicker}
        onSelect={handleMockAccountSelect}
        onClose={() => setAccountPicker(null)}
      />

      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 100}
      >
        {/* Hero header */}
        <View style={styles.hero}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ height: 8 }} />
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.sub}>Create your account to get started</Text>

          <View style={styles.illustrationWrap}>
            <View style={styles.clipboardOuter}>
              <View style={styles.clipboardClip} />
              <View style={styles.clipboardBody}>
                <Ionicons name="person-outline" size={18} color="#2D9C8E" />
                <View style={styles.clipLine} />
                <View style={[styles.clipLine, { width: "60%" }]} />
                <View style={[styles.clipLine, { width: "80%" }]} />
              </View>
            </View>
            <View style={styles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={26} color="#2D9C8E" />
            </View>
          </View>
        </View>

        <View style={styles.form}>

          {/* ── "Sign up with" label ── */}
          <Text style={styles.sectionLabel}>Sign up with</Text>

          {/* ── 3-column social row ── */}
          <View style={styles.socialRow}>

            {/* Google */}
            <Pressable
              style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.82 }]}
              onPress={handleGoogleSignUp}
              disabled={loading}
            >
              <GoogleIcon />
              <Text style={styles.socialText}>Google</Text>
            </Pressable>

            {/* Apple */}
            <Pressable
              style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.82 }]}
              onPress={handleAppleSignUp}
              disabled={loading}
            >
              <AppleIcon />
              <Text style={styles.socialText}>Apple</Text>
            </Pressable>

            {/* Phone OTP */}
            <Pressable
              style={styles.socialBtn}
              onPress={() => router.push("/(auth)/Phonesignup")}
            >
              <Ionicons name="phone-portrait-outline" size={20} color="#2D9C8E" />
              <Text style={[styles.socialText, { color: "#2D9C8E" }]}>Phone OTP</Text>
            </Pressable>

          </View>

          {/* ── Divider ── */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or sign up with</Text>
            <View style={styles.orLine} />
          </View>

          {/* ── Email Address ── */}
          <View>
            <View style={[styles.inputRow, !!errors.email && styles.inputError, focusedField === "email" && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={18} color={focusedField === "email" ? "#2D9C8E" : "#9BB5B5"} />
              <TextInput
                style={styles.inputField}
                placeholder="Enter your email address"
                placeholderTextColor="#B0CCCC"
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
                <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
          </View>

          {/* ── Password ── */}
          <View>
            <View style={[styles.inputRow, !!errors.password && styles.inputError, focusedField === "password" && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={focusedField === "password" ? "#2D9C8E" : "#9BB5B5"} />
              <TextInput
                style={styles.inputField}
                placeholder="Create a password"
                placeholderTextColor="#B0CCCC"
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
                  color="#9BB5B5"
                />
              </Pressable>
            </View>
            {!!errors.password && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
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
                    color={pwChecks.length ? "#2D9C8E" : "#B0CCCC"}
                  />
                  <Text style={[styles.pwHintText, pwChecks.length && styles.pwHintDone]}>
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.pwHintRow}>
                  <Ionicons
                    name={pwChecks.uppercase ? "checkmark-circle" : "ellipse-outline"}
                    size={14}
                    color={pwChecks.uppercase ? "#2D9C8E" : "#B0CCCC"}
                  />
                  <Text style={[styles.pwHintText, pwChecks.uppercase && styles.pwHintDone]}>
                    One uppercase letter
                  </Text>
                </View>
                <View style={styles.pwHintRow}>
                  <Ionicons
                    name={pwChecks.numOrSym ? "checkmark-circle" : "ellipse-outline"}
                    size={14}
                    color={pwChecks.numOrSym ? "#2D9C8E" : "#B0CCCC"}
                  />
                  <Text style={[styles.pwHintText, pwChecks.numOrSym && styles.pwHintDone]}>
                    One number or special character
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ── Terms checkbox ── */}
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
                Terms &amp; Conditions
              </Text>{" "}
              and{" "}
              <Text style={styles.termsLink} onPress={() => router.push("/(auth)/terms")}>
                Privacy Policy
              </Text>
              .
            </Text>
          </Pressable>
          {!!errors.terms && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
              <Text style={styles.errorText}>{errors.terms}</Text>
            </View>
          )}

          {/* ── DPDP Consent checkbox ── */}
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
              <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
              <Text style={styles.errorText}>{errors.dpdp}</Text>
            </View>
          )}

          {/* ── Create Account button ── */}
          <Pressable
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && !loading && { opacity: 0.88 },
              loading && styles.btnDisabled,
            ]}
            onPress={handleCreateAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </Pressable>

          {/* ── Already have account ── */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.loginLink}>Login</Text>
            </Pressable>
          </View>

        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const makeStyles = (
  rs: (n: number) => number,
  vs: (n: number) => number,
  ms: (n: number, f?: number) => number
) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9F9" },

  hero: {
    paddingHorizontal: rs(18),
    paddingTop: vs(46),
    paddingBottom: vs(18),
    backgroundColor: "#0F172A",
    borderBottomLeftRadius: rs(22),
    borderBottomRightRadius: rs(22),
  },
  backBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(10),
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: ms(22), fontWeight: "800", color: "#fff", marginBottom: vs(2) },
  sub: { fontSize: ms(12), color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  illustrationWrap: {
    position: "absolute",
    right: rs(16),
    top: vs(40),
    flexDirection: "row",
    alignItems: "flex-end",
    gap: rs(4),
  },
  clipboardOuter: { alignItems: "center" },
  clipboardClip: {
    width: rs(22),
    height: vs(8),
    backgroundColor: "#2D9C8E",
    borderRadius: rs(3),
    marginBottom: -3,
    zIndex: 1,
  },
  clipboardBody: {
    width: rs(56),
    backgroundColor: "#fff",
    borderRadius: rs(8),
    padding: rs(8),
    alignItems: "center",
    gap: vs(4),
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  clipLine: {
    width: "100%",
    height: vs(4),
    backgroundColor: "#E2E8F0",
    borderRadius: rs(2),
  },
  shieldWrap: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: "rgba(45,156,142,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(4),
  },

  form: {
    flex: 1,
    paddingHorizontal: rs(16),
    paddingTop: vs(20),
    paddingBottom: vs(20),
    gap: vs(12),
  },

  sectionLabel: {
    fontSize: ms(14),
    fontWeight: "700",
    color: "#1a2e35",
    textAlign: "center",
    marginBottom: vs(2),
  },

  socialRow: {
    flexDirection: "row",
    gap: rs(8),
  },
  socialBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: vs(6),
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2ECEC",
    borderRadius: rs(14),
    paddingVertical: vs(14),
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  socialText: { fontSize: ms(12), fontWeight: "700", color: "#1a2e35" },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    marginVertical: vs(2),
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#E2ECEC" },
  orText: { fontSize: ms(11), color: "#9BB5B5", fontWeight: "600" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2ECEC",
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    paddingVertical: vs(13),
    gap: rs(10),
    shadowColor: "#2D9C8E",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: { borderColor: "#EF4444" },
  inputFocused: {
    borderColor: "#2D9C8E",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputField: {
    flex: 1,
    fontSize: ms(14),
    fontWeight: "500",
    color: "#1a2e35",
    paddingVertical: 0,
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    marginTop: vs(3),
  },
  errorText: { fontSize: ms(11), color: "#EF4444", fontWeight: "500", flex: 1 },

  pwHints: { marginTop: vs(6), gap: vs(3) },
  pwHintRow: { flexDirection: "row", alignItems: "center", gap: rs(6) },
  pwHintText: { fontSize: ms(11), color: "#9BB5B5", fontWeight: "500" },
  pwHintDone: { color: "#2D9C8E" },

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
    backgroundColor: "#2D9C8E",
    borderColor: "#2D9C8E",
  },
  checkboxError: { borderColor: "#EF4444" },
  checkboxLabel: {
    flex: 1,
    fontSize: ms(12),
    color: "#6B8F8F",
    lineHeight: ms(17),
    fontWeight: "500",
  },
  termsLink: { color: "#2D9C8E", fontWeight: "700" },

  btnPrimary: {
    backgroundColor: "#2D9C8E",
    borderRadius: rs(14),
    paddingVertical: vs(14),
    alignItems: "center",
    shadowColor: "#2D9C8E",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { color: "#fff", fontSize: ms(15), fontWeight: "800", letterSpacing: 0.2 },
  btnDisabled: { backgroundColor: "#A8D5CF", elevation: 0, shadowOpacity: 0 },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: vs(4),
  },
  loginText: { fontSize: ms(13), color: "#9BB5B5", fontWeight: "500" },
  loginLink: { fontSize: ms(13), color: "#2D9C8E", fontWeight: "700" },
});