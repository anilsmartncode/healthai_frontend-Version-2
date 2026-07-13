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

// Lazy-load Firebase Auth so the page still opens in Expo Go
function getAuth() {
  const mod = require('@react-native-firebase/auth');
  return (mod.default || mod)();
}

const { width: SW, height: SH } = Dimensions.get("window");
const rs = (size: number) => (SW / 390) * size;
const vs = (size: number) => (SH / 844) * size;
const ms = (size: number, f = 0.5) => size + (rs(size) - size) * f;

// ── Step types ────────────────────────────────────────
type Step = "email" | "success";

// ── Main Component ────────────────────────────────────
export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  // ── Step 1: Send Reset Link ──
  const handleSendResetLink = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }
    try {
      setLoading(true);
      await getAuth().sendPasswordResetEmail(email.trim());
      setStep("success");
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        setErrors({ email: "No account found with this email." });
      } else if (e.code === 'auth/invalid-email') {
        setErrors({ email: "Enter a valid email address." });
      } else {
        setErrors({ email: e.message || "Failed to send reset link." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        {/* Back button */}
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (step === "email") router.back();
            else router.replace("/(auth)/login");
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={ms(18)} color="#1a2e35" />
        </Pressable>

        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Ionicons name="heart" size={ms(18)} color="#2D9C8E" />
          </View>
          <Text style={styles.logoText}>
            Health <Text style={styles.logoAccent}>AI</Text>
          </Text>
        </View>

        {/* Icon + title */}
        <View style={styles.heroCenter}>
          <View style={styles.heroIconWrap}>
            <View style={styles.heroIconOuter}>
              <View style={styles.heroIconInner}>
                <Ionicons
                  name={step === "success" ? "checkmark-circle" : "mail"}
                  size={ms(34)}
                  color="#2D9C8E"
                />
              </View>
            </View>
            {/* Decorative dots */}
            <View style={[styles.dot, { top: rs(6), right: rs(6) }]} />
            <View style={[styles.dot, styles.dotSm, { bottom: rs(10), left: rs(4) }]} />
          </View>

          <Text style={styles.heroTitle}>
            {step === "success" ? "Check Your Email 📩" : "Forgot Password?"}
          </Text>
          <Text style={styles.heroSub}>
            {step === "success"
              ? `We sent a password reset link to\n${email}\n\nClick the link to create a new password.`
              : "No worries! Enter your email and\nwe'll send you a reset link."}
          </Text>
        </View>
      </View>

      {/* ── Card ── */}
      <View style={styles.card}>
        {/* ── Step 1: Email ── */}
        {step === "email" && (
          <>
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
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && !loading && { opacity: 0.9 },
                loading && { opacity: 0.75 },
              ]}
              onPress={handleSendResetLink}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                  <View style={styles.btnArrow}>
                    <Ionicons name="arrow-forward" size={ms(15)} color="#2D9C8E" />
                  </View>
                </>
              )}
            </Pressable>

            <Pressable style={styles.backToLogin} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={ms(14)} color="#2D9C8E" />
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </Pressable>
          </>
        )}

        {/* ── Step 2: Success ── */}
        {step === "success" && (
          <>
            <View style={styles.successBox}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={ms(56)} color="#2D9C8E" />
              </View>
              <Text style={styles.successTitle}>Link Sent!</Text>
              <Text style={styles.successMsg}>
                Check your inbox and spam folder. Once you reset your password, you can log in below.
              </Text>
            </View>

            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={styles.primaryBtnText}>Back to Login</Text>
              <View style={styles.btnArrow}>
                <Ionicons name="arrow-forward" size={ms(15)} color="#2D9C8E" />
              </View>
            </Pressable>

            {/* Security note */}
            <View style={styles.securityRow}>
              <View style={styles.securityIcon}>
                <Ionicons name="shield-checkmark-outline" size={ms(18)} color="#2D9C8E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.securityTitle}>Your data is encrypted and secure</Text>
                <Text style={styles.securitySub}>We follow industry-leading security standards</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAF6F5" },
  scrollContent: { flexGrow: 1 },

  // ── Hero ──
  hero: {
    backgroundColor: "#EAF6F5",
    paddingHorizontal: rs(20),
    paddingTop: vs(52),
    paddingBottom: vs(20),
  },
  backBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(12),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: vs(14),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    marginBottom: vs(20),
  },
  logoBox: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2D9C8E",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  logoText: { fontSize: ms(16), fontWeight: "800", color: "#1a2e35" },
  logoAccent: { color: "#2D9C8E" },

  heroCenter: { alignItems: "center", marginBottom: vs(20) },
  heroIconWrap: {
    position: "relative",
    marginBottom: vs(14),
    width: rs(110),
    height: rs(110),
    justifyContent: "center",
    alignItems: "center",
  },
  heroIconOuter: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    backgroundColor: "rgba(45,156,142,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroIconInner: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: "rgba(45,156,142,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    position: "absolute",
    width: rs(10),
    height: rs(10),
    borderRadius: rs(5),
    backgroundColor: "#2D9C8E",
    opacity: 0.4,
  },
  dotSm: { width: rs(7), height: rs(7), borderRadius: rs(3.5), opacity: 0.25 },

  heroTitle: {
    fontSize: ms(22),
    fontWeight: "800",
    color: "#1a2e35",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: vs(6),
  },
  heroSub: {
    fontSize: ms(13),
    color: "#6b8f8f",
    textAlign: "center",
    lineHeight: ms(19),
    fontWeight: "400",
  },

  // ── Card ──
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: rs(28),
    borderTopRightRadius: rs(28),
    paddingHorizontal: rs(20),
    paddingTop: vs(26),
    paddingBottom: vs(36),
    gap: vs(14),
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
    flex: 1,
    fontSize: ms(13),
    fontWeight: "500",
    color: "#1a2e35",
  },
  errorRow: { flexDirection: "row", alignItems: "center", gap: rs(4), marginTop: vs(3) },
  errorText: { fontSize: ms(11), color: "#EF4444", fontWeight: "500", flex: 1 },

  // ── Primary Button ──
  primaryBtn: {
    backgroundColor: "#2D9C8E",
    borderRadius: rs(14),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#2D9C8E",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: { color: "#fff", fontSize: ms(15), fontWeight: "700", letterSpacing: 0.3 },
  btnArrow: {
    position: "absolute",
    right: rs(14),
    width: rs(28),
    height: rs(28),
    borderRadius: rs(8),
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Back to Login link ──
  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(6),
    paddingVertical: vs(4),
  },
  backToLoginText: { fontSize: ms(13), fontWeight: "600", color: "#2D9C8E" },

  // ── Success ──
  successBox: {
    alignItems: "center",
    paddingVertical: vs(16),
    gap: vs(10),
  },
  successIconWrap: {
    width: rs(90),
    height: rs(90),
    borderRadius: rs(45),
    backgroundColor: "rgba(45,156,142,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(4),
  },
  successTitle: {
    fontSize: ms(22),
    fontWeight: "800",
    color: "#1a2e35",
    letterSpacing: -0.4,
  },
  successMsg: {
    fontSize: ms(13),
    color: "#6b8f8f",
    textAlign: "center",
    lineHeight: ms(20),
  },

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
});