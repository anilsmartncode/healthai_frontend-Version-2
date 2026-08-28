import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  translations,
  type LangCode,
  type TranslationKeys,
} from "@/context/Translations";
import { useCountry } from "@/context/CountryContext";

const STORAGE_KEY = "@healthai_selected_language";

// In-memory active language code for non-React callers (e.g. API clients)
export let currentAppLangCode: LangCode = "en";

export function isRTLLang(code: LangCode): boolean {
  return code === "ar";
}

interface LangState {
  lang: LangCode;
  setLang: (l: LangCode) => Promise<void>;
  t: (key: keyof TranslationKeys) => string;
  isRTL: boolean;
  writingDirection: "rtl" | "ltr";
  textAlign: "right" | "left";
  rowDirection: "row-reverse" | "row";
}

const LangContext = createContext<LangState | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");
  const { country } = useCountry();

  // Load saved language on boot, or fallback to detected country default
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        let activeLang: LangCode = "en";
        if (saved && saved in translations) {
          activeLang = saved as LangCode;
        } else if (country?.defaultLanguage && country.defaultLanguage in translations) {
          activeLang = country.defaultLanguage as LangCode;
        }
        setLangState(activeLang);
        currentAppLangCode = activeLang;

        // Sync native I18nManager for Right-to-Left script
        const shouldRTL = isRTLLang(activeLang);
        try {
          I18nManager.allowRTL(true);
          if (I18nManager.isRTL !== shouldRTL) {
            I18nManager.forceRTL(shouldRTL);
          }
        } catch (e) {
          // ignore on web/unsupported
        }
      } catch (err) {
        console.warn("[LanguageProvider] Failed to load saved language:", err);
      }
    })();
  }, [country?.defaultLanguage]);

  const setLang = async (l: LangCode) => {
    const shouldRTL = isRTLLang(l);
    setLangState(l);
    currentAppLangCode = l;

    // Sync native I18nManager
    try {
      I18nManager.allowRTL(true);
      if (I18nManager.isRTL !== shouldRTL) {
        I18nManager.forceRTL(shouldRTL);
      }
    } catch (e) {
      console.warn("[LanguageProvider] I18nManager error:", e);
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, l);
    } catch (err) {
      console.warn("[LanguageProvider] Failed to persist language:", err);
    }
  };

  const t = (key: keyof TranslationKeys): string => {
    return translations[lang]?.[key] ?? translations["en"]?.[key] ?? key;
  };

  const isRTL = isRTLLang(lang);

  const value: LangState = {
    lang,
    setLang,
    t,
    isRTL,
    writingDirection: isRTL ? "rtl" : "ltr",
    textAlign: isRTL ? "right" : "left",
    rowDirection: isRTL ? "row-reverse" : "row",
  };

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
