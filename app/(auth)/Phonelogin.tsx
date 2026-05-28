import { useState, useRef, useEffect } from "react";
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
import { Colors, Radius } from "@/constants/Colors";
import { sendOtpApi, verifyOtpApi } from "@/services/authapi/apiService";
import { useAuth } from "@/context/AuthContext";

// ── Country picker data ──────────────────────────────────────────────────────
const COUNTRIES = [
  { code: "IN", flag: "🇮🇳", dial: "+91" },
  { code: "US", flag: "🇺🇸", dial: "+1" },
  { code: "GB", flag: "🇬🇧", dial: "+44" },
  { code: "AE", flag: "🇦🇪", dial: "+971" },
  { code: "SG", flag: "🇸🇬", dial: "+65" },
  { code: "AU", flag: "🇦🇺", dial: "+61" },
];

const OTP_LENGTH = 4;

export default function PhoneLogin() {
  const { signIn } = useAuth();

  // ── Phone step ─────────────────────────────────────────────────────────────
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // ── OTP step ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // ── Timer for resend ───────────────────────────────────────────────────────
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const [loading, setLoading] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fullPhone = `${country.dial}${phone}`;

  const handleSendOtp = async () => {
    if (!/^\d{7,15}$/.test(phone.trim())) {
      setPhoneError("Enter a valid phone number");
      return;
    }
    setPhoneError("");
    try {
      setLoading(true);
      await sendOtpApi(fullPhone);
      setStep("otp");
      setTimer(30);
    } catch (e: any) {
      setPhoneError(e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setOtpError("Enter the complete OTP");
      return;
    }
    setOtpError("");
    try {
      setLoading(true);
      const data = await verifyOtpApi(fullPhone, code);
      if (data?.token) {
        await signIn(data.token, fullPhone);
        router.replace("/(tabs)/home");
      } else {
        setOtpError(data?.message || "Verification failed");
      }
    } catch (e: any) {
      setOtpError(e.message || "Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, idx: number) => {
    // Allow paste of full OTP
    if (val.length === OTP_LENGTH) {
      const digits = val.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      setOtp(digits);
      otpRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpBackspace = (val: string, idx: number) => {
    if (val === "" && idx > 0) {
      const next = [...otp];
      next[idx] = "";
      setOtp(next);
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    try {
      setLoading(true);
      await sendOtpApi(fullPhone);
      setTimer(30);
    } catch (e: any) {
      setOtpError(e.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <Pressable
          style={styles.backBtn}
          onPress={() => (step === "otp" ? setStep("phone") : router.back())}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </Pressable>
        <View style={{ height: 8 }} />
        <Text style={styles.title}>
          {step === "phone" ? "Welcome back" : "Verify number"}
        </Text>
        <Text style={styles.sub}>
          {step === "phone"
            ? "Log in with your phone number"
            : `OTP sent to ${country.dial} ${phone}`}
        </Text>

        {/* Decorative */}
        <View style={styles.illustrationWrap}>
          <View style={styles.phoneIconWrap}>
            <Ionicons name="phone-portrait-outline" size={26} color="#2D9C8E" />
          </View>
          <View style={styles.shieldWrap}>
            <Ionicons name="shield-checkmark" size={26} color="#2D9C8E" />
          </View>
        </View>
      </View>

      {/* ── Form ── */}
      <View style={styles.form}>
        {step === "phone" ? (
          <>
            {/* Phone row */}
            <View>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <View
                style={[styles.inputRow, !!phoneError && styles.inputError]}
              >
                {/* Country picker trigger */}
                <Pressable
                  style={styles.dialBtn}
                  onPress={() => setShowPicker((v) => !v)}
                >
                  <Text style={styles.dialFlag}>{country.flag}</Text>
                  <Text style={styles.dialCode}>{country.dial}</Text>
                  <Ionicons
                    name={showPicker ? "chevron-up" : "chevron-down"}
                    size={12}
                    color={Colors.textMuted}
                  />
                </Pressable>

                {/* Divider */}
                <View style={styles.dialDivider} />

                <TextInput
                  style={styles.inputField}
                  placeholder="Enter phone number"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v.replace(/\D/g, ""));
                    setPhoneError("");
                  }}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />

                {/* Use email link — right end */}
                <Pressable onPress={() => router.replace("/(auth)/login")}>
                  <Text style={styles.useEmailLink}>Use email</Text>
                </Pressable>
              </View>

              {!!phoneError && (
                <View style={styles.errorRow}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={13}
                    color="#EF4444"
                  />
                  <Text style={styles.errorText}>{phoneError}</Text>
                </View>
              )}

              {/* Country dropdown */}
              {showPicker && (
                <View style={styles.pickerDropdown}>
                  {COUNTRIES.map((c) => (
                    <Pressable
                      key={c.code}
                      style={[
                        styles.pickerRow,
                        c.code === country.code && styles.pickerRowActive,
                      ]}
                      onPress={() => {
                        setCountry(c);
                        setShowPicker(false);
                      }}
                    >
                      <Text style={styles.pickerFlag}>{c.flag}</Text>
                      <Text style={styles.pickerDial}>{c.dial}</Text>
                      <Text style={styles.pickerCode}>{c.code}</Text>
                      {c.code === country.code && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={Colors.primary}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Send OTP button */}
            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && !loading && { opacity: 0.85 },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Send OTP</Text>
              )}
            </Pressable>

            {/* Sign Up */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/signup")}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {/* OTP boxes */}
            <View>
              <Text style={styles.label}>ENTER OTP</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(r) => {
                      otpRefs.current[idx] = r;
                    }}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      !!otpError ? styles.otpBoxError : null,
                    ]}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, idx)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === "Backspace")
                        handleOtpBackspace(otp[idx], idx);
                    }}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH} // supports paste
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>
              {!!otpError && (
                <View style={styles.errorRow}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={13}
                    color="#EF4444"
                  />
                  <Text style={styles.errorText}>{otpError}</Text>
                </View>
              )}
            </View>

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive OTP? </Text>
              <Pressable onPress={handleResend} disabled={timer > 0 || loading}>
                <Text
                  style={[
                    styles.resendLink,
                    timer > 0 && styles.resendDisabled,
                  ]}
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend"}
                </Text>
              </Pressable>
            </View>

            {/* Verify button */}
            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && !loading && { opacity: 0.85 },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Verify & Login</Text>
              )}
            </Pressable>

            {/* Change number */}
            <Pressable
              style={styles.changeNumberRow}
              onPress={() => {
                setStep("phone");
                setOtp(Array(OTP_LENGTH).fill(""));
                setOtpError("");
              }}
            >
              <Ionicons
                name="pencil-outline"
                size={13}
                color={Colors.primary}
              />
              <Text style={styles.changeNumberText}>Change number</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Hero ──────────────────────────────────────────────────────────────────
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
  phoneIconWrap: {
    width: 56,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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

  // ── Form ──────────────────────────────────────────────────────────────────
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
  inputField: { flex: 1, fontSize: 13, fontWeight: "500", color: Colors.text },

  // ── Dial / country picker ─────────────────────────────────────────────────
  dialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dialFlag: { fontSize: 16 },
  dialCode: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    minWidth: 32,
  },
  dialDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },
  pickerDropdown: {
    marginTop: 4,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: "hidden",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  pickerRowActive: { backgroundColor: `${Colors.primary}18` },
  pickerFlag: { fontSize: 18 },
  pickerDial: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    width: 44,
  },
  pickerCode: { flex: 1, fontSize: 13, color: Colors.textMuted },

  // ── "Use email" link ──────────────────────────────────────────────────────
  useEmailLink: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    textDecorationLine: "underline",
  },

  // ── Errors ────────────────────────────────────────────────────────────────
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  errorText: { fontSize: 12, color: "#EF4444", fontWeight: "500", flex: 1 },

  // ── Buttons ───────────────────────────────────────────────────────────────
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 2,
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // ── Sign up row ───────────────────────────────────────────────────────────
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 4,
  },
  signupText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },
  signupLink: { fontSize: 13, color: Colors.primary, fontWeight: "700" },

  // ── OTP ───────────────────────────────────────────────────────────────────
  otpRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 48,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}12`,
  },
  otpBoxError: { borderColor: "#EF4444" },

  // ── Resend ────────────────────────────────────────────────────────────────
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },
  resendLink: { fontSize: 13, color: Colors.primary, fontWeight: "700" },
  resendDisabled: { color: Colors.textMuted },

  // ── Change number ─────────────────────────────────────────────────────────
  changeNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  changeNumberText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
});
