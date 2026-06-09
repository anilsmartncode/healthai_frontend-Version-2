import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  useWindowDimensions,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, ClipPath, Rect, Defs } from "react-native-svg";
import { sendOtpApi, verifyOtpApi } from "@/services/authapi/apiService";
import { useAuth } from "@/context/AuthContext";

// ── Scalers ───────────────────────────────────────────
function useScalers() {
  const { width: SW, height: SH } = useWindowDimensions();
  const rs = (n: number) => (SW / 390) * n;
  const vs = (n: number) => (SH / 844) * n;
  const ms = (n: number, f = 0.5) => n + (rs(n) - n) * f;
  return { rs, vs, ms, SW, SH };
}

type Step = "phone" | "otp";
type PickerType = "google" | "apple" | null; // 🟢 MOCK — remove when using real SDK

interface Country {
  name: string;
  code: string;
  dial: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { name: "India",          code: "IN", dial: "+91",  flag: "🇮🇳" },
  { name: "United States",  code: "US", dial: "+1",   flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dial: "+44",  flag: "🇬🇧" },
  { name: "Australia",      code: "AU", dial: "+61",  flag: "🇦🇺" },
  { name: "Canada",         code: "CA", dial: "+1",   flag: "🇨🇦" },
  { name: "Germany",        code: "DE", dial: "+49",  flag: "🇩🇪" },
  { name: "France",         code: "FR", dial: "+33",  flag: "🇫🇷" },
  { name: "UAE",            code: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "Singapore",      code: "SG", dial: "+65",  flag: "🇸🇬" },
  { name: "Japan",          code: "JP", dial: "+81",  flag: "🇯🇵" },
  { name: "Brazil",         code: "BR", dial: "+55",  flag: "🇧🇷" },
  { name: "South Africa",   code: "ZA", dial: "+27",  flag: "🇿🇦" },
  { name: "Nigeria",        code: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "Pakistan",       code: "PK", dial: "+92",  flag: "🇵🇰" },
  { name: "Bangladesh",     code: "BD", dial: "+880", flag: "🇧🇩" },
  { name: "Indonesia",      code: "ID", dial: "+62",  flag: "🇮🇩" },
  { name: "Philippines",    code: "PH", dial: "+63",  flag: "🇵🇭" },
  { name: "Malaysia",       code: "MY", dial: "+60",  flag: "🇲🇾" },
  { name: "Kenya",          code: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Mexico",         code: "MX", dial: "+52",  flag: "🇲🇽" },
];

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

// ── OTP Input (4-box) — auto-reads OTP on Android ─────
function OtpInput({
  value,
  onChange,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
}) {
  const { rs, ms } = useScalers();
  const inputs = useRef<(TextInput | null)[]>([]);
  const OTP_LENGTH = 4;
  const digits = value.padEnd(OTP_LENGTH, " ").split("").slice(0, OTP_LENGTH);

  const handleChange = (text: string, idx: number) => {
    // On Android, OTP auto-fill may deliver all digits at once into box 0
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length > 1) {
      // Auto-filled: distribute digits across boxes
      const filled = cleaned.slice(0, OTP_LENGTH);
      onChange(filled.padEnd(OTP_LENGTH, " ").slice(0, OTP_LENGTH));
      const lastIdx = Math.min(filled.length - 1, OTP_LENGTH - 1);
      inputs.current[lastIdx]?.focus();
      if (filled.length === OTP_LENGTH && onComplete) onComplete(filled);
      return;
    }
    const single = cleaned.slice(-1);
    const next = digits.map((d, i) => (i === idx ? (single || " ") : d)).join("");
    onChange(next.slice(0, OTP_LENGTH));
    if (single && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
    if (single && idx === OTP_LENGTH - 1 && onComplete) {
      const complete = next.slice(0, OTP_LENGTH).trim();
      if (complete.length === OTP_LENGTH) onComplete(complete);
    }
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === "Backspace" && !digits[idx]?.trim() && idx > 0) {
      inputs.current[idx - 1]?.focus();
      const next = digits.map((d, i) => (i === idx - 1 ? " " : d)).join("");
      onChange(next);
    }
  };

  const boxSize = rs(62);

  return (
    <View style={{ flexDirection: "row", gap: rs(12), justifyContent: "center" }}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(r) => { inputs.current[i] = r; }}
          style={{
            width: boxSize,
            height: boxSize,
            borderRadius: rs(14),
            borderWidth: 2,
            borderColor: d.trim() ? "#2D9C8E" : "#E2ECEC",
            backgroundColor: d.trim() ? "rgba(45,156,142,0.08)" : "#F7FAFA",
            fontSize: ms(24),
            fontWeight: "700",
            color: "#1a2e35",
            textAlign: "center",
            textAlignVertical: "center",
            includeFontPadding: false,
            padding: 0,
          }}
          value={d.trim()}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? 4 : 1} // first box can receive full OTP from autofill
          textAlign="center"
          textAlignVertical="center"
          selectTextOnFocus
          autoFocus={i === 0}
          caretHidden
          // Android OTP auto-read
          autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
          textContentType={Platform.OS === "ios" ? "oneTimeCode" : undefined}
        />
      ))}
    </View>
  );
}

// ── Mock Account Picker ───────────────────────────────
// 🟢 MOCK ONLY — delete this entire component when integrating real SDK
const MOCK_GOOGLE_ACCOUNTS = [
  { email: "john.doe@gmail.com",      name: "John Doe",      initials: "JD" },
  { email: "sarah.smith@gmail.com",   name: "Sarah Smith",   initials: "SS" },
  { email: "test.user@googlemail.com",name: "Test User",     initials: "TU" },
];

const MOCK_APPLE_ACCOUNTS = [
  { email: "john.doe@icloud.com",             name: "John Doe",    initials: "JD" },
  { email: "j.doe@privaterelay.appleid.com",  name: "J. Doe",      initials: "JD" },
];

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
  const isGoogle = type === "google";
  const accounts = isGoogle ? MOCK_GOOGLE_ACCOUNTS : MOCK_APPLE_ACCOUNTS;
  const brandColor = isGoogle ? "#4285F4" : "#1a1a1a";
  const brandName  = isGoogle ? "Google"  : "Apple";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Dim overlay */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}
        onPress={onClose}
      >
        {/* Card */}
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
                Sign in with {brandName}
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
                <Text style={{ fontSize: ms(14), fontWeight: "600", color: "#1a2e35" }}>
                  {acc.name}
                </Text>
                <Text style={{ fontSize: ms(12), color: "#8aabab", marginTop: vs(1) }}>
                  {acc.email}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(14)} color="#ccc" />
            </Pressable>
          ))}

          {/* Footer */}
          <View style={{
            borderTopWidth: 1,
            borderTopColor: "#F0F0F0",
            padding: rs(14),
            alignItems: "center",
          }}>
            <Text style={{ fontSize: ms(11), color: "#b0bec5", fontWeight: "500" }}>
              🟢 Mock picker — replace with real {brandName} SDK
            </Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Country Picker Modal ───────────────────────────────
function CountryPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Country;
  onSelect: (c: Country) => void;
  onClose: () => void;
}) {
  const { rs, vs, ms, SH } = useScalers();
  const [search, setSearch] = useState("");
  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} onPress={onClose} />
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
        maxHeight: SH * 0.72,
        paddingHorizontal: rs(20), paddingBottom: vs(32),
      }}>
        <View style={{ width: rs(36), height: vs(4), backgroundColor: "#E2ECEC", borderRadius: rs(2), alignSelf: "center", marginTop: vs(10), marginBottom: vs(14) }} />
        <Text style={{ fontSize: ms(16), fontWeight: "800", color: "#1a2e35", marginBottom: vs(12), letterSpacing: -0.3 }}>Select Country</Text>

        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F7FAFA", borderWidth: 1.5, borderColor: "#E2ECEC", borderRadius: rs(12), paddingHorizontal: rs(12), paddingVertical: vs(10), gap: rs(8), marginBottom: vs(10) }}>
          <Ionicons name="search-outline" size={ms(16)} color="#aab" />
          <TextInput
            style={{ flex: 1, fontSize: ms(13), color: "#1a2e35", fontWeight: "500" }}
            placeholder="Search country or code..."
            placeholderTextColor="#b0bec5"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={ms(16)} color="#aab" />
            </Pressable>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={[
                { flexDirection: "row", alignItems: "center", gap: rs(12), paddingVertical: vs(11), paddingHorizontal: rs(4), borderRadius: rs(10) },
                item.code === selected.code && { backgroundColor: "rgba(45,156,142,0.06)" },
              ]}
              onPress={() => { onSelect(item); onClose(); setSearch(""); }}
            >
              <Text style={{ fontSize: ms(22) }}>{item.flag}</Text>
              <Text style={{ flex: 1, fontSize: ms(13), fontWeight: "600", color: "#1a2e35" }}>{item.name}</Text>
              <Text style={{ fontSize: ms(13), fontWeight: "600", color: "#2D9C8E" }}>{item.dial}</Text>
              {item.code === selected.code && (
                <Ionicons name="checkmark-circle" size={ms(16)} color="#2D9C8E" />
              )}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#F0F7F6" }} />}
          ListEmptyComponent={
            <View style={{ paddingVertical: vs(24), alignItems: "center" }}>
              <Text style={{ fontSize: ms(13), color: "#8aabab", fontWeight: "500" }}>No countries found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────
export default function PhoneSignup() {
  const { signIn } = useAuth();
  const { rs, vs, ms } = useScalers();

  const [step, setStep]                   = useState<Step>("phone");
  const [country, setCountry]             = useState<Country>(COUNTRIES[0]);
  const [phone, setPhone]                 = useState("");
  const [otp, setOtp]                     = useState("");
  const [loading, setLoading]             = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [resendTimer, setResendTimer]     = useState(0);
  const [errors, setErrors]               = useState<{
    phone?: string;
    otp?: string;
  }>({});

  const phoneInputRef = useRef<TextInput>(null);

  // 🟢 MOCK — account picker state (remove when using real SDK)
  const [accountPicker, setAccountPicker] = useState<"google" | "apple" | null>(null);

  // Auto-focus phone input when screen mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const fullNumber = `${country.dial}${phone}`;

  // ── Step 1: Validate phone & send OTP ──
  // 🔴 REAL — uncomment this and comment out MOCK below when API is ready
  /*
  const handleSendOtp = async () => {
    const next: typeof errors = {};
    if (!phone.trim() || phone.replace(/\D/g, "").length < 7)
      next.phone = "Enter a valid phone number";
    if (Object.keys(next).length) { setErrors(next); return; }
    try {
      setLoading(true);
      await sendOtpApi(fullNumber);
      setResendTimer(60);
      setStep("otp");
    } catch (e: any) {
      setErrors({ phone: e.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };
  */

  // 🟢 MOCK — comment out this and uncomment REAL above when API is ready
  const handleSendOtp = async () => {
    const next: typeof errors = {};
    if (!phone.trim() || phone.replace(/\D/g, "").length < 7)
      next.phone = "Enter a valid phone number";
    if (Object.keys(next).length) { setErrors(next); return; }
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 900));        // fake network delay
      console.log("[MOCK] OTP sent to", fullNumber, "→ use 1234");
      setResendTimer(60);
      setStep("otp");
    } catch (e: any) {
      setErrors({ phone: e.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ── (called automatically when 4 digits filled)
  // 🔴 REAL — uncomment this and comment out MOCK below when API is ready
  /*
  const handleVerifyOtp = async (otpValue?: string) => {
    const code = otpValue ?? otp;
    if (code.replace(/\s/g, "").length < 4) {
      setErrors({ otp: "Enter the 4-digit code" });
      return;
    }
    try {
      setLoading(true);
      const verifyData = await verifyOtpApi(fullNumber, code.trim());
      if (verifyData?.token) {
        await signIn(verifyData.token, fullNumber);
        router.replace("/(auth)/onboarding");
      } else if (verifyData?.verified === true) {
        router.replace("/(auth)/onboarding");
      } else {
        setErrors({ otp: verifyData?.message || "Verification failed" });
      }
    } catch (e: any) {
      setErrors({ otp: e.message || "Invalid or expired code" });
    } finally {
      setLoading(false);
    }
  };
  */

  // 🟢 MOCK — comment out this and uncomment REAL above when API is ready
  const handleVerifyOtp = async (otpValue?: string) => {
    const code = otpValue ?? otp;
    if (code.replace(/\s/g, "").length < 4) { setErrors({ otp: "Enter the 4-digit code" }); return; }
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800));        // fake network delay
      if (code.trim() !== "1234") throw new Error("Invalid OTP. Use: 1234");
      await signIn("mock-token-phonesignup", fullNumber);
      router.replace("/(auth)/onboarding");
    } catch (e: any) {
      setErrors({ otp: e.message || "Invalid or expired code" });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 MOCK — Google Sign-In: shows fake account picker
  // 🔴 REAL: delete handleGoogleSignIn entirely and replace onPress with your SDK call
  const handleGoogleSignIn = () => {
    console.log("[DEBUG] Google button tapped");
    Alert.alert("Debug", "Google tapped"); // remove after confirming tap works
    setAccountPicker("google");
  };

  // 🟢 MOCK — Apple Sign-In: shows fake account picker
  // 🔴 REAL: delete handleAppleSignIn entirely and replace onPress with your SDK call
  const handleAppleSignIn = () => {
    console.log("[DEBUG] Apple button tapped");
    Alert.alert("Debug", "Apple tapped"); // remove after confirming tap works
    setAccountPicker("apple");
  };

  // 🟢 MOCK — called when user picks an account from the fake picker
  // 🔴 REAL: this whole function goes away — the SDK gives you the token directly
  const handleMockAccountSelect = async (email: string) => {
    setAccountPicker(null);
    const isGoogle = email.includes("gmail") || email.includes("googlemail");
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 900));            // fake network delay
      const mockToken = isGoogle ? "mock-token-google" : "mock-token-apple";
      console.log("[MOCK] Account selected →", email, "token →", mockToken);
      await signIn(mockToken, email);
      router.replace("/(auth)/onboarding");
    } catch (e: any) {
      setErrors({ phone: e.message || "Sign-In failed" });
    } finally {
      setLoading(false);
    }
  };

  // ── OTP auto-complete handler ──
  const handleOtpComplete = (filled: string) => {
    setOtp(filled);
    // Auto-submit after short delay to let state settle
    setTimeout(() => handleVerifyOtp(filled), 300);
  };

  // ── Resend OTP ──
  // 🔴 REAL — uncomment this and comment out MOCK below when API is ready
  /*
  const handleResend = async () => {
    setOtp("");
    clearError("otp");
    try {
      setLoading(true);
      await sendOtpApi(fullNumber);
      setResendTimer(60);
    } catch (e: any) {
      setErrors({ otp: e.message || "Failed to resend OTP" });
    } finally {
      setLoading(false);
    }
  };
  */

  // 🟢 MOCK — comment out this and uncomment REAL above when API is ready
  const handleResend = async () => {
    setOtp(""); clearError("otp");
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 900));        // fake network delay
      console.log("[MOCK] OTP resent to", fullNumber, "→ use 1234");
      setResendTimer(60);
    } catch (e: any) {
      setErrors({ otp: e.message || "Failed to resend OTP" });
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(rs, vs, ms);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
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
              <Text style={styles.welcomeTitle}>
                {step === "otp" ? "Verify Number 📲" : "Sign Up 👋"}
              </Text>
              <Text style={styles.welcomeSub}>
                {step === "otp"
                  ? `We sent a 4-digit code to\n${country.flag} ${fullNumber}`
                  : "Enter your phone number to get started."}
              </Text>
            </View>

            <View style={styles.decorWrap}>
              <View style={styles.phoneCircle}>
                <Ionicons
                  name={step === "otp" ? "chatbubble-ellipses" : "phone-portrait-outline"}
                  size={ms(44)}
                  color="#2D9C8E"
                />
              </View>
              <View style={styles.heartBadge}>
                <Ionicons name="heart" size={ms(15)} color="#2D9C8E" />
              </View>
              <View style={styles.docBadge}>
                <Ionicons name="pulse-outline" size={ms(14)} color="#2D9C8E" />
              </View>
            </View>
          </View>

          <View style={styles.stepDots}>
            <View style={[styles.dot, step === "phone" && styles.dotActive]} />
            <View style={[styles.dot, step === "otp"   && styles.dotActive]} />
          </View>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.card}>

          {/* ══ STEP 1: Phone only ══ */}
          {step === "phone" && (
            <>
              {/* Phone Number */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={[styles.phoneRow, !!errors.phone && styles.inputError]}>
                  <Pressable
                    style={styles.dialPicker}
                    onPress={() => setPickerVisible(true)}
                  >
                    <Text style={styles.flagText}>{country.flag}</Text>
                    <Text style={styles.dialText}>{country.dial}</Text>
                    <Ionicons name="chevron-down" size={ms(12)} color="#aab" />
                  </Pressable>
                  <View style={styles.phoneDivider} />
                  <TextInput
                    ref={phoneInputRef}
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    placeholderTextColor="#b0bec5"
                    value={phone}
                    onChangeText={(v) => { setPhone(v.replace(/[^0-9]/g, "")); clearError("phone"); }}
                    keyboardType="phone-pad"
                    maxLength={13}
                    autoFocus
                  />
                </View>
                {!!errors.phone && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={ms(13)} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  </View>
                )}

                <Pressable
                  style={styles.switchRow}
                  onPress={() => router.replace("/(auth)/signup")}
                >
                  <Text style={styles.switchText}>Use email instead</Text>
                  <Ionicons name="chevron-forward" size={ms(13)} color="#2D9C8E" />
                </Pressable>
              </View>

              {/* Info box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={ms(16)} color="#2D9C8E" />
                <Text style={styles.infoText}>
                  We'll send a one-time verification code to confirm your number.
                </Text>
              </View>

              {/* Send OTP button */}
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
                    <Text style={styles.primaryBtnText}>Send OTP</Text>
                    <View style={styles.btnArrow}>
                      <Ionicons name="arrow-forward" size={ms(15)} color="#2D9C8E" />
                    </View>
                  </>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or sign up with</Text>
                <View style={styles.orLine} />
              </View>

              {/* Social */}
              <Pressable
                style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.8 }]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <GoogleIcon />
                <Text style={styles.socialText}>Continue with Google</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.8 }]}
                onPress={handleAppleSignIn}
                disabled={loading}
              >
                <AppleIcon />
                <Text style={styles.socialText}>Continue with Apple</Text>
              </Pressable>

              {/* Login link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Pressable
                  onPress={() => router.push("/(auth)/login")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.loginLink}>Login</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ══ STEP 2: OTP Verify ══ */}
          {step === "otp" && (
            <>
              {/* Phone info strip */}
              <View style={styles.phoneInfoRow}>
                <Text style={styles.phoneInfoFlag}>{country.flag}</Text>
                <Text style={styles.phoneInfoNumber}>{fullNumber}</Text>
                <Pressable
                  onPress={() => { setStep("phone"); setOtp(""); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.changeText}>Change</Text>
                </Pressable>
              </View>

              {/* OTP boxes */}
              <View style={[styles.fieldWrap, { overflow: "visible" }]}>
                <Text style={styles.fieldLabel}>Verification Code</Text>
                <Text style={styles.fieldHint}>
                  {loading
                    ? "Verifying code automatically…"
                    : "Enter the 4-digit code sent via SMS"}
                </Text>
                <View style={{ marginTop: vs(14), paddingVertical: vs(4), overflow: "visible" }}>
                  <OtpInput
                    value={otp}
                    onChange={(v) => { setOtp(v); clearError("otp"); }}
                    onComplete={handleOtpComplete}
                  />
                </View>
                {loading && (
                  <View style={{ alignItems: "center", marginTop: vs(10) }}>
                    <ActivityIndicator size="small" color="#2D9C8E" />
                  </View>
                )}
                {!!errors.otp && (
                  <View style={[styles.errorRow, { justifyContent: "center", marginTop: vs(8) }]}>
                    <Ionicons name="alert-circle-outline" size={ms(13)} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.otp}</Text>
                  </View>
                )}
              </View>

              {/* Verify button (manual fallback) */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && !loading && { opacity: 0.9 },
                  loading && { opacity: 0.75 },
                ]}
                onPress={() => handleVerifyOtp()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Verify & Continue</Text>
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
                  <Pressable onPress={handleResend} disabled={loading}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </Pressable>
                )}
              </View>

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

              {/* Back */}
              <Pressable
                style={styles.backRow}
                onPress={() => { setStep("phone"); setOtp(""); }}
              >
                <Ionicons name="arrow-back" size={ms(14)} color="#2D9C8E" />
                <Text style={styles.backText}>Back to phone number</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      <CountryPicker
        visible={pickerVisible}
        selected={country}
        onSelect={setCountry}
        onClose={() => setPickerVisible(false)}
      />

      {/* 🟢 MOCK account picker — delete when using real SDK */}
      <MockAccountPicker
        visible={accountPicker !== null}
        type={accountPicker}
        onSelect={handleMockAccountSelect}
        onClose={() => setAccountPicker(null)}
      />
    </>
  );
}

// ── Styles ────────────────────────────────────────────
const makeStyles = (
  rs: (n: number) => number,
  vs: (n: number) => number,
  ms: (n: number, f?: number) => number,
) =>
  StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#EAF6F5" },
  scrollContent: { flexGrow: 1 },

  hero: {
    backgroundColor: "#EAF6F5",
    paddingHorizontal: rs(20),
    paddingTop: vs(52),
    paddingBottom: vs(20),
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
  logoText:   { fontSize: ms(17), fontWeight: "800", color: "#1a2e35", letterSpacing: -0.3 },
  logoAccent: { color: "#2D9C8E" },
  logoSub:    { fontSize: ms(11), color: "#7a9a9a", fontWeight: "500" },
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

  heroBody:     { flexDirection: "row", alignItems: "center", gap: rs(8) },
  welcomeWrap:  { flex: 1 },
  welcomeTitle: { fontSize: ms(22), fontWeight: "800", color: "#1a2e35", marginBottom: vs(6), letterSpacing: -0.5 },
  welcomeSub:   { fontSize: ms(12), color: "#6b8f8f", lineHeight: ms(18), fontWeight: "400" },

  decorWrap: {
    width: rs(100),
    aspectRatio: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 1,
  },
  phoneCircle: {
    width: "90%",
    aspectRatio: 1,
    borderRadius: rs(999),
    backgroundColor: "rgba(45,156,142,0.1)",
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

  stepDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: rs(6),
    marginTop: vs(14),
  },
  dot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: "rgba(45,156,142,0.25)",
  },
  dotActive: { width: rs(18), backgroundColor: "#2D9C8E", borderRadius: rs(3) },

  card: {
    flexGrow: 1,
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

  fieldWrap:  { gap: vs(6) },
  fieldLabel: { fontSize: ms(13), fontWeight: "700", color: "#1a2e35", marginBottom: vs(2) },
  fieldHint:  { fontSize: ms(12), color: "#8aabab" },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFA",
    borderWidth: 1.5,
    borderColor: "#E2ECEC",
    borderRadius: rs(14),
    overflow: "hidden",
  },
  inputError: { borderColor: "#EF4444" },
  dialPicker: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(12),
    paddingVertical: vs(14),
    gap: rs(5),
  },
  flagText:     { fontSize: ms(20) },
  dialText:     { fontSize: ms(14), fontWeight: "700", color: "#1a2e35" },
  phoneDivider: { width: 1, height: vs(22), backgroundColor: "#E2ECEC" },
  phoneInput: {
    flex: 1,
    fontSize: ms(15),
    fontWeight: "600",
    color: "#1a2e35",
    paddingHorizontal: rs(14),
    paddingVertical: vs(14),
  },

  errorRow:  { flexDirection: "row", alignItems: "center", gap: rs(4), marginTop: vs(3) },
  errorText: { fontSize: ms(11), color: "#EF4444", fontWeight: "500", flex: 1 },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: rs(2),
    marginTop: vs(6),
  },
  switchText: { fontSize: ms(12), fontWeight: "600", color: "#2D9C8E" },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: rs(8),
    backgroundColor: "rgba(45,156,142,0.06)",
    borderRadius: rs(12),
    padding: rs(12),
    borderWidth: 1,
    borderColor: "#C8E8E5",
  },
  infoText: { flex: 1, fontSize: ms(12), color: "#4a7a7a", lineHeight: ms(17), fontWeight: "500" },

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

  orRow:  { flexDirection: "row", alignItems: "center", gap: rs(8), marginVertical: vs(2) },
  orLine: { flex: 1, height: 1, backgroundColor: "#E8F0F0" },
  orText: { fontSize: ms(11), color: "#8aabab", fontWeight: "500" },

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

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(4),
  },
  loginText: { fontSize: ms(13), color: "#8aabab", fontWeight: "500" },
  loginLink: { fontSize: ms(13), color: "#2D9C8E", fontWeight: "700" },

  phoneInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    backgroundColor: "#F0FAF9",
    borderRadius: rs(12),
    padding: rs(12),
    borderWidth: 1,
    borderColor: "#C8E8E5",
  },
  phoneInfoFlag:   { fontSize: ms(18) },
  phoneInfoNumber: { flex: 1, fontSize: ms(13), fontWeight: "600", color: "#1a2e35" },
  changeText:      { fontSize: ms(12), color: "#2D9C8E", fontWeight: "700" },

  resendRow:  { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  resendText: { fontSize: ms(13), color: "#8aabab", fontWeight: "500" },
  resendLink: { fontSize: ms(13), color: "#2D9C8E", fontWeight: "700" },
  resendTimer:{ fontSize: ms(13), color: "#aab", fontWeight: "600" },

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
  securitySub:   { fontSize: ms(10), color: "#7a9a9a", marginTop: vs(1) },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(6),
    paddingVertical: vs(2),
  },
  backText: { fontSize: ms(13), fontWeight: "600", color: "#2D9C8E" },
});