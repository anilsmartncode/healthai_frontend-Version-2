import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useEffect, useState } from "react";
import { checkHealthAlerts, type HealthAlert } from "@/services/aiService";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Colors, Radius } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { LanguageProvider } from "@/context/Languagecontext";
import { useAuth } from "@/context/AuthContext";

function AlertOverlay() {
  const { phone } = useAuth();
  const [alert, setAlert] = useState<HealthAlert | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      checkHealthAlerts(phone).then(a => { if (a) setAlert(a); });
    }, 2500); // check 2.5s after launch
    return () => clearTimeout(timer);
  }, [phone]);

  if (!alert) return null;
  return (
    <Pressable
      style={overlay.banner}
      onPress={() => {
        setAlert(null);
        router.push({ pathname: '/ai-chat', params: { prefill: alert.prefill } });
      }}
    >
      <Ionicons name="sparkles" size={16} color="#fff" style={{ flexShrink: 0 }} />
      <View style={{ flex: 1 }}>
        <Text style={overlay.title}>{alert.title}</Text>
        <Text style={overlay.msg}>{alert.message}</Text>
      </View>
      <Pressable onPress={() => setAlert(null)} hitSlop={10}>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </Pressable>
  );
}

const overlay = StyleSheet.create({
  banner: {
    position: 'absolute', bottom: 90, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    padding: 14, zIndex: 999,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 8,
  },
  title: { color: '#fff', fontWeight: '700', fontSize: 13 },
  msg:   { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 1 },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <ErrorBoundary>
              <StatusBar style="dark" />
              <OfflineBanner />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="upload"
                  options={{ headerShown: true, title: "Upload Report" }}
                />
                <Stack.Screen
                  name="analyzing"
                  options={{ headerShown: true, title: "Analyzing" }}
                />
                <Stack.Screen
                  name="analysis"
                  options={{ headerShown: true, title: "Report Analysis" }}
                />
                <Stack.Screen
                  name="all-values"
                  options={{ headerShown: true, title: "All Values" }}
                />
                <Stack.Screen
                  name="interactions"
                  options={{ headerShown: true, title: "Interactions" }}
                />
                <Stack.Screen
                  name="notifications"
                  options={{ headerShown: true, title: "Notifications" }}
                />
                <Stack.Screen
                  name="account"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="medicine/[id]"
                  options={{ headerShown: true, title: 'Medicine Details' }}
                />
                <Stack.Screen name="ai-chat"          options={{ headerShown: false }} />
                <Stack.Screen name="ai-history"       options={{ headerShown: false }} />
                <Stack.Screen name="report-detail"   options={{ headerShown: false }} />
                <Stack.Screen name="scorecard"        options={{ headerShown: false }} />
                <Stack.Screen name="ai-summary"       options={{ headerShown: false }} />
                <Stack.Screen name="medicine-actions" options={{ headerShown: false }} />
                <Stack.Screen
                  name="medicines/my-medicines"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="medicines/reminders/new"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="medicines/browse"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="medicines/check-interactions"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="medicines/reminders"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="medicines/scanner"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/add-member"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/ai-assistant"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/ai-insights"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/appointments"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/emergency"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/health-summary"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/invitations"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/invite-options"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/medications"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/member-profile"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/permissions"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/reports"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/share-invite"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/tree"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/appointments/book"
                  options={{ headerShown: false }}
                />
                {/* Son-side invite flow — deep link: healthai://family/invite/[code] */}
                <Stack.Screen
                  name="family/invite/[code]"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/invite-otp"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="family/invite-success"
                  options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen
                  name="legal-privacy"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="help-support"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="rate-app"
                  options={{ headerShown: false }}
                />
              </Stack>
              <AlertOverlay />
            </ErrorBoundary>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
