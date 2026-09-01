import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLang } from "@/context/Languagecontext";
import { useAuth } from "@/context/AuthContext";
import { firebaseLoginApi } from "@/services/authapi/apiService";
import { getLocalizedAuthError } from "@/utils/errorLocalization";

function getAuth() {
  const mod = require('@react-native-firebase/auth');
  return (mod.default || mod)();
}

// ── Scalers ───────────────────────────────────────────
function useScalers() {
  const { width: SW, height: SH } = useWindowDimensions();
  const rs = (n: number) => (SW / 390) * n;
  const vs = (n: number) => (SH / 844) * n;
  const ms = (n: number, f = 0.45) => n + (rs(n) - n) * f;
  return { rs, vs, ms, SW, SH };
}

export default function OtpVerifyScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const { signIn } = useAuth();
  const { rs, vs, ms } = useScalers();

  const params = useLocalSearchParams<{
    phone: string;
    flag?: string;
    mode?: "login" | "signup";
  }>();

  const phone = params.phone || "";
  const flag = params.flag || "📱";
  const mode = params.mode || "login";

  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(28);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<any>(null);

  // Countdown timer
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Initial focus
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleDigitChange = (text: string, index: number) => {
    setError(null);
    const cleaned = text.replace(/\D/g, "");

    if (cleaned.length > 1) {
      // Pasted multi-digit OTP
      const digits = cleaned.slice(0, 6).split("");
      const newArr = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newArr[i] = d;
      });
      setOtpDigits(newArr);
      const nextFocus = Math.min(digits.length, 5);
      inputs.current[nextFocus]?.focus();
      if (digits.length === 6) {
        verifyCode(newArr.join(""));
      }
      return;
    }

    const single = cleaned.slice(-1);
    const newArr = [...otpDigits];
    newArr[index] = single;
    setOtpDigits(newArr);

    if (single && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    const fullCode = newArr.join("");
    if (fullCode.length === 6 && !newArr.includes("")) {
      verifyCode(fullCode);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputs.current[index - 1]?.focus();
        const newArr = [...otpDigits];
        newArr[index - 1] = "";
        setOtpDigits(newArr);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    try {
      setLoading(true);
      const conf = await getAuth().signInWithPhoneNumber(phone);
      setConfirmation(conf);
      setResendTimer(30);
      setOtpDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (e: any) {
      setError(getLocalizedAuthError(e, "err_failed_send_otp", t));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    if (code.length < 6) {
      setError(t("err_enter_code") || "Please enter the 6-digit code");
      return;
    }
    Keyboard.dismiss();
    try {
      setLoading(true);
      setError(null);

      // Verify with Firebase
      let idToken: string;
      if (confirmation) {
        const userCredential = await confirmation.confirm(code);
        idToken = await userCredential.user.getIdToken();
      } else {
        const conf = await getAuth().signInWithPhoneNumber(phone);
        const userCredential = await conf.confirm(code);
        idToken = await userCredential.user.getIdToken();
      }

      // Exchange with backend
      const data = await firebaseLoginApi(idToken);
      if (data?.token) {
        await signIn(
          data.token,
          phone,
          data.member_id ?? data.user_id ?? null,
          data.refresh_token ?? null
        );
        if (mode === "signup") {
          router.replace("/(auth)/PersonOnboardingScreen");
        } else {
          router.replace("/(tabs)/home");
        }
      } else {
        setError(getLocalizedAuthError(data?.message, "err_network", t));
      }
    } catch (e: any) {
      setError(getLocalizedAuthError(e, "err_invalid_or_expired_code", t));
    } finally {
      setLoading(false);
    }
  };

  const currentOtp = otpDigits.join("");

  const styles = makeStyles(rs, vs, ms);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* ── Topbar matching Prototype v2 (scr-otp) ── */}
        <View style={styles.topbar}>
          <View style={[styles.backrow, { flexDirection: rowDirection }]}>
            <Pressable style={styles.iconbtn} onPress={() => router.back()} hitSlop={10}>
              <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color="#1A2B2A" />
            </Pressable>
            <Text style={[styles.topbarTitle, { textAlign }]}>{t("verify_otp") || "Verify OTP"}</Text>
          </View>
        </View>

        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
        >
          {/* Subtitle with Phone & Flag */}
          <Text style={[styles.sub, { textAlign }]}>
            {(t("enter_6_digit_sms") || "Enter the 6-digit code sent to")} {flag} {phone}
          </Text>

          {/* ── 6 Individual Square Digit Boxes (Prototype v2 Exact Style) ── */}
          <View style={[styles.digitsRow, { flexDirection: rowDirection }]}>
            {otpDigits.map((digit, idx) => {
              const isFilled = digit.length > 0;
              return (
                <TextInput
                  key={idx}
                  ref={(ref) => { inputs.current[idx] = ref; }}
                  style={[
                    styles.digitBox,
                    isFilled && styles.digitBoxFilled,
                    !!error && styles.digitBoxError,
                  ]}
                  value={digit}
                  onChangeText={(val) => handleDigitChange(val, idx)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
                  keyboardType="number-pad"
                  maxLength={idx === 0 ? 6 : 1}
                  selectTextOnFocus
                  textAlign="center"
                />
              );
            })}
          </View>

          {/* Error Message */}
          {!!error && (
            <View style={styles.errRow}>
              <Ionicons name="alert-circle-outline" size={ms(14)} color="#A32D2D" />
              <Text style={styles.errText}>{error}</Text>
            </View>
          )}

          {/* Resend OTP info row */}
          <View style={[styles.hintRow, { flexDirection: rowDirection }]}>
            {resendTimer > 0 ? (
              <Text style={styles.hintText}>
                {t("resend_in") || "Resend OTP in"} 00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
              </Text>
            ) : (
              <Pressable onPress={handleResendOtp} hitSlop={8}>
                <Text style={styles.resendLink}>
                  {t("resend_otp") || "Resend now"}
                </Text>
              </Pressable>
            )}

            <Text style={styles.hintDot}> · </Text>

            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.changeLink}>
                {t("change") || "Change number"}
              </Text>
            </Pressable>
          </View>

          {/* Verify CTA Button */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              pressed && !loading && { opacity: 0.88 },
              (loading || currentOtp.length < 6) && styles.btnDisabled,
            ]}
            onPress={() => verifyCode(currentOtp)}
            disabled={loading || currentOtp.length < 6}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>{t("verify_btn") || "Verify"}</Text>
            )}
          </Pressable>

          {/* Security Disclaimer Banner */}
          <View style={[styles.disclaimer, { flexDirection: rowDirection }]}>
            <Ionicons name="lock-closed" size={ms(14)} color="#0F6E56" />
            <Text style={styles.disclaimerText}>
              We keep your data secure. Encrypted and 100% private.
            </Text>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const makeStyles = (
  rs: (n: number) => number,
  vs: (n: number) => number,
  ms: (n: number, f?: number) => number
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F4F6F5" },

    topbar: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: rs(18),
      paddingTop: Platform.OS === "ios" ? vs(54) : vs(24),
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
      paddingTop: vs(24),
      paddingBottom: vs(40),
    },

    sub: {
      fontSize: ms(13.5),
      color: "#6B756F",
      lineHeight: ms(20),
      marginBottom: vs(20),
      fontWeight: "500",
    },

    // ── 6 Individual Digits ──
    digitsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: rs(8),
      marginBottom: vs(14),
    },
    digitBox: {
      flex: 1,
      height: vs(54),
      backgroundColor: "#FFFFFF",
      borderWidth: 1.5,
      borderColor: "#E4E8E6",
      borderRadius: rs(10),
      fontSize: ms(20),
      fontWeight: "700",
      color: "#1A2B2A",
      textAlign: "center",
      paddingVertical: 0,
    },
    digitBoxFilled: {
      borderColor: "#0F6E56",
      backgroundColor: "rgba(15, 110, 86, 0.04)",
    },
    digitBoxError: {
      borderColor: "#A32D2D",
    },

    errRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: rs(6),
      marginBottom: vs(12),
    },
    errText: {
      fontSize: ms(12),
      color: "#A32D2D",
      fontWeight: "500",
    },

    hintRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: vs(24),
    },
    hintText: {
      fontSize: ms(12),
      color: "#6B756F",
      fontWeight: "500",
    },
    hintDot: {
      fontSize: ms(12),
      color: "#6B756F",
    },
    resendLink: {
      fontSize: ms(12),
      color: "#0F6E56",
      fontWeight: "700",
    },
    changeLink: {
      fontSize: ms(12),
      color: "#0F6E56",
      fontWeight: "600",
    },

    btn: {
      backgroundColor: "#0F6E56",
      borderRadius: rs(12),
      paddingVertical: vs(14),
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#0F6E56",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
      marginBottom: vs(18),
    },
    btnDisabled: {
      backgroundColor: "#8AB5AA",
      shadowOpacity: 0,
      elevation: 0,
    },
    btnText: {
      color: "#FFFFFF",
      fontSize: ms(15),
      fontWeight: "700",
    },

    disclaimer: {
      flexDirection: "row",
      alignItems: "center",
      gap: rs(8),
      backgroundColor: "#EBF3F0",
      borderRadius: rs(10),
      paddingHorizontal: rs(12),
      paddingVertical: vs(10),
    },
    disclaimerText: {
      flex: 1,
      fontSize: ms(11.5),
      color: "#4A6B63",
      lineHeight: ms(16),
      fontWeight: "500",
    },
  });
