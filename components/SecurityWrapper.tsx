import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// 🔴 Set to 10 seconds for testing. Change to 5 * 60 * 1000 (5 minutes) for production.
const INACTIVITY_TIMEOUT_MS = 10000; 

// 🔥 Toggle this to false when you want to re-enable biometrics
const DISABLE_SECURITY = false; 

export function SecurityWrapper({ children }: { children: React.ReactNode }) {
  // 1. Prevent Screen Capture globally (Temporarily disabled for testing)
  // usePreventScreenCapture();

  // On web, we only show public legal pages, so security lock isn't needed.
  if (Platform.OS === 'web') return <>{children}</>;

  const { token, ready } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);
  const lastBackgroundTime = useRef<number | null>(null);

  useEffect(() => {
    if (ready) {
      if (!token) {
        // If the user logs out or isn't logged in, unlock the screen so they can see the login page
        setIsLocked(false);
      } else {
        // Cold Start Lock: If they are logged in and opening the app fresh, lock it immediately.
        if (!DISABLE_SECURITY) {
          setIsLocked(true);
          promptBiometrics();
        }
      }
    }
  }, [token, ready]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // App went to background
      if (
        appState.current.match(/active/) &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        lastBackgroundTime.current = Date.now();
      }

      // App came to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (lastBackgroundTime.current && token) {
          const timeInBackground = Date.now() - lastBackgroundTime.current;
          if (timeInBackground > INACTIVITY_TIMEOUT_MS && !DISABLE_SECURITY) {
            setIsLocked(true);
            // Auto-prompt FaceID/TouchID right when they return
            promptBiometrics();
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [token]);

  const promptBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // If the device doesn't support biometrics or none are set up, 
        // fallback to device PIN/password if possible.
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock HealthAI',
          fallbackLabel: 'Use PIN',
        });
        if (result.success) {
          setIsLocked(false);
        }
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock HealthAI',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        setIsLocked(false);
      }
    } catch (e) {
      console.warn('[SecurityWrapper] Biometric error:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* 
        We still render the app in the background so it doesn't unmount everything,
        but the Lock Overlay will cover it entirely if locked.
      */}
      {children}

      {isLocked && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={64} color="#fff" style={{ marginBottom: 20 }} />
          <Text style={styles.lockTitle}>App Locked</Text>
          <Text style={styles.lockSubtitle}>
            For your security, HealthAI locks automatically after inactivity.
          </Text>

          <Pressable style={styles.unlockBtn} onPress={promptBiometrics}>
            <Text style={styles.unlockBtnText}>Unlock</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary, // Using primary brand color
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    zIndex: 99999, // Ensure it sits above absolutely everything
  },
  lockTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lockSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  unlockBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
  },
  unlockBtnText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
