import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, ClipPath, Rect, Defs } from "react-native-svg";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import { useAuth } from "@/context/AuthContext";
import { loginApi } from "@/services/authapi/apiService";

const { width: SW, height: SH } = Dimensions.get("window");

// Responsive scale helpers
const rs = (size: number) => (SW / 390) * size;   // scale by width  (390 = iPhone 14 base)
const vs = (size: number) => (SH / 844) * size;   // scale by height (844 = iPhone 14 base)
const ms = (size: number, f = 0.5) => size + (rs(size) - size) * f; // moderate scale

// ── Google SVG ────────────────────────────────────────
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

function AppleIcon() {
  return (
    <Svg width={ms(20)} height={ms(20)} viewBox="0 0 814 1000">
      <Path
        fill="#1a1a1a"
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4C46 690.7 0 601.1 0 514.4c0-162.7 106.4-248.8 210.3-248.8 55.4 0 101.5 36.7 136.5 36.7 33.5 0 85.3-38.8 147.8-38.8 23.5 0 108.2 2.6 168.4 90.6zm-56.4-190.5c26.3-30.8 45-72.7 45-114.6 0-5.8-.6-11.6-1.3-17.4-42.8 1.9-93.4 28.5-124.1 63.9-23.5 26.3-46.4 68.2-46.4 110.7 0 6.4.6 12.9 1.3 15.1 2.6.6 6.4 1.3 10.3 1.3 38.8 0 87.5-25.7 115.2-59z"
      />
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
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  // 🔴 REAL — comment out this function when using MOCK below
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
      const data = await loginApi(email, password);
      if (data?.token) {
        await signIn(data.token, email);
        router.replace("/(tabs)/home");
      } else {
        setErrors({ email: data?.message || "Login failed" });
      }
    } catch (error: any) {
      setErrors({ email: error.message || "Network error. Check connection." });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 MOCK — uncomment this function and comment out REAL above to use mock
  // const handleLogin = async () => {
  //   const next: typeof errors = {};
  //   if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  //     next.email = "Enter a valid email address";
  //   if (!password || password.length < 6)
  //     next.password = "Password must be at least 6 characters";
  //   setErrors(next);
  //   if (Object.keys(next).length > 0) return;
  //   try {
  //     setLoading(true);
  //     await new Promise((r) => setTimeout(r, 900));        // fake network delay
  //     if (password !== "password123") throw new Error("Use password: password123");
  //     await signIn("mock-token-login", email);
  //     router.replace("/(tabs)/home");
  //   } catch (error: any) {
  //     setErrors({ email: error.message || "Network error. Check connection." });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        {/* Logo row */}
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

        {/* Welcome + decor in a row so neither overlaps */}
        <View style={styles.heroBody}>
          {/* Left: text — takes remaining space */}
          <View style={styles.welcomeWrap}>
            <Text style={styles.welcomeTitle}>Welcome Back 👋</Text>
            <Text style={styles.welcomeSub}>
              Sign in to access your health insights, reports and personalized recommendations.
            </Text>
          </View>

          {/* Right: decoration — fixed width so text never gets squeezed off-screen */}
          <View style={styles.decorWrap}>
            <View style={styles.shieldCircle}>
              <Ionicons name="shield-checkmark" size={ms(52)} color="#2D9C8E" />
            </View>
            {/* Small floating badges anchored to the circle */}
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
        {/* Email */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={[styles.inputRow, !!errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={ms(18)} color="#aab" />
            <TextInput
              style={styles.inputField}
              placeholder="Enter your email address"
              placeholderTextColor="#b0bec5"
              value={email}
              onChangeText={(v) => { setEmail(v); clearError("email"); }}
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

        {/* Password */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.inputRow, !!errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={ms(18)} color="#aab" />
            <TextInput
              style={styles.inputField}
              placeholder="Enter your password"
              placeholderTextColor="#b0bec5"
              value={password}
              onChangeText={(v) => { setPassword(v); clearError("password"); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={ms(18)}
                color="#aab"
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

        {/* Login Button */}
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

        {/* Divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or continue with</Text>
          <View style={styles.orLine} />
        </View>

        {/* Social Buttons */}
        <Pressable style={styles.socialBtn}>
          <GoogleIcon />
          <Text style={styles.socialText}>Continue with Google</Text>
        </Pressable>

        <Pressable style={styles.socialBtn}>
          <AppleIcon />
          <Text style={styles.socialText}>Continue with Apple</Text>
        </Pressable>


        {/* Security Note */}
        <Pressable style={styles.securityRow}>
          <View style={styles.securityIcon}>
            <Ionicons name="shield-checkmark-outline" size={ms(18)} color="#2D9C8E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Your data is encrypted and secure</Text>
            <Text style={styles.securitySub}>We follow industry-leading security standards</Text>
          </View>
          <Ionicons name="chevron-forward" size={ms(14)} color="#aab" />
        </Pressable>

        {/* Sign Up */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push("/(auth)/signup")} hitSlop={8}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF6F5",
  },
  // flexGrow:1 ensures card fills remaining height on tall screens
  // but also allows scroll on short/small screens
  scrollContent: {
    flexGrow: 1,
  },

  // ── Hero ──
  hero: {
    backgroundColor: "#EAF6F5",
    paddingHorizontal: rs(20),
    paddingTop: vs(52),       // safe-area-friendly top padding, scales with height
    paddingBottom: vs(24),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
    marginBottom: vs(18),
  },
  logoBox: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(14),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2D9C8E",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: ms(17),
    fontWeight: "800",
    color: "#1a2e35",
    letterSpacing: -0.3,
  },
  logoAccent: { color: "#2D9C8E" },
  logoSub: { fontSize: ms(11), color: "#7a9a9a", fontWeight: "500" },
  statsBadge: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },

  // Row: text (flex:1) + decor (fixed width) — no absolute positioning
  heroBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
  },
  welcomeWrap: {
    flex: 1,                  // takes all remaining width, never clips
  },
  welcomeTitle: {
    fontSize: ms(22),
    fontWeight: "800",
    color: "#1a2e35",
    marginBottom: vs(6),
    letterSpacing: -0.5,
  },
  welcomeSub: {
    fontSize: ms(12),
    color: "#6b8f8f",
    lineHeight: ms(18),
    fontWeight: "400",
  },

  // Decor: fixed width so text always has room
  decorWrap: {
    width: rs(110),
    height: rs(110),
    position: "relative",     // only children are relative — no viewport absolute
    justifyContent: "center",
    alignItems: "center",
  },
  shieldCircle: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    backgroundColor: "rgba(45,156,142,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  heartBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: rs(30),
    height: rs(30),
    borderRadius: rs(9),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  docBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: rs(30),
    height: rs(30),
    borderRadius: rs(9),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Card ──
  card: {
    flex: 1,                  // fills leftover screen height
    backgroundColor: "#fff",
    borderTopLeftRadius: rs(28),
    borderTopRightRadius: rs(28),
    paddingHorizontal: rs(20),
    paddingTop: vs(26),
    paddingBottom: vs(36),
    gap: vs(12),
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },

  // ── Fields ──
  fieldWrap: { gap: vs(4) },
  fieldLabel: {
    fontSize: ms(13),
    fontWeight: "600",
    color: "#1a2e35",
    marginBottom: vs(4),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFA",
    borderWidth: 1.5,
    borderColor: "#E2ECEC",
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    paddingVertical: vs(12),
    gap: rs(10),
  },
  inputError: { borderColor: "#EF4444" },
  inputField: {
    flex: 1,                  // stretches to fill row, never overflows
    fontSize: ms(13),
    fontWeight: "500",
    color: "#1a2e35",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    marginTop: vs(3),
  },
  errorText: { fontSize: ms(11), color: "#EF4444", fontWeight: "500", flex: 1 },
  usePhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: rs(2),
    marginTop: vs(5),
  },
  usePhoneText: { fontSize: ms(12), fontWeight: "600", color: "#2D9C8E" },
  forgotText: {
    fontSize: ms(12),
    fontWeight: "600",
    color: "#2D9C8E",
    marginTop: vs(5),
  },

  // ── Login Button ──
  loginBtn: {
    backgroundColor: "#2D9C8E",
    borderRadius: rs(14),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: vs(2),
    shadowColor: "#2D9C8E",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: ms(15),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loginArrow: {
    position: "absolute",
    right: rs(14),
    width: rs(28),
    height: rs(28),
    borderRadius: rs(8),
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Divider ──
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    marginVertical: vs(2),
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#E8F0F0" },
  orText: { fontSize: ms(11), color: "#8aabab", fontWeight: "500" },

  // ── Social ──
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(12),
    backgroundColor: "#F7FAFA",
    borderWidth: 1.5,
    borderColor: "#E2ECEC",
    borderRadius: rs(14),
    paddingVertical: vs(12),
    paddingHorizontal: rs(16),
  },
  socialText: { fontSize: ms(13), fontWeight: "600", color: "#1a2e35" },

  // ── Security ──
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(12),
    backgroundColor: "#F0FAF9",
    borderRadius: rs(14),
    padding: rs(14),
    borderWidth: 1,
    borderColor: "#C8E8E5",
  },
  securityIcon: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  securityTitle: { fontSize: ms(12), fontWeight: "600", color: "#1a2e35" },
  securitySub: { fontSize: ms(10), color: "#7a9a9a", marginTop: vs(1) },

  // ── Sign Up ──
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(4),
  },
  signupText: { fontSize: ms(13), color: "#8aabab", fontWeight: "500" },
  signupLink: { fontSize: ms(13), color: "#2D9C8E", fontWeight: "700" },
});