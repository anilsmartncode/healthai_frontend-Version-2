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
  enTranslations,
  STATIC_LANGUAGES,
  type LangCode,
  type TranslationKeys,
} from "@/context/Translations";
import { useCountry } from "@/context/CountryContext";
import { api } from "@/services/api";
import { ENDPOINTS } from "@/constants/api";
import { storage } from "@/utils/storage";

const STORAGE_KEY = "@healthai_selected_language";
const DYNAMIC_CACHE_PREFIX = "@healthai_dynamic_lang_";

// In-memory active language code for non-React callers (e.g. API clients)
export let currentAppLangCode: LangCode = "en";

export function isRTLLang(code: LangCode): boolean {
  return code === "ar" || code === "ur" || code === "fa" || code === "he";
}

interface LangState {
  lang: LangCode;
  setLang: (l: LangCode) => Promise<void>;
  t: (key: keyof TranslationKeys) => string;
  isRTL: boolean;
  writingDirection: "rtl" | "ltr";
  textAlign: "right" | "left";
  rowDirection: "row-reverse" | "row";
  isTranslatingLang: boolean;
}

const LangContext = createContext<LangState | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");
  const [dynamicDicts, setDynamicDicts] = useState<Record<string, Record<string, string>>>({});
  const [isTranslatingLang, setIsTranslatingLang] = useState(false);
  const { country } = useCountry();

  // Load saved language on boot, or fallback to detected country default
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        let activeLang: LangCode = "en";
        if (saved) {
          activeLang = saved as LangCode;
          // If it's a dynamic language, load cached dictionary from AsyncStorage
          if (!STATIC_LANGUAGES.has(saved)) {
            const cached = await AsyncStorage.getItem(`${DYNAMIC_CACHE_PREFIX}${saved}`);
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                setDynamicDicts((prev) => ({ ...prev, [saved]: parsed }));
              } catch {}
            }
          }
        } else if (country?.defaultLanguage) {
          activeLang = country.defaultLanguage as LangCode;
        }
        setLangState(activeLang);
        currentAppLangCode = activeLang;

        // Sync native I18nManager for Right-to-Left script
        const shouldRTL = isRTLLang(activeLang);
        try {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(shouldRTL);
        } catch (e) {
          // ignore on web/unsupported
        }
      } catch (err) {
        console.warn("[LanguageProvider] Failed to load saved language:", err);
      }
    })();
  }, []);

  // When user switches country, automatically switch to that country's default language
  useEffect(() => {
    if (country?.defaultLanguage) {
      setLang(country.defaultLanguage as LangCode);
    }
  }, [country?.code]);

  const translateKeysInBatches = async (targetLang: string): Promise<Record<string, string>> => {
    const keys = Object.keys(enTranslations) as (keyof TranslationKeys)[];
    const chunkSize = 40;
    const chunks: (keyof TranslationKeys)[][] = [];
    for (let i = 0; i < keys.length; i += chunkSize) {
      chunks.push(keys.slice(i, i + chunkSize));
    }

    const newDict: Record<string, string> = {};
    const delimiter = "\n|||\n";

    // Obtain guest token if user is not authenticated yet
    let authHeader: Record<string, string> = {};
    try {
      const existingToken = await storage.get<string>("token");
      if (!existingToken) {
        const { signInAsGuest } = await import("@/utils/guestAuth");
        const guestRes = await signInAsGuest();
        if (guestRes?.idToken) {
          authHeader = { Authorization: `Bearer ${guestRes.idToken}` };
        }
      }
    } catch {}

    const translateChunk = async (chunkKeys: (keyof TranslationKeys)[]) => {
      const chunkValues = chunkKeys.map((k) => enTranslations[k]);
      const combinedText = chunkValues.join(delimiter);

      try {
        const res = await api.request<any>(ENDPOINTS.translateTextPath, {
          method: "POST",
          headers: authHeader,
          body: JSON.stringify({
            text: combinedText,
            language: targetLang,
          }),
        });

        const translatedCombined = res?.translate_text ?? res?.translated_text;
        if (translatedCombined && typeof translatedCombined === "string") {
          const translatedPieces = translatedCombined.split(/\|\|\|/g).map((s) => s.trim());
          chunkKeys.forEach((k, idx) => {
            newDict[k] = translatedPieces[idx] || enTranslations[k];
          });
        } else {
          chunkKeys.forEach((k) => {
            newDict[k] = enTranslations[k];
          });
        }
      } catch (e) {
        console.warn(`[LanguageProvider] Chunk translation error for ${targetLang}:`, e);
        chunkKeys.forEach((k) => {
          newDict[k] = enTranslations[k];
        });
      }
    };

    // Run chunks in concurrent batches of 3
    for (let i = 0; i < chunks.length; i += 3) {
      const batch = chunks.slice(i, i + 3);
      await Promise.all(batch.map((c) => translateChunk(c)));
    }

    return newDict;
  };

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

    // ── If the language is NOT already in our static dictionary, dynamically translate & cache ──
    if (!STATIC_LANGUAGES.has(l) && !dynamicDicts[l]) {
      // Check local storage cache first
      try {
        const cached = await AsyncStorage.getItem(`${DYNAMIC_CACHE_PREFIX}${l}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setDynamicDicts((prev) => ({ ...prev, [l]: parsed }));
          return;
        }

        // Fetch on-demand from /api/translate-text
        setIsTranslatingLang(true);
        console.log(`[LanguageProvider] Fetching on-demand translations from API for '${l}'...`);
        const newDict = await translateKeysInBatches(l);

        // Save in memory and persist in phone storage
        setDynamicDicts((prev) => ({ ...prev, [l]: newDict }));
        await AsyncStorage.setItem(`${DYNAMIC_CACHE_PREFIX}${l}`, JSON.stringify(newDict));
        console.log(`[LanguageProvider] Successfully cached translations for '${l}' (${Object.keys(newDict).length} keys)`);
      } catch (err) {
        console.warn(`[LanguageProvider] Dynamic translation for ${l} failed:`, err);
      } finally {
        setIsTranslatingLang(false);
      }
    }
  };

  const t = (key: keyof TranslationKeys): string => {
    // 1. Static precompiled translation
    if (STATIC_LANGUAGES.has(lang) && translations[lang]?.[key]) {
      return translations[lang][key] as string;
    }
    // 2. Dynamically fetched & cached translation
    if (dynamicDicts[lang]?.[key]) {
      return dynamicDicts[lang][key];
    }
    // 3. Fallback to static if present
    if (translations[lang]?.[key]) {
      return translations[lang][key] as string;
    }
    // 4. Fallback to English
    return translations["en"]?.[key] ?? key;
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
    isTranslatingLang,
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
