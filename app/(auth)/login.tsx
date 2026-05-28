import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, ClipPath, Rect, Defs } from "react-native-svg";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import { useAuth } from "@/context/AuthContext";
import { loginApi } from "@/services/authapi/apiService";

export default function Login() {
  const { t } = useLang();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  // ── LOGIN ─────────────────────────────────────────
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero header */}
      <View style={styles.hero}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <View style={{ height: 8 }} />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Log in to continue your journey</Text>

        {/* Decorative illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.clipboardOuter}>
            <View style={styles.clipboardClip} />
            <View style={styles.clipboardBody}>
              <Ionicons name="person-outline" size={18} color="#2D9C8E" />
              <View style={styles.clipLine} />
              <View style={[styles.clipLine, { width: "60%" }]} />
            </View>
          </View>
          <View style={styles.shieldWrap}>
            <Ionicons name="shield-checkmark" size={26} color="#2D9C8E" />
          </View>
        </View>
      </View>

      <View style={styles.form}>
        {/* Email */}
        <View>
          <Text style={styles.label}>EMAIL</Text>
          <View style={[styles.inputRow, !!errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.inputField}
              placeholder="Enter your email address"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearError("email");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable onPress={() => router.replace("/(auth)/Phonelogin")}>
              <Text style={styles.usePhoneLink}>Use phone</Text>
            </Pressable>
          </View>
          {!!errors.email && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
              <Text style={styles.errorText}>{errors.email}</Text>
            </View>
          )}
        </View>

        {/* Password */}
        <View>
          <Text style={styles.label}>PASSWORD</Text>
          <View
            style={[styles.inputRow, !!errors.password && styles.inputError]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={Colors.textMuted}
            />
            <TextInput
              style={styles.inputField}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                clearError("password");
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((p) => !p)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={16}
                color={Colors.textMuted}
              />
            </Pressable>
          </View>
          {!!errors.password && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
              <Text style={styles.errorText}>{errors.password}</Text>
            </View>
          )}
        </View>

        {/* Login Button */}
        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && !loading && { opacity: 0.85 },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Login</Text>
          )}
        </Pressable>

        {/* Sign Up link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* Continue with Google */}
        <Pressable style={styles.socialBtn}>
          <Svg width={18} height={18} viewBox="0 0 48 48">
            <Defs>
              <ClipPath id="clip">
                <Rect width={48} height={48} />
              </ClipPath>
            </Defs>
            <G clipPath="url(#clip)">
              <Path
                fill="#4285F4"
                d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.2z"
              />
              <Path
                fill="#34A853"
                d="M24 48c6.5 0 12-2.2 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.7 14.7 48 24 48z"
              />
              <Path
                fill="#FBBC05"
                d="M10.6 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6v-6.2H2.5C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l8.1-6.2z"
              />
              <Path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.2 30.4 0 24 0 14.7 0 6.5 5.3 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z"
              />
            </G>
          </Svg>
          <Text style={styles.socialText}>Continue with Google</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  hero: {
    padding: 18,
    paddingTop: 46,
    backgroundColor: "#0F172A",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 2 },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  illustrationWrap: {
    position: "absolute",
    right: 16,
    top: 40,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  clipboardOuter: { alignItems: "center" },
  clipboardClip: {
    width: 22,
    height: 8,
    backgroundColor: "#2D9C8E",
    borderRadius: 3,
    marginBottom: -3,
    zIndex: 1,
  },
  clipboardBody: {
    width: 56,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  clipLine: {
    width: "100%",
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
  },
  shieldWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(45,156,142,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  form: { padding: 14, gap: 10 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 7,
  },
  inputError: { borderColor: "#EF4444", borderWidth: 1.5 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  errorText: { fontSize: 12, color: "#EF4444", fontWeight: "500", flex: 1 },
  inputField: { flex: 1, fontSize: 13, fontWeight: "500", color: Colors.text },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 2,
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 4,
  },
  signupText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },
  signupLink: { fontSize: 13, color: Colors.primary, fontWeight: "700" },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 2,
  },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { fontSize: 12, color: Colors.textMuted, fontWeight: "500" },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 11,
    marginBottom: 6,
  },
  socialText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  usePhoneLink: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    textDecorationLine: "underline",
  },
});
