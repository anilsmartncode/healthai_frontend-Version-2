import { useState, useRef, useEffect } from "react";
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


const { width: SW, height: SH } = Dimensions.get("window");
const rs = (size: number) => (SW / 390) * size;
const vs = (size: number) => (SH / 844) * size;
const ms = (size: number, f = 0.5) => size + (rs(size) - size) * f;

// ── Step types ────────────────────────────────────────
type Step = "email" | "otp" | "reset" | "success";

// ── OTP Styles (must be defined BEFORE OtpInput) ──────
const otpStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: rs(10),
    justifyContent: "center",
  },
  box: {
    width: rs(46),
    height: rs(52),
    borderRadius: rs(12),
    borderWidth: 1.5,
    borderColor: "#E2ECEC",
    backgroundColor: "#F7FAFA",
    fontSize: ms(20),
    fontWeight: "700",
    color: "#1a2e35",
    textAlign: "center" as const,
  },
  boxFilled: {
    borderColor: "#2D9C8E",
    backgroundColor: "rgba(45,156,142,0.06)",
  },
});

// ── OTP Input ─────────────────────────────────────────
function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const digits = value.padEnd(4, " ").split("").slice(0, 4).map((d) => d.trim());

  const handleChange = (text: string, idx: number) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(-1);
    const next = digits.map((d, i) => (i === idx ? cleaned : d)).join("");
    onChange(next.slice(0, 4));
    if (cleaned && idx < 3) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
      const next = digits.map((d, i) => (i === idx - 1 ? "" : d)).join("");
      onChange(next);
    }
  };

  return (
    <View style={otpStyles.row}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(r) => { inputs.current[i] = r; }}
          style={[otpStyles.box, d ? otpStyles.boxFilled : {}]}
          value={d}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

// ── Main Component ────────────────────────────────────
export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  // ── Step 1: Send OTP ──
  // 🔴 REAL — uncomment forgotPasswordApi and comment out mock delay to use REAL
  // 🟢 MOCK — currently active (using mock delay). comment out forgotPasswordApi line to keep mock
  const handleSendOtp = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }
    try {
      setLoading(true);
      // await forgotPasswordApi(email);              // 🔴 REAL — uncomment this
      await new Promise((r) => setTimeout(r, 1000)); // 🟢 MOCK — comment this out when using REAL
      setResendTimer(60);
      setStep("otp");
    } catch (e: any) {
      setErrors({ email: e.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──
  // 🔴 REAL — uncomment verifyOtpApi and comment out mock delay to use REAL
  // 🟢 MOCK — currently active (using mock delay). comment out verifyOtpApi line to keep mock
  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setErrors({ otp: "Enter the 4-digit code" });
      return;
    }
    try {
      setLoading(true);
      // await verifyOtpApi(email, otp);            // 🔴 REAL — uncomment this (mock OTP: 1234)
      await new Promise((r) => setTimeout(r, 800)); // 🟢 MOCK — comment this out when using REAL
      setStep("reset");
    } catch (e: any) {
      setErrors({ otp: e.message || "Invalid or expired code" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ──
  // 🔴 REAL — uncomment resetPasswordApi and comment out mock delay to use REAL
  // 🟢 MOCK — currently active (using mock delay). comment out resetPasswordApi line to keep mock
  const handleResetPassword = async () => {
    const next: typeof errors = {};
    if (!newPassword || newPassword.length < 6)
      next.newPassword = "Password must be at least 6 characters";
    if (newPassword !== confirmPassword)
      next.confirmPassword = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      setLoading(true);
      // await resetPasswordApi(email, otp, newPassword);  // 🔴 REAL — uncomment this
      await new Promise((r) => setTimeout(r, 900));        // 🟢 MOCK — comment this out when using REAL
      setStep("success");
    } catch (e: any) {
      setErrors({ newPassword: e.message || "Reset failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  // ── Step config ──
  const stepConfig = {
    email: { num: 1, label: "Email" },
    otp: { num: 2, label: "Verify" },
    reset: { num: 3, label: "Reset" },
    success: { num: 3, label: "Reset" },
  };
  const steps = ["Email", "Verify", "Reset"];
  const currentNum = stepConfig[step].num;

  // ── Render ──
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
            else if (step === "otp") setStep("email");
            else if (step === "reset") setStep("otp");
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
                  name={
                    step === "success"
                      ? "checkmark-circle"
                      : step === "reset"
                      ? "lock-closed"
                      : step === "otp"
                      ? "keypad"
                      : "mail"
                  }
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
            {step === "success"
              ? "Password Reset! 🎉"
              : step === "reset"
              ? "Create New Password"
              : step === "otp"
              ? "Check Your Email"
              : "Forgot Password?"}
          </Text>
          <Text style={styles.heroSub}>
            {step === "success"
              ? "Your password has been updated.\nYou can now log in with your new password."
              : step === "reset"
              ? "Your new password must be different\nfrom previously used passwords."
              : step === "otp"
              ? `We sent a 4-digit code to\n${email}`
              : "No worries! Enter your email and\nwe'll send you a reset code."}
          </Text>
        </View>

        {/* Progress stepper — hidden on success */}
        {step !== "success" && (
          <View style={styles.stepper}>
            {steps.map((label, i) => {
              const stepNum = i + 1;
              const done = stepNum < currentNum;
              const active = stepNum === currentNum;
              return (
                <View key={label} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      done && styles.stepDone,
                      active && styles.stepActive,
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={ms(12)} color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.stepNum,
                          active && styles.stepNumActive,
                        ]}
                      >
                        {stepNum}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      active && styles.stepLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                  {i < steps.length - 1 && (
                    <View
                      style={[styles.stepLine, done && styles.stepLineDone]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}
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
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Send Reset Code</Text>
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

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
          <>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Verification Code</Text>
              <Text style={styles.fieldHint}>
                Enter the 4-digit code sent to your email
              </Text>
              <View style={{ marginTop: vs(10) }}>
                <OtpInput value={otp} onChange={(v) => { setOtp(v); clearError("otp"); }} />
              </View>
              {!!errors.otp && (
                <View style={[styles.errorRow, { justifyContent: "center", marginTop: vs(8) }]}>
                  <Ionicons name="alert-circle-outline" size={ms(13)} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.otp}</Text>
                </View>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && !loading && { opacity: 0.9 },
                loading && { opacity: 0.75 },
              ]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Verify Code</Text>
                  <View style={styles.btnArrow}>
                    <Ionicons name="arrow-forward" size={ms(15)} color="#2D9C8E" />
                  </View>
                </>
              )}
            </Pressable>

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
              ) : (
                <Pressable
                  onPress={() => {
                    setResendTimer(60);
                    // await resendOtpApi(email)
                  }}
                >
                  <Text style={styles.resendLink}>Resend Code</Text>
                </Pressable>
              )}
            </View>

            {/* Email info row */}
            <View style={styles.emailInfoRow}>
              <Ionicons name="mail-outline" size={ms(15)} color="#2D9C8E" />
              <Text style={styles.emailInfoText} numberOfLines={1}>
                {email}
              </Text>
              <Pressable onPress={() => setStep("email")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.changeText}>Change</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ── Step 3: Reset ── */}
        {step === "reset" && (
          <>
            {/* New Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={[styles.inputRow, !!errors.newPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={ms(18)} color="#aab" />
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter new password"
                  placeholderTextColor="#b0bec5"
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); clearError("newPassword"); }}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowNew((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={showNew ? "eye-off-outline" : "eye-outline"}
                    size={ms(18)}
                    color="#aab"
                  />
                </Pressable>
              </View>
              {!!errors.newPassword && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={ms(13)} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={[styles.inputRow, !!errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={ms(18)} color="#aab" />
                <TextInput
                  style={styles.inputField}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#b0bec5"
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); clearError("confirmPassword"); }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowConfirm((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={ms(18)}
                    color="#aab"
                  />
                </Pressable>
              </View>
              {!!errors.confirmPassword && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={ms(13)} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                </View>
              )}
            </View>

            {/* Password strength hints */}
            <View style={styles.hintBox}>
              <PasswordHint met={newPassword.length >= 6} text="At least 6 characters" />
              <PasswordHint met={/[A-Z]/.test(newPassword)} text="One uppercase letter" />
              <PasswordHint met={/[0-9]/.test(newPassword)} text="One number" />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && !loading && { opacity: 0.9 },
                loading && { opacity: 0.75 },
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Reset Password</Text>
                  <View style={styles.btnArrow}>
                    <Ionicons name="arrow-forward" size={ms(15)} color="#2D9C8E" />
                  </View>
                </>
              )}
            </Pressable>
          </>
        )}

        {/* ── Step 4: Success ── */}
        {step === "success" && (
          <>
            <View style={styles.successBox}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={ms(56)} color="#2D9C8E" />
              </View>
              <Text style={styles.successTitle}>All Done!</Text>
              <Text style={styles.successMsg}>
                Your password has been reset successfully. You can now log in with your new credentials.
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

// ── Password Hint Row ─────────────────────────────────
function PasswordHint({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={hintStyles.row}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={ms(14)}
        color={met ? "#2D9C8E" : "#b0bec5"}
      />
      <Text style={[hintStyles.text, met && hintStyles.textMet]}>{text}</Text>
    </View>
  );
}

const hintStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: rs(6) },
  text: { fontSize: ms(12), color: "#b0bec5", fontWeight: "500" },
  textMet: { color: "#2D9C8E" },
});

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

  // ── Stepper ──
  stepper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 0,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
  },
  stepCircle: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: "#C8E8E5",
    backgroundColor: "#F0FAF9",
    justifyContent: "center",
    alignItems: "center",
  },
  stepDone: { backgroundColor: "#2D9C8E", borderColor: "#2D9C8E" },
  stepActive: { backgroundColor: "#fff", borderColor: "#2D9C8E" },
  stepNum: { fontSize: ms(11), fontWeight: "700", color: "#aab" },
  stepNumActive: { color: "#2D9C8E" },
  stepLabel: { fontSize: ms(11), color: "#aab", fontWeight: "500" },
  stepLabelActive: { color: "#2D9C8E", fontWeight: "700" },
  stepLine: {
    width: rs(24),
    height: 1.5,
    backgroundColor: "#C8E8E5",
    marginHorizontal: rs(4),
  },
  stepLineDone: { backgroundColor: "#2D9C8E" },

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
  fieldHint: {
    fontSize: ms(12),
    color: "#8aabab",
    fontWeight: "400",
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

  // ── Resend ──
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: { fontSize: ms(13), color: "#8aabab", fontWeight: "500" },
  resendLink: { fontSize: ms(13), color: "#2D9C8E", fontWeight: "700" },
  resendTimer: { fontSize: ms(13), color: "#aab", fontWeight: "600" },

  // ── Email info ──
  emailInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    backgroundColor: "#F0FAF9",
    borderRadius: rs(12),
    padding: rs(12),
    borderWidth: 1,
    borderColor: "#C8E8E5",
  },
  emailInfoText: { flex: 1, fontSize: ms(12), color: "#1a2e35", fontWeight: "500" },
  changeText: { fontSize: ms(12), color: "#2D9C8E", fontWeight: "700" },

  // ── Hints ──
  hintBox: {
    backgroundColor: "#F7FAFA",
    borderRadius: rs(12),
    padding: rs(14),
    gap: vs(8),
    borderWidth: 1,
    borderColor: "#E2ECEC",
  },

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