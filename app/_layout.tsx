import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { checkHealthAlerts, type HealthAlert } from "@/services/aiService";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Colors, Radius } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { LanguageProvider } from "@/context/Languagecontext";

function AlertOverlay() {
  const [alert, setAlert] = useState<HealthAlert | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      checkHealthAlerts().then(a => { if (a) setAlert(a); });
    }, 2500); // check 2.5s after launch
    return () => clearTimeout(timer);
  }, []);

  if (!alert) return null;
  return (
    <Pressable
      style={overlay.banner}
      onPress={() => {
        setAlert(null);
        router.push({ pathname: '/(tabs)/ai', params: { prefill: alert.prefill } });
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
            <StatusBar style="dark" />
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
                options={{ headerShown: true, title: "Account" }}
              />
              <Stack.Screen
                name="medicine/[id]"
                options={{ headerShown: true, title: 'Medicine Details' }}
              />
              <Stack.Screen name="report-detail"    options={{ headerShown: false }} />
              <Stack.Screen name="scorecard"         options={{ headerShown: false }} />
              <Stack.Screen name="ai-summary"        options={{ headerShown: false }} />
              <Stack.Screen name="medicine-actions"  options={{ headerShown: false }} />
              <Stack.Screen
                name="medicines/my-medicines"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="medicines/reminders/new"
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
            </Stack>
          </AuthProvider>
        </LanguageProvider>
        <AlertOverlay />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
