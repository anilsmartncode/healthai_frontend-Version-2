import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AppState,
  AppStateStatus,
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Vibration,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { getAppLockSettings, verifyPin, AppLockSettings } from '@/utils/appLock';

// Inactivity timeout: 5 minutes for auto-locking
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

function ScreenCapturePreventer() {
  usePreventScreenCapture();
  return null;
}

export function SecurityWrapper({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [lockSettings, setLockSettings] = useState<AppLockSettings>({
    enabled: false,
    useBiometrics: true,
    hasPin: false,
  });

  const appState = useRef(AppState.currentState);
  const lastBackgroundTime = useRef<number | null>(null);

  // Check if App Lock is enabled in user settings
  const refreshSettings = useCallback(async (): Promise<AppLockSettings> => {
    const settings = await getAppLockSettings();
    setLockSettings(settings);
    return settings;
  }, []);

  const promptBiometrics = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) return;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock HealthAI',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        setIsLocked(false);
        setPinInput('');
        setPinError(null);
      }
    } catch (e) {
      console.warn('[SecurityWrapper] Biometric error:', e);
    }
  }, []);

  // Cold Start Check
  useEffect(() => {
    if (ready) {
      if (!token) {
        setIsLocked(false);
      } else {
        (async () => {
          const s = await refreshSettings();
          if (s.enabled) {
            setIsLocked(true);
            if (s.useBiometrics) {
              promptBiometrics();
            }
          } else {
            setIsLocked(false);
          }
        })();
      }
    }
  }, [token, ready, refreshSettings, promptBiometrics]);

  // Background / Foreground state monitoring
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
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
        const s = await refreshSettings();
        if (s.enabled && token) {
          const timeInBackground = lastBackgroundTime.current
            ? Date.now() - lastBackgroundTime.current
            : 0;

          if (timeInBackground > INACTIVITY_TIMEOUT_MS) {
            setIsLocked(true);
            setPinInput('');
            setPinError(null);
            if (s.useBiometrics) {
              promptBiometrics();
            }
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [token, refreshSettings, promptBiometrics]);

  // PIN Pad button press handler
  const handleKeyPress = async (digit: string) => {
    if (pinInput.length >= 4) return;
    const nextPin = pinInput + digit;
    setPinInput(nextPin);
    setPinError(null);

    if (nextPin.length === 4) {
      const isValid = await verifyPin(nextPin);
      if (isValid) {
        setIsLocked(false);
        setPinInput('');
        setPinError(null);
      } else {
        Vibration.vibrate(200);
        setPinError('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setPinInput('');
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    if (pinInput.length > 0) {
      setPinInput(pinInput.slice(0, -1));
      setPinError(null);
    }
  };

  // On web, public preview is shown, security lock isn't applicable
  if (Platform.OS === 'web') return <>{children}</>;

  return (
    <View style={styles.container}>
      {lockSettings.enabled && <ScreenCapturePreventer />}
      {children}

      {/* Full Screen In-App PIN & Biometric Lock Overlay */}
      {isLocked && (
        <View style={styles.lockOverlay}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>HealthAI Locked</Text>
            <Text style={styles.subtitle}>
              Enter your 4-digit PIN to access your health data
            </Text>
          </View>

          {/* 4 Dots PIN Display */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3].map((index) => {
              const filled = pinInput.length > index;
              return (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    filled && styles.dotFilled,
                    pinError ? styles.dotError : null,
                  ]}
                />
              );
            })}
          </View>

          {pinError ? (
            <Text style={styles.errorText}>{pinError}</Text>
          ) : (
            <View style={{ height: 20 }} />
          )}

          {/* Keypad */}
          <View style={styles.keypad}>
            <View style={styles.keypadRow}>
              {['1', '2', '3'].map((num) => (
                <Pressable
                  key={num}
                  style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                  onPress={() => handleKeyPress(num)}
                >
                  <Text style={styles.keyText}>{num}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.keypadRow}>
              {['4', '5', '6'].map((num) => (
                <Pressable
                  key={num}
                  style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                  onPress={() => handleKeyPress(num)}
                >
                  <Text style={styles.keyText}>{num}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.keypadRow}>
              {['7', '8', '9'].map((num) => (
                <Pressable
                  key={num}
                  style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                  onPress={() => handleKeyPress(num)}
                >
                  <Text style={styles.keyText}>{num}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.keypadRow}>
              {/* Biometrics button (Bottom Left) */}
              <Pressable
                style={({ pressed }) => [
                  styles.key,
                  styles.actionKey,
                  pressed && styles.keyPressed,
                ]}
                onPress={promptBiometrics}
                disabled={!lockSettings.useBiometrics}
              >
                {lockSettings.useBiometrics ? (
                  <Ionicons name="finger-print" size={28} color="#FFFFFF" />
                ) : (
                  <View />
                )}
              </Pressable>

              {/* Zero */}
              <Pressable
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                onPress={() => handleKeyPress('0')}
              >
                <Text style={styles.keyText}>0</Text>
              </Pressable>

              {/* Backspace button (Bottom Right) */}
              <Pressable
                style={({ pressed }) => [
                  styles.key,
                  styles.actionKey,
                  pressed && styles.keyPressed,
                ]}
                onPress={handleDelete}
              >
                <Ionicons name="backspace-outline" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
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
    backgroundColor: '#0F2F28', // Deep clinical teal
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 99999,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13.5,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#10B981', // Emerald green
    borderColor: '#10B981',
  },
  dotError: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  keypad: {
    width: '100%',
    maxWidth: 290,
    gap: 14,
    marginTop: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionKey: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
  },
});
