/**
 * context/CountryContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides global Country & Regional state across the application.
 * Persists the user's selected country code in AsyncStorage.
 *
 * Exposes:
 *  - country: CountryConfig (flag, emergency lines, units, currency, etc.)
 *  - setCountryCode: (code: string) => void
 *  - glucoseUnit: 'mg/dL' | 'mmol/L'
 *  - emergencyNumber: string
 *  - currency: currency details
 *  - countryLanguages: recommended languages for this country
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CountryConfig,
  COUNTRIES,
  DEFAULT_COUNTRY,
  getCountryByCode,
  detectDeviceCountry,
} from "@/constants/countries";

const STORAGE_KEY = "@healthai_selected_country";

// In-memory active country code for non-React callers (e.g. API clients)
export let currentAppCountryCode = DEFAULT_COUNTRY.code;

interface CountryContextState {
  country: CountryConfig;
  countryCode: string;
  setCountryCode: (code: string) => Promise<void>;
  emergencyNumber: string;
  glucoseUnit: "mg/dL" | "mmol/L";
  tempUnit: "°C" | "°F";
  currency: CountryConfig["currency"];
  countryLanguages: CountryConfig["supportedLanguages"];
  isAutoDetected: boolean;
  isReady: boolean;
}

const CountryContext = createContext<CountryContextState | undefined>(
  undefined
);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountryCodeState] = useState<string>(
    DEFAULT_COUNTRY.code
  );
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Load saved country from AsyncStorage or auto-detect from OS on first launch
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const match = getCountryByCode(saved);
          setCountryCodeState(match.code);
          currentAppCountryCode = match.code;
          setIsAutoDetected(false);
        } else {
          // Strategy 1: Automatic OS Device Detection before signup!
          const detected = detectDeviceCountry();
          console.log(
            "[CountryContext] Auto-detected country from OS before signup:",
            detected.code,
            detected.name
          );
          setCountryCodeState(detected.code);
          currentAppCountryCode = detected.code;
          setIsAutoDetected(true);
          await AsyncStorage.setItem(STORAGE_KEY, detected.code);
        }
      } catch (err) {
        console.warn("[CountryContext] Failed to load/detect country:", err);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setCountryCode = async (code: string) => {
    const validCountry = getCountryByCode(code);
    setCountryCodeState(validCountry.code);
    currentAppCountryCode = validCountry.code;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, validCountry.code);
    } catch (err) {
      console.warn("[CountryContext] Failed to persist country:", err);
    }
  };

  const country = useMemo(
    () => getCountryByCode(countryCode),
    [countryCode]
  );

  const value: CountryContextState = {
    country,
    countryCode: country.code,
    setCountryCode,
    emergencyNumber: country.emergencyNumber,
    glucoseUnit: country.glucoseUnit,
    tempUnit: country.tempUnit,
    currency: country.currency,
    countryLanguages: country.supportedLanguages,
    isAutoDetected,
    isReady,
  };

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return ctx;
}
