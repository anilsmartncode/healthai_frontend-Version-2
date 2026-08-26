import { useState } from "react";
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

// 🎛️ Toggle Switch for Authentication
const USE_FIREBASE_AUTH = false;
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
  const { t } = useLang();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleLogin = async () => {
    const next: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address";
    if (!password || password.length < 6)
      next.password = "Password must be at least 6 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      setLoading(true);

      if (USE_FIREBASE_AUTH) {
        // 🟢 FLOW 1: FIREBASE AUTHENTICATION
        const userCredential = await getAuth().signInWithEmailAndPassword(email, password);
        const idToken = await userCredential.user.getIdToken();
        const data = await firebaseLoginApi(idToken);

        if (data?.token) {
          await signIn(data.token, email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
          router.replace("/(tabs)/home");
        } else {
          setErrors({ email: data?.message || "Login failed on backend" });
        }
      } else {
        // 🔵 FLOW 2: CUSTOM OLD API AUTHENTICATION
        const data = await loginApi(email, password);

        if (data?.token) {
          await signIn(data.token, email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
          router.replace("/(tabs)/home");
        } else {
          setErrors({ email: data?.message || "Custom API Login failed" });
        }
      }

    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrors({ email: "Invalid email or password" });
      } else {
        setErrors({ email: error.message || "Network error. Check connection." });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign In ──
  const handleGoogleSignIn = async () => {
    Keyboard.dismiss();
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result.success && result.idToken) {
        // Exchange token with backend
        const data = await firebaseLoginApi(result.idToken);
        if (data?.token) {
          await signIn(data.token, data.email || result.user?.email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
          router.replace("/(tabs)/home");
        } else {
          setErrors({ email: data?.message || "Google Sign-In failed on backend" });
        }
      } else if (!result.success && result.error !== 'Sign-in cancelled') {
        setErrors({ email: result.error });
      }
    } catch (error: any) {
      setErrors({ email: error.message || "Google Sign-In failed" });
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
        return; // user cancelled
      }

      const data = await firebaseLoginApi(result.idToken);
      if (data?.token) {
        await signIn(data.token, data.email || result.user.email, data.member_id ?? data.user_id ?? null, data.refresh_token ?? null);
        router.replace("/(tabs)/home");
      } else {
        setErrors({ email: data?.message || "Failed to sign in via backend" });
      }
    } catch (error: any) {
      console.error("Apple sign-in error:", error);
      setErrors({ email: "Apple sign-in failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === 'ios' ? 20 : 100}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Ionicons name="heart" size={ms(22)} color="#2D9C8E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoText}>
              Health <Text style={styles.logoAccent}>AI</Text>
            </Text>
            <Text style={styles.logoSub}>Your Health, Smarter</Text>
          </View>
          <View style={styles.statsBadge}>
            <Ionicons name="trending-up" size={ms(16)} color="#2D9C8E" />
          </View>
        </View>

        <View style={styles.heroBody}>
          <View style={styles.welcomeWrap}>
            <Text style={styles.welcomeTitle}>Welcome Back 👋</Text>
            <Text style={styles.welcomeSub}>
              Sign in to access your health insights, reports and personalized recommendations.
            </Text>
          </View>
          <View style={styles.decorWrap}>
            <View style={styles.shieldCircle}>
              <Ionicons name="shield-checkmark" size={ms(52)} color="#2D9C8E" />
            </View>
            <View style={styles.heartBadge}>
              <Ionicons name="heart" size={ms(15)} color="#2D9C8E" />
            </View>
            <View style={styles.docBadge}>
              <Ionicons name="document-text-outline" size={ms(14)} color="#2D9C8E" />
            </View>
          </View>
        </View>
      </View>

      {/* ── Form Card ── */}
      <View style={styles.card}>

        {/* ── "Sign in with" label ── */}
        <Text style={styles.sectionLabel}>Sign in with</Text>

        {/* ── 3-column social row (same layout as signup) ── */}
        <View style={styles.socialRow}>
          {/* Google */}
          <Pressable
            style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.82 }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            <Text style={styles.socialText}>Google</Text>
          </Pressable>

          {/* Apple */}
          {Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
              cornerRadius={rs(14)}
              style={{ flex: 1, height: '100%', minHeight: vs(72) }}
              onPress={handleAppleSignIn}
            />
          ) : (
            <Pressable
              style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.82 }]}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <Ionicons name="logo-apple" size={ms(20)} color="#1a2e35" />
              <Text style={styles.socialText}>Apple</Text>
            </Pressable>
          )}

          {/* Phone OTP */}
          <Pressable
            style={styles.socialBtn}
            onPress={() => router.replace("/(auth)/Phonelogin")}
          >
            <Ionicons name="phone-portrait-outline" size={ms(20)} color="#2D9C8E" />
            <Text style={[styles.socialText, { color: "#2D9C8E" }]}>Phone OTP</Text>
          </Pressable>
        </View>

        {/* ── Divider ── */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or sign in with</Text>
          <View style={styles.orLine} />
        </View>

        {/* ── Email Address ── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={[
            styles.inputRow,
            !!errors.email && styles.inputError,
            focusedField === "email" && styles.inputFocused,
          ]}>
            <Ionicons name="mail-outline" size={ms(18)} color={focusedField === "email" ? "#2D9C8E" : "#9BB5B5"} />
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
              <Ionicons name="alert-circle-outline" size={ms(13)} color="#EF4444" />
              <Text style={styles.errorText}>{errors.email}</Text>
            </View>
          )}
          <Pressable
            style={styles.usePhoneRow}
            onPress={() => router.replace("/(auth)/Phonelogin")}
          >
            <Text style={styles.usePhoneText}>Use phone number instead</Text>
            <Ionicons name="chevron-forward" size={ms(13)} color="#2D9C8E" />
          </Pressable>
        </View>

        {/* ── Password ── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[
            styles.inputRow,
            !!errors.password && styles.inputError,
            focusedField === "password" && styles.inputFocused,
          ]}>
            <Ionicons name="lock-closed-outline" size={ms(18)} color={focusedField === "password" ? "#2D9C8E" : "#9BB5B5"} />
            <TextInput
              style={styles.inputField}
              placeholder="Enter your password"
              placeholderTextColor="#B0CCCC"
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
                color="#9BB5B5"
              />
            </Pressable>
          </View>
          {!!errors.password && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={ms(13)} color="#EF4444" />
              <Text style={styles.errorText}>{errors.password}</Text>
            </View>
          )}
          <Pressable onPress={() => router.push("/(auth)/ForgotPassword")}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
        </View>

        {/* ── Login Button ── */}
        <Pressable
          style={({ pressed }) => [
            styles.loginBtn,
            pressed && !loading && { opacity: 0.9 },
            loading && { opacity: 0.75 },
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.loginBtnText}>Login</Text>
              <View style={styles.loginArrow}>
                <Ionicons name="arrow-forward" size={ms(16)} color="#2D9C8E" />
              </View>
            </>
          )}
        </Pressable>

        {/* ── Security Note ── */}
        <View style={styles.securityRow}>
          <View style={styles.securityIcon}>
            <Ionicons name="shield-checkmark-outline" size={ms(18)} color="#2D9C8E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Your data is encrypted and secure</Text>
            <Text style={styles.securitySub}>We follow industry-leading security standards</Text>
          </View>
        </View>

        {/* ── Sign Up ── */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push("/(auth)/signup")} hitSlop={8}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAF6F5" },
  scrollContent: { flexGrow: 1 },

  // ── Hero ──
  hero: {
    backgroundColor: "#EAF6F5",
    paddingHorizontal: rs(20),
    paddingTop: vs(52),
    paddingBottom: vs(24),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
    marginBottom: vs(18),
  },
  logoBox: {
    width: rs(44), height: rs(44), borderRadius: rs(14),
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#2D9C8E", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  logoText: { fontSize: ms(17), fontWeight: "800", color: "#1a2e35", letterSpacing: -0.3 },
  logoAccent: { color: "#2D9C8E" },
  logoSub: { fontSize: ms(11), color: "#7a9a9a", fontWeight: "500" },
  statsBadge: {
    width: rs(36), height: rs(36), borderRadius: rs(10),
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },

  heroBody: { flexDirection: "row", alignItems: "center", gap: rs(8) },
  welcomeWrap: { flex: 1 },
  welcomeTitle: { fontSize: ms(22), fontWeight: "800", color: "#1a2e35", marginBottom: vs(6), letterSpacing: -0.5 },
  welcomeSub: { fontSize: ms(12), color: "#6b8f8f", lineHeight: ms(18), fontWeight: "400" },

  decorWrap: {
    width: rs(110), height: rs(110),
    position: "relative",
    justifyContent: "center", alignItems: "center",
  },
  shieldCircle: {
    width: rs(100), height: rs(100), borderRadius: rs(50),
    backgroundColor: "rgba(45,156,142,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  heartBadge: {
    position: "absolute", bottom: 0, left: 0,
    width: rs(30), height: rs(30), borderRadius: rs(9),
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  docBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: rs(30), height: rs(30), borderRadius: rs(9),
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },

  // ── Card ──
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: rs(28), borderTopRightRadius: rs(28),
    paddingHorizontal: rs(16),
    paddingTop: vs(20),
    paddingBottom: vs(36),
    gap: vs(12),
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 5,
  },

  // ── "Sign in with" label (matches signup sectionLabel) ──
  sectionLabel: {
    fontSize: ms(14),
    fontWeight: "700",
    color: "#1a2e35",
    textAlign: "center",
    marginBottom: vs(2),
  },

  // ── Social row (same 3-column as signup) ──
  socialRow: { flexDirection: "row", gap: rs(8) },
  socialBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: vs(6),
    backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#E2ECEC",
    borderRadius: rs(14),
    paddingVertical: vs(14),
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  socialText: { fontSize: ms(12), fontWeight: "700", color: "#1a2e35" },

  // ── Divider ──
  orRow: { flexDirection: "row", alignItems: "center", gap: rs(8), marginVertical: vs(2) },
  orLine: { flex: 1, height: 1, backgroundColor: "#E2ECEC" },
  orText: { fontSize: ms(11), color: "#9BB5B5", fontWeight: "600" },

  // ── Fields ──
  fieldWrap: { gap: vs(4) },
  fieldLabel: { fontSize: ms(13), fontWeight: "700", color: "#1a2e35", marginBottom: vs(2) },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#E2ECEC",
    borderRadius: rs(14),
    paddingHorizontal: rs(14), paddingVertical: vs(13),
    gap: rs(10),
    shadowColor: "#2D9C8E", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  inputError: { borderColor: "#EF4444" },
  inputFocused: { borderColor: "#2D9C8E", shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  inputField: { flex: 1, fontSize: ms(14), fontWeight: "500", color: "#1a2e35", paddingVertical: 0 },

  errorRow: { flexDirection: "row", alignItems: "center", gap: rs(4), marginTop: vs(3) },
  errorText: { fontSize: ms(11), color: "#EF4444", fontWeight: "500", flex: 1 },

  usePhoneRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    gap: rs(2), marginTop: vs(5),
  },
  usePhoneText: { fontSize: ms(12), fontWeight: "600", color: "#2D9C8E" },
  forgotText: { fontSize: ms(12), fontWeight: "600", color: "#2D9C8E", marginTop: vs(5) },

  // ── Login Button ──
  loginBtn: {
    backgroundColor: "#2D9C8E",
    borderRadius: rs(14), paddingVertical: vs(14),
    alignItems: "center", justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#2D9C8E", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  loginBtnText: { color: "#fff", fontSize: ms(15), fontWeight: "800", letterSpacing: 0.2 },
  loginArrow: {
    position: "absolute", right: rs(14),
    width: rs(28), height: rs(28), borderRadius: rs(8),
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center",
  },

  // ── Security ──
  securityRow: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    backgroundColor: "#F0FAF9", borderRadius: rs(14), padding: rs(14),
    borderWidth: 1, borderColor: "#C8E8E5",
  },
  securityIcon: {
    width: rs(34), height: rs(34), borderRadius: rs(10),
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
  },
  securityTitle: { fontSize: ms(12), fontWeight: "600", color: "#1a2e35" },
  securitySub: { fontSize: ms(10), color: "#7a9a9a", marginTop: vs(1) },

  // ── Sign Up ──
  signupRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: vs(4) },
  signupText: { fontSize: ms(13), color: "#9BB5B5", fontWeight: "500" },
  signupLink: { fontSize: ms(13), color: "#2D9C8E", fontWeight: "700" },
});