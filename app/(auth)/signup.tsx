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
import { signupApi } from "@/services/authapi/apiService";

export default function SignUp() {
  const { t } = useLang();
  const { signIn } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    terms?: string;
  }>({});

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!fullName.trim()) next.fullName = "Full name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address";
    if (!password || password.length < 6)
      next.password = "Password must be at least 6 characters";
    if (!agreedToTerms)
      next.terms = "You must agree to the Terms & Conditions to continue";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── CREATE ACCOUNT ────────────────────────────────
  const handleCreateAccount = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const data = await signupApi(fullName, email, password);

      if (data?.token) {
        await signIn(data.token, email);
        router.replace("/(tabs)/home");
      } else {
        setErrors({ email: data?.message || "Signup failed" });
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
        {/* Full Name */}
        <View>
          <Text style={styles.label}>FULL NAME</Text>
          <View
            style={[styles.inputRow, !!errors.fullName && styles.inputError]}
          >
            <Ionicons
              name="person-outline"
              size={16}
              color={Colors.textMuted}
            />
            <TextInput
              style={styles.inputField}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textMuted}
              value={fullName}
              onChangeText={(v) => {
                setFullName(v);
                clearError("fullName");
              }}
              autoCapitalize="words"
            />
          </View>
          {!!errors.fullName && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
              <Text style={styles.errorText}>{errors.fullName}</Text>
            </View>
          )}
        </View>

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
              placeholder="Create a password"
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

        {/* Terms checkbox */}
        <Pressable
          style={styles.checkboxRow}
          onPress={() => {
            setAgreedToTerms((v) => !v);
            clearError("terms");
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreedToTerms }}
        >
          <View
            style={[
              styles.checkbox,
              agreedToTerms && styles.checkboxChecked,
              !!errors.terms && styles.checkboxError,
            ]}
          >
            {agreedToTerms && (
              <Ionicons name="checkmark" size={12} color="#fff" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            By continuing, you agree to our{" "}
            <Text
              style={styles.termsLink}
              onPress={() => router.push("/(auth)/terms")}
            >
              Terms &amp; Conditions
            </Text>{" "}
            and{" "}
            <Text
              style={styles.termsLink}
              onPress={() => router.push("/(auth)/terms")}
            >
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

        {/* Create Account button */}
        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && !loading && { opacity: 0.85 },
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

        {/* Already have account */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginLink}>Login</Text>
          </Pressable>
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
  btnDisabled: { backgroundColor: Colors.border, opacity: 0.7 },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 14,
  },
  loginText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },
  loginLink: { fontSize: 13, color: Colors.primary, fontWeight: "700" },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxError: { borderColor: "#EF4444" },
  checkboxLabel: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 17,
    fontWeight: "500",
  },
  termsLink: { color: Colors.primary, fontWeight: "600" },
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
});
