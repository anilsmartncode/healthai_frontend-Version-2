import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';

export type TextSizeOption = 'default' | 'large' | 'xlarge';

export interface AccessibilityState {
  textSize: TextSizeOption;
  textScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
  boldText: boolean;
  screenReaderActive: boolean;
  setTextSize: (size: TextSizeOption) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  setReduceMotion: (enabled: boolean) => Promise<void>;
  setBoldText: (enabled: boolean) => Promise<void>;
}

const STORAGE_KEY = 'healthai_accessibility_prefs';

const TEXT_SCALES: Record<TextSizeOption, number> = {
  default: 1.0,
  large: 1.15,
  xlarge: 1.3,
};

const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSizeOption>('default');
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(false);
  const [boldText, setBoldTextState] = useState<boolean>(false);
  const [screenReaderActive, setScreenReaderActive] = useState<boolean>(false);

  // Load saved accessibility preferences on startup
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.textSize) setTextSizeState(parsed.textSize);
          if (typeof parsed.highContrast === 'boolean') setHighContrastState(parsed.highContrast);
          if (typeof parsed.reduceMotion === 'boolean') setReduceMotionState(parsed.reduceMotion);
          if (typeof parsed.boldText === 'boolean') setBoldTextState(parsed.boldText);
        }
      } catch (err) {
        console.warn('[AccessibilityContext] Failed to load saved preferences:', err);
      }

      // Check native screen reader and reduce motion states
      try {
        const isScreenReader = await AccessibilityInfo.isScreenReaderEnabled();
        setScreenReaderActive(isScreenReader);

        const isReduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        if (isReduceMotion) setReduceMotionState(true);

        if (typeof AccessibilityInfo.isBoldTextEnabled === 'function') {
          const isBold = await AccessibilityInfo.isBoldTextEnabled();
          if (isBold) setBoldTextState(true);
        }
      } catch (nativeErr) {
        console.warn('[AccessibilityContext] Native accessibility detection error:', nativeErr);
      }
    })();

    // Listen to native screen reader changes
    const screenReaderSub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled: boolean) => {
        setScreenReaderActive(enabled);
      }
    );

    const reduceMotionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        setReduceMotionState(enabled);
      }
    );

    return () => {
      screenReaderSub?.remove?.();
      reduceMotionSub?.remove?.();
    };
  }, []);

  const persistPrefs = async (updates: Partial<{
    textSize: TextSizeOption;
    highContrast: boolean;
    reduceMotion: boolean;
    boldText: boolean;
  }>) => {
    try {
      const current = {
        textSize,
        highContrast,
        reduceMotion,
        boldText,
        ...updates,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('[AccessibilityContext] Failed to persist settings:', e);
    }
  };

  const setTextSize = async (size: TextSizeOption) => {
    setTextSizeState(size);
    await persistPrefs({ textSize: size });
  };

  const setHighContrast = async (enabled: boolean) => {
    setHighContrastState(enabled);
    await persistPrefs({ highContrast: enabled });
  };

  const setReduceMotion = async (enabled: boolean) => {
    setReduceMotionState(enabled);
    await persistPrefs({ reduceMotion: enabled });
  };

  const setBoldText = async (enabled: boolean) => {
    setBoldTextState(enabled);
    await persistPrefs({ boldText: enabled });
  };

  const value: AccessibilityState = {
    textSize,
    textScale: TEXT_SCALES[textSize] || 1.0,
    highContrast,
    reduceMotion,
    boldText,
    screenReaderActive,
    setTextSize,
    setHighContrast,
    setReduceMotion,
    setBoldText,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityState {
  const context = useContext(AccessibilityContext);
  if (!context) {
    return {
      textSize: 'default',
      textScale: 1.0,
      highContrast: false,
      reduceMotion: false,
      boldText: false,
      screenReaderActive: false,
      setTextSize: async () => {},
      setHighContrast: async () => {},
      setReduceMotion: async () => {},
      setBoldText: async () => {},
    };
  }
  return context;
}
