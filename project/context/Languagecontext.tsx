import { createContext, useContext, useState, ReactNode } from "react";
import {
  translations,
  type LangCode,
  type TranslationKeys,
} from "@/context/Translations";

interface LangState {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: keyof TranslationKeys) => string;
}

const LangContext = createContext<LangState | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>("en");

  const t = (key: keyof TranslationKeys): string => {
    return translations[lang][key] ?? translations["en"][key] ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
