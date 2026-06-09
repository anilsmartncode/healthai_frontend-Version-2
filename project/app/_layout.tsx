import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/Languagecontext";

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
                name="family"
                options={{ headerShown: true, title: "Care Hub" }}
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
                options={{ headerShown: true, title: "Medicine Details" }}
              />
            </Stack>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
