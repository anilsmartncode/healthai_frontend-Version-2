import { Stack } from "expo-router";
import { UsageProvider } from "@/context/UsageContext";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PaywallModal } from "@/components/PaywallModal";
import { useEffect, useState } from "react";
import { checkHealthAlerts, type HealthAlert } from "@/services/aiService";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { router, usePathname, useGlobalSearchParams, useRootNavigationState } from "expo-router";
import { useShareIntent } from "expo-share-intent";
import { Colors, Radius } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { CountryProvider, currentAppCountryCode } from "@/context/CountryContext";
import { LanguageProvider } from "@/context/Languagecontext";
import { useAuth } from "@/context/AuthContext";
import { SecurityWrapper } from "@/components/SecurityWrapper";

import * as Notifications from "expo-notifications";
import { setupNotificationCategories, scheduleReminderNotification, cancelReminderNotification, defineBackgroundNotificationTask, syncLocalRemindersWithBackend } from "@/utils/notifications";
import { medicineApiCall } from "@/services/Medicineapiclient";
import { ENDPOINTS } from "@/constants/api";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { getRevenueCatKey } from "@/config/purchases";

// Register headless background task to handle 'snooze' and 'take' when app is closed
defineBackgroundNotificationTask();

// --- SUPPRESS LOGS IN PRODUCTION ---
if (!__DEV__) {
  console.log = () => { };
  console.warn = () => { };
  console.error = () => { };
}

// --- GLOBAL NETWORK LATENCY TRACKER ---
const originalFetch = global.fetch;
global.fetch = async (...args) => {
  const startMs = Date.now();
  const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
  const method = (args[1]?.method) || (typeof args[0] !== 'string' ? (args[0] as Request).method : 'GET');

  // Automatically attach x-country-code to backend API requests
  if (url && typeof url === 'string' && (url.includes('smartncode.com') || url.includes('/api'))) {
    const init = args[1] || {};
    init.headers = {
      ...(init.headers || {}),
      'x-country-code': currentAppCountryCode,
    };
    args[1] = init;
  }

  try {
    const res = await originalFetch(...args);
    const durationMs = Date.now() - startMs;
    // Don't log localhost/metro bundler requests to keep the terminal clean
    if (url && !url.includes('127.0.0.1') && !url.includes('localhost') && !url.includes('10.0.2.2')) {
      console.log(`[Network] ${res.status} [${durationMs}ms] ${method} ${url}`);
    }
    return res;
  } catch (err) {
    const durationMs = Date.now() - startMs;
    if (url && !url.includes('127.0.0.1') && !url.includes('localhost') && !url.includes('10.0.2.2')) {
      console.log(`[Network] ERROR [${durationMs}ms] ${method} ${url}`, err);
    }
    throw err;
  }
};

// Helper function to get mime type from filename
function getMimeTypeFromFilename(filename: string): string {
  if (!filename) return 'application/octet-stream';
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}

// Share Intent Tracker Component
function ShareIntentListener() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent();
  const { ready, token } = useAuth(); // Now safe because it's inside AuthProvider
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Log the complete share-intent lifecycle state
    console.log('[ShareIntent Lifecycle] State updated:', { 
      hasShareIntent, 
      error, 
      filesCount: shareIntent?.files?.length, 
      ready, 
      hasToken: !!token 
    });

    // Only proceed if root navigation is fully mounted to avoid "Attempted to navigate before mounting"
    if (!rootNavigationState?.key) {
      return;
    }

    if (hasShareIntent && shareIntent?.files && ready && token) {
      if (Array.isArray(shareIntent.files) && shareIntent.files.length > 0) {
        const file = shareIntent.files[0] as any;
        
        // Log the raw incoming file object to determine what Android actually delivered
        console.log('[ShareIntent Lifecycle] Received raw file object:', JSON.stringify(file, null, 2));

        if (file?.contentUri || file?.path) {
          const fileName = file.fileName || 'Shared_Document';
          // Infer MIME type if missing (Phase 1 fix)
          const mimeType = file.mimeType || getMimeTypeFromFilename(fileName);
          const uri = file.contentUri || file.path;

          console.log('[ShareIntent Lifecycle] Normalized file:', { uri, fileName, mimeType });

          router.replace({
            pathname: '/(tabs)/home',
            params: {
              sharedFileUri: uri,
              sharedFileName: fileName,
              sharedFileMimeType: mimeType
            }
          });
          resetShareIntent();
        } else {
          console.log('[ShareIntent Lifecycle] File missing contentUri or path:', file);
        }
      }
    }
  }, [hasShareIntent, shareIntent, ready, token, error]);

  return null;
}

export default function RootLayout() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  // Route tracker
  useEffect(() => {
    if (pathname) {
      console.log(`[Navigation] -> ${pathname}`, Object.keys(params).length ? JSON.stringify(params) : '');
    }
  }, [pathname, params]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  let isWebLocked = false;
  if (Platform.OS === 'web' && isMounted) {
    const allowedWebPaths = ['/privacy', '/terms', '/cookies', '/contact', '/support', '/accountanddata'];
    const isAllowed = pathname && allowedWebPaths.some(p =>
      pathname === p || pathname === `${p}/` || pathname?.startsWith(`${p}?`)
    );
    if (!isAllowed) {
      isWebLocked = true;
    }
  }



  // Global Notification Listener setup (skip on web — notifications not available)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    setupNotificationCategories();

    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as { reminderId?: string };
      const reminderId = data?.reminderId;
      const title = response.notification.request.content.title || "Medicine Time!";
      const body = response.notification.request.content.body || "";

      if (!reminderId) return;

      if (actionId === 'take') {
        try {
          await medicineApiCall(ENDPOINTS.reminderTaken(reminderId), { method: 'POST' });
          await Notifications.dismissNotificationAsync(response.notification.request.identifier);
        } catch (e) {
          console.warn('[Notifications] Background taken API failed:', e);
        }
      } else if (actionId === 'snooze') {
        try {
          const snoozeDate = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now
          await scheduleReminderNotification(reminderId, title, body, snoozeDate);
          await Notifications.dismissNotificationAsync(response.notification.request.identifier);
        } catch (e) {
          console.warn('[Notifications] Background snooze failed:', e);
        }
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CountryProvider>
          <LanguageProvider>
          <UsageProvider>
            <AuthProvider>
              <ShareIntentListener />
              <SecurityWrapper>
                <ErrorBoundary>
                  <StatusBar style="dark" />
                  <OfflineBanner />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    {/* Explicitly add legal pages so Expo router doesn't fall back to index */}
                    <Stack.Screen name="privacy" options={{ headerShown: false }} />
                    <Stack.Screen name="terms" options={{ headerShown: false }} />
                    <Stack.Screen name="contact" options={{ headerShown: false }} />
                    <Stack.Screen name="cookies" options={{ headerShown: false }} />
                    <Stack.Screen name="support" options={{ headerShown: false }} />
                    <Stack.Screen name="accountanddata" options={{ headerShown: false }} />

                    <Stack.Screen
                      name="upload"
                      options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade' }}
                    />
                    <Stack.Screen
                      name="analyzing"
                      options={{ headerShown: true, title: "Analyzing" }}
                    />
                    <Stack.Screen
                      name="analysis"
                      options={{ headerShown: false, title: "Full Results" }}
                    />

                    <Stack.Screen
                      name="interactions"
                      options={{ headerShown: true, title: "Interactions" }}
                    />
                    <Stack.Screen
                      name="notifications"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="account"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="plans"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="medicine/[id]"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="ai-history" options={{ headerShown: false }} />
                    <Stack.Screen name="report-detail" options={{ headerShown: false }} />
                    <Stack.Screen name="scorecard" options={{ headerShown: false }} />
                    <Stack.Screen name="ai-summary" options={{ headerShown: false }} />
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
                      name="medicines/reminders/index"
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
                    {/* Son-side invite flow — deep link: healthai://family/join/[code] */}
                    <Stack.Screen
                      name="family/join/[code]"
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
                  </Stack>
                  <PaywallModal />
                  {isWebLocked && (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.bg, zIndex: 999999 }]}>
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <Ionicons name="phone-portrait-outline" size={64} color={Colors.primary} style={{ marginBottom: 16 }} />
                        <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' }}>
                          Get the App
                        </Text>
                        <Text style={{ fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 400 }}>
                          HealthcareAI is designed exclusively for mobile devices. Please download our app on iOS or Android to access your health dashboard.
                        </Text>
                      </View>

                      {/* Footer Legal Links */}
                      <View style={{ paddingBottom: 40, flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
                        <Text
                          style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}
                          onPress={() => window.location.href = '/privacy'}
                        >
                          Privacy Policy
                        </Text>
                        <Text
                          style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}
                          onPress={() => window.location.href = '/terms'}
                        >
                          Terms of Service
                        </Text>
                        <Text
                          style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}
                          onPress={() => window.location.href = '/support'}
                        >
                          Support
                        </Text>
                        <Text
                          style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}
                          onPress={() => window.location.href = '/accountanddata'}
                        >
                          Account & Data
                        </Text>
                      </View>
                    </View>
                  )}
                </ErrorBoundary>
              </SecurityWrapper>
            </AuthProvider>
          </UsageProvider>
        </LanguageProvider>
      </CountryProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
