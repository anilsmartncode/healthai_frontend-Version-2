/**
 * app/(auth)/email-verify.tsx — Email Verification Screen
 * ─────────────────────────────────────────────────────────
 * Shown after email signup. Asks the user to check their inbox
 * and click the Firebase verification link. Polls or manually
 * checks whether the email has been verified.
 */
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Lazy-load Firebase Auth so the page still opens in Expo Go
function getAuth() {
  const mod = require('@react-native-firebase/auth');
  return (mod.default || mod)();
}

function useScalers() {
  const { width: SW, height: SH } = useWindowDimensions();
  const rs = (n: number) => (SW / 390) * n;
  const vs = (n: number) => (SH / 844) * n;
  const ms = (n: number, f = 0.45) => n + (rs(n) - n) * f;
  return { rs, vs, ms };
}

export default function EmailVerify() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { rs, vs, ms } = useScalers();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Countdown timer for resend ──
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendTimer]);

  // ── Check if email is verified ──
  const handleCheckVerification = async () => {
    setError("");
    setChecking(true);
    try {
      const user = getAuth().currentUser;
      if (!user) {
        setError("Session expired. Please sign up again.");
        setChecking(false);
        return;
      }
      await user.reload();
      const refreshedUser = getAuth().currentUser;
      if (refreshedUser?.emailVerified) {
        // Email is verified! Navigate to onboarding
        router.replace("/(auth)/PersonOnboardingScreen");
      } else {
        setError("Email not verified yet. Please check your inbox and click the link.");
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong. Try again.");
    } finally {
      setChecking(false);
    }
  };

  // ── Resend verification email ──
  const handleResend = async () => {
    setError("");
    setResending(true);
    try {
      const user = getAuth().currentUser;
      if (user) {
        await user.sendEmailVerification();
        setResendTimer(60);
      } else {
        setError("Session expired. Please sign up again.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  const styles = makeStyles(rs, vs, ms);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Mail Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="mail-open-outline" size={ms(48)} color="#2D9C8E" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify Your Email</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          We've sent a verification link to
        </Text>
        <Text style={styles.emailText}>{email || "your email"}</Text>
        <Text style={styles.subtitle}>
          Please open your email and click the link to verify your account.
        </Text>

        {/* Error message */}
        {!!error && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={ms(14)} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Check Verification Button */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && !checking && { opacity: 0.9 },
            checking && { opacity: 0.75 },
          ]}
          onPress={handleCheckVerification}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>I've Verified My Email</Text>
              <View style={styles.btnArrow}>
                <Ionicons name="arrow-forward" size={ms(15)} color="#2D9C8E" />
              </View>
            </>
          )}
        </Pressable>

        {/* Resend Link */}
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the email? </Text>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
          ) : (
            <Pressable onPress={handleResend} disabled={resending}>
              <Text style={styles.resendLink}>
                {resending ? "Sending..." : "Resend Email"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <Ionicons name="information-circle-outline" size={ms(16)} color="#2D9C8E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipsText}>
              • Check your spam or junk folder{"\n"}
              • The link expires in 24 hours{"\n"}
              • Make sure you're checking the correct email
            </Text>
          </View>
        </View>

        {/* Back to Signup */}
        <Pressable
          style={styles.backRow}
          onPress={() => router.replace("/(auth)/signup")}
        >
          <Ionicons name="arrow-back" size={ms(14)} color="#2D9C8E" />
          <Text style={styles.backText}>Back to Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (
  rs: (n: number) => number,
  vs: (n: number) => number,
  ms: (n: number) => number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#EAF6F5",
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: rs(28),
    },
    iconCircle: {
      width: rs(96),
      height: rs(96),
      borderRadius: rs(48),
      backgroundColor: "rgba(45, 156, 142, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: vs(20),
    },
    title: {
      fontSize: ms(24),
      fontWeight: "700",
      color: "#1a2e35",
      marginBottom: vs(8),
    },
    subtitle: {
      fontSize: ms(13),
      color: "#6B8A8A",
      textAlign: "center",
      lineHeight: ms(20),
    },
    emailText: {
      fontSize: ms(14),
      fontWeight: "700",
      color: "#2D9C8E",
      marginVertical: vs(6),
    },
    errorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: rs(6),
      backgroundColor: "#FEF2F2",
      borderRadius: rs(8),
      paddingHorizontal: rs(12),
      paddingVertical: vs(8),
      marginTop: vs(12),
      width: "100%",
    },
    errorText: {
      fontSize: ms(12),
      color: "#EF4444",
      flex: 1,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#2D9C8E",
      borderRadius: rs(14),
      paddingVertical: vs(14),
      width: "100%",
      marginTop: vs(24),
      gap: rs(8),
    },
    primaryBtnText: {
      fontSize: ms(15),
      fontWeight: "700",
      color: "#fff",
    },
    btnArrow: {
      width: rs(24),
      height: rs(24),
      borderRadius: rs(12),
      backgroundColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    resendRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: vs(16),
    },
    resendText: {
      fontSize: ms(12),
      color: "#6B8A8A",
    },
    resendTimer: {
      fontSize: ms(12),
      color: "#6B8A8A",
      fontWeight: "600",
    },
    resendLink: {
      fontSize: ms(12),
      color: "#2D9C8E",
      fontWeight: "700",
    },
    tipsBox: {
      flexDirection: "row",
      gap: rs(8),
      backgroundColor: "rgba(45, 156, 142, 0.06)",
      borderRadius: rs(12),
      padding: rs(14),
      marginTop: vs(24),
      width: "100%",
    },
    tipsText: {
      fontSize: ms(11),
      color: "#6B8A8A",
      lineHeight: ms(18),
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: rs(6),
      marginTop: vs(20),
    },
    backText: {
      fontSize: ms(13),
      color: "#2D9C8E",
      fontWeight: "600",
    },
  });
