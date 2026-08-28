/**
 * constants/countries.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Master configuration for HealthAI's global launch markets.
 * Covers the 8 primary launch countries (India, US, UK, Australia, Canada,
 * UAE, Saudi Arabia, Singapore) plus secondary international dialing destinations.
 */

export interface SupportedLanguage {
  code: string;
  name: string;
  native: string;
  flag: string;
}

export interface CountryConfig {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  dial: string; // Dialing prefix (e.g., "+966")
  flag: string; // Emoji flag
  isLaunchCountry: boolean;
  emergencyNumber: string; // Primary emergency ambulance/dispatch line
  emergencyPolice?: string; // Optional police line
  glucoseUnit: "mg/dL" | "mmol/L"; // Clinical glucose unit standard
  tempUnit: "°C" | "°F"; // Clinical temperature standard
  currency: {
    code: string; // e.g. "SAR", "USD", "INR"
    symbol: string; // e.g. "ر.س", "$", "₹"
    premiumMonthly: string;
    familyMonthly: string;
  };
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  defaultLanguage: string;
  supportedLanguages: SupportedLanguage[];
}

export const COUNTRIES: CountryConfig[] = [
  // ── 8 PRIMARY LAUNCH MARKETS ───────────────────────────────────────────────
  {
    name: "India",
    code: "IN",
    dial: "+91",
    flag: "🇮🇳",
    isLaunchCountry: true,
    emergencyNumber: "112",
    emergencyPolice: "100",
    glucoseUnit: "mg/dL",
    tempUnit: "°C",
    currency: {
      code: "INR",
      symbol: "₹",
      premiumMonthly: "₹149",
      familyMonthly: "₹299",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English", native: "English", flag: "🇮🇳" },
      { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
      { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
      { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
      { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
    ],
  },
  {
    name: "United States",
    code: "US",
    dial: "+1",
    flag: "🇺🇸",
    isLaunchCountry: true,
    emergencyNumber: "911",
    glucoseUnit: "mg/dL",
    tempUnit: "°F",
    currency: {
      code: "USD",
      symbol: "$",
      premiumMonthly: "$4.99",
      familyMonthly: "$9.99",
    },
    dateFormat: "MM/DD/YYYY",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English (US)", native: "English", flag: "🇺🇸" },
      { code: "es", name: "Spanish", native: "Español", flag: "🇺🇸" },
    ],
  },
  {
    name: "United Kingdom",
    code: "GB",
    dial: "+44",
    flag: "🇬🇧",
    isLaunchCountry: true,
    emergencyNumber: "999",
    emergencyPolice: "111", // Non-emergency health line
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "GBP",
      symbol: "£",
      premiumMonthly: "£3.99",
      familyMonthly: "£7.99",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English (UK)", native: "English", flag: "🇬🇧" },
    ],
  },
  {
    name: "Canada",
    code: "CA",
    dial: "+1",
    flag: "🇨🇦",
    isLaunchCountry: true,
    emergencyNumber: "911",
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "CAD",
      symbol: "C$",
      premiumMonthly: "C$6.99",
      familyMonthly: "C$12.99",
    },
    dateFormat: "YYYY-MM-DD",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English (CA)", native: "English", flag: "🇨🇦" },
      { code: "fr", name: "French (Canada)", native: "Français", flag: "🇨🇦" },
    ],
  },
  {
    name: "UAE",
    code: "AE",
    dial: "+971",
    flag: "🇦🇪",
    isLaunchCountry: true,
    emergencyNumber: "998", // Ambulance
    emergencyPolice: "999", // Police
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "AED",
      symbol: "AED",
      premiumMonthly: "AED 19.99",
      familyMonthly: "AED 39.99",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "ar",
    supportedLanguages: [
      { code: "ar", name: "Arabic", native: "العربية", flag: "🇦🇪" },
      { code: "en", name: "English", native: "English", flag: "🇦🇪" },
    ],
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    dial: "+966",
    flag: "🇸🇦",
    isLaunchCountry: true,
    emergencyNumber: "997", // Red Crescent Ambulance
    emergencyPolice: "911", // Unified Emergency
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "SAR",
      symbol: "SAR",
      premiumMonthly: "SAR 19.99",
      familyMonthly: "SAR 39.99",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "ar",
    supportedLanguages: [
      { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
      { code: "en", name: "English", native: "English", flag: "🇸🇦" },
    ],
  },
  {
    name: "Singapore",
    code: "SG",
    dial: "+65",
    flag: "🇸🇬",
    isLaunchCountry: true,
    emergencyNumber: "995", // Ambulance / Civil Defence
    emergencyPolice: "999", // Police
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "SGD",
      symbol: "S$",
      premiumMonthly: "S$6.99",
      familyMonthly: "S$13.99",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English (SG)", native: "English", flag: "🇸🇬" },
      { code: "zh", name: "Chinese", native: "中文 (简体)", flag: "🇸🇬" },
      { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇸🇬" },
      { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇸🇬" },
    ],
  },
  {
    name: "Australia",
    code: "AU",
    dial: "+61",
    flag: "🇦🇺",
    isLaunchCountry: true,
    emergencyNumber: "000",
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "AUD",
      symbol: "A$",
      premiumMonthly: "A$7.99",
      familyMonthly: "A$14.99",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English (AU)", native: "English", flag: "🇦🇺" },
    ],
  },

  // ── SECONDARY INTERNATIONAL COUNTRIES ──────────────────────────────────────
  {
    name: "Germany",
    code: "DE",
    dial: "+49",
    flag: "🇩🇪",
    isLaunchCountry: false,
    emergencyNumber: "112",
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "EUR",
      symbol: "€",
      premiumMonthly: "€4.99",
      familyMonthly: "€9.99",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "de",
    supportedLanguages: [
      { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
      { code: "en", name: "English", native: "English", flag: "🇩🇪" },
    ],
  },
  {
    name: "France",
    code: "FR",
    dial: "+33",
    flag: "🇫🇷",
    isLaunchCountry: false,
    emergencyNumber: "15",
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "EUR",
      symbol: "€",
      premiumMonthly: "€4.99",
      familyMonthly: "€9.99",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "fr",
    supportedLanguages: [
      { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
      { code: "en", name: "English", native: "English", flag: "🇫🇷" },
    ],
  },
  {
    name: "Japan",
    code: "JP",
    dial: "+81",
    flag: "🇯🇵",
    isLaunchCountry: false,
    emergencyNumber: "119",
    glucoseUnit: "mg/dL",
    tempUnit: "°C",
    currency: {
      code: "JPY",
      symbol: "¥",
      premiumMonthly: "¥600",
      familyMonthly: "¥1200",
    },
    dateFormat: "YYYY-MM-DD",
    defaultLanguage: "ja",
    supportedLanguages: [
      { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
      { code: "en", name: "English", native: "English", flag: "🇯🇵" },
    ],
  },
  {
    name: "Brazil",
    code: "BR",
    dial: "+55",
    flag: "🇧🇷",
    isLaunchCountry: false,
    emergencyNumber: "192",
    glucoseUnit: "mg/dL",
    tempUnit: "°C",
    currency: {
      code: "BRL",
      symbol: "R$",
      premiumMonthly: "R$ 19,90",
      familyMonthly: "R$ 39,90",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "pt",
    supportedLanguages: [
      { code: "pt", name: "Portuguese", native: "Português", flag: "🇧🇷" },
      { code: "en", name: "English", native: "English", flag: "🇧🇷" },
    ],
  },
  {
    name: "South Africa",
    code: "ZA",
    dial: "+27",
    flag: "🇿🇦",
    isLaunchCountry: false,
    emergencyNumber: "10177",
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "ZAR",
      symbol: "R",
      premiumMonthly: "R 89",
      familyMonthly: "R 179",
    },
    dateFormat: "YYYY-MM-DD",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English", native: "English", flag: "🇿🇦" },
    ],
  },
  {
    name: "Nigeria",
    code: "NG",
    dial: "+234",
    flag: "🇳🇬",
    isLaunchCountry: false,
    emergencyNumber: "112",
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "NGN",
      symbol: "₦",
      premiumMonthly: "₦ 3,500",
      familyMonthly: "₦ 7,000",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English", native: "English", flag: "🇳🇬" },
    ],
  },
  {
    name: "Pakistan",
    code: "PK",
    dial: "+92",
    flag: "🇵🇰",
    isLaunchCountry: false,
    emergencyNumber: "1122",
    glucoseUnit: "mg/dL",
    tempUnit: "°C",
    currency: {
      code: "PKR",
      symbol: "Rs",
      premiumMonthly: "Rs 1,200",
      familyMonthly: "Rs 2,400",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "ur",
    supportedLanguages: [
      { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰" },
      { code: "en", name: "English", native: "English", flag: "🇵🇰" },
    ],
  },
  {
    name: "Bangladesh",
    code: "BD",
    dial: "+880",
    flag: "🇧🇩",
    isLaunchCountry: false,
    emergencyNumber: "999",
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "BDT",
      symbol: "৳",
      premiumMonthly: "৳ 450",
      familyMonthly: "৳ 900",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "bn",
    supportedLanguages: [
      { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
      { code: "en", name: "English", native: "English", flag: "🇧🇩" },
    ],
  },
  {
    name: "Indonesia",
    code: "ID",
    dial: "+62",
    flag: "🇮🇩",
    isLaunchCountry: false,
    emergencyNumber: "119",
    glucoseUnit: "mg/dL",
    tempUnit: "°C",
    currency: {
      code: "IDR",
      symbol: "Rp",
      premiumMonthly: "Rp 65.000",
      familyMonthly: "Rp 130.000",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "id",
    supportedLanguages: [
      { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
      { code: "en", name: "English", native: "English", flag: "🇮🇩" },
    ],
  },
  {
    name: "Philippines",
    code: "PH",
    dial: "+63",
    flag: "🇵🇭",
    isLaunchCountry: false,
    emergencyNumber: "911",
    glucoseUnit: "mg/dL",
    tempUnit: "°C",
    currency: {
      code: "PHP",
      symbol: "₱",
      premiumMonthly: "₱ 249",
      familyMonthly: "₱ 499",
    },
    dateFormat: "MM/DD/YYYY",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English", native: "English", flag: "🇵🇭" },
      { code: "tl", name: "Tagalog", native: "Filipino", flag: "🇵🇭" },
    ],
  },
  {
    name: "Malaysia",
    code: "MY",
    dial: "+60",
    flag: "🇲🇾",
    isLaunchCountry: false,
    emergencyNumber: "999",
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "MYR",
      symbol: "RM",
      premiumMonthly: "RM 20",
      familyMonthly: "RM 40",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "ms",
    supportedLanguages: [
      { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾" },
      { code: "en", name: "English", native: "English", flag: "🇲🇾" },
    ],
  },
  {
    name: "Kenya",
    code: "KE",
    dial: "+254",
    flag: "🇰🇪",
    isLaunchCountry: false,
    emergencyNumber: "999",
    glucoseUnit: "mmol/L",
    tempUnit: "°C",
    currency: {
      code: "KES",
      symbol: "KSh",
      premiumMonthly: "KSh 600",
      familyMonthly: "KSh 1,200",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "en",
    supportedLanguages: [
      { code: "en", name: "English", native: "English", flag: "🇰🇪" },
      { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪" },
    ],
  },
  {
    name: "Mexico",
    code: "MX",
    dial: "+52",
    flag: "🇲🇽",
    isLaunchCountry: false,
    emergencyNumber: "911",
    glucoseUnit: "mg/dL",
    tempUnit: "°C",
    currency: {
      code: "MXN",
      symbol: "$",
      premiumMonthly: "$99",
      familyMonthly: "$199",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "es",
    supportedLanguages: [
      { code: "es", name: "Spanish", native: "Español", flag: "🇲🇽" },
      { code: "en", name: "English", native: "English", flag: "🇲🇽" },
    ],
  },
  {
    name: "Spain",
    code: "ES",
    dial: "+34",
    flag: "🇪🇸",
    isLaunchCountry: false,
    emergencyNumber: "112",
    glucoseUnit: "mg/dL",
    tempUnit: "°C",
    currency: {
      code: "EUR",
      symbol: "€",
      premiumMonthly: "€4.99",
      familyMonthly: "€9.99",
    },
    dateFormat: "DD/MM/YYYY",
    defaultLanguage: "es",
    supportedLanguages: [
      { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
      { code: "en", name: "English", native: "English", flag: "🇪🇸" },
    ],
  },
];

/** Default fallback country is India (default baseline in current app) */
export const DEFAULT_COUNTRY: CountryConfig = COUNTRIES[0];

/** Helper: Find country config by 2-letter ISO code */
export function getCountryByCode(code?: string | null): CountryConfig {
  if (!code) return DEFAULT_COUNTRY;
  const match = COUNTRIES.find(
    (c) => c.code.toUpperCase() === code.trim().toUpperCase()
  );
  return match || DEFAULT_COUNTRY;
}

/** Helper: Find country config by dialing code (e.g., "+966" or "+1") */
export function getCountryByDial(dial?: string | null): CountryConfig {
  if (!dial) return DEFAULT_COUNTRY;
  const trimmed = dial.trim();
  const match = COUNTRIES.find((c) => c.dial === trimmed);
  return match || DEFAULT_COUNTRY;
}

/**
 * Strategy 1: Detects the user's country from the operating system's locale and timezone.
 * Instant, zero-permission, works on iOS, Android, and Web before sign-up.
 */
export function detectDeviceCountry(): CountryConfig {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions();

    // 1. Check system locale (e.g. "ar-SA", "en-GB", "fr-CA", "en-US", "en-IN", "zh-SG")
    const locale = resolved.locale || "";
    if (locale) {
      const normalized = locale.replace("_", "-");
      const parts = normalized.split("-");
      // Find 2-letter uppercase ISO region code
      const region = parts.find(
        (p) => p.length === 2 && p === p.toUpperCase()
      );
      if (region) {
        const found = COUNTRIES.find((c) => c.code === region);
        if (found) return found;
      }
    }

    // 2. Timezone mapping fallback
    const tz = resolved.timeZone || "";
    if (tz) {
      if (tz.includes("Riyadh")) return getCountryByCode("SA");
      if (tz.includes("Dubai")) return getCountryByCode("AE");
      if (tz.includes("Singapore")) return getCountryByCode("SG");
      if (tz.startsWith("Australia/")) return getCountryByCode("AU");
      if (tz === "Europe/London") return getCountryByCode("GB");
      if (
        tz.includes("Toronto") ||
        tz.includes("Vancouver") ||
        tz.includes("Montreal") ||
        tz.includes("Edmonton") ||
        tz.includes("Winnipeg") ||
        tz.includes("Halifax") ||
        tz.includes("St_Johns")
      ) {
        return getCountryByCode("CA");
      }
      if (
        tz.includes("New_York") ||
        tz.includes("Chicago") ||
        tz.includes("Los_Angeles") ||
        tz.includes("Denver") ||
        tz.includes("Phoenix") ||
        tz.includes("Anchorage") ||
        tz.includes("Honolulu")
      ) {
        return getCountryByCode("US");
      }
      if (tz.includes("Kolkata") || tz.includes("Calcutta")) {
        return getCountryByCode("IN");
      }
      if (tz.includes("Berlin")) return getCountryByCode("DE");
      if (tz.includes("Paris")) return getCountryByCode("FR");
      if (tz.includes("Tokyo")) return getCountryByCode("JP");
      if (tz.includes("Sao_Paulo")) return getCountryByCode("BR");
      if (tz.includes("Johannesburg")) return getCountryByCode("ZA");
      if (tz.includes("Lagos")) return getCountryByCode("NG");
      if (tz.includes("Karachi")) return getCountryByCode("PK");
      if (tz.includes("Dhaka")) return getCountryByCode("BD");
      if (tz.includes("Jakarta")) return getCountryByCode("ID");
      if (tz.includes("Manila")) return getCountryByCode("PH");
      if (tz.includes("Kuala_Lumpur")) return getCountryByCode("MY");
      if (tz.includes("Nairobi")) return getCountryByCode("KE");
      if (tz.includes("Mexico_City")) return getCountryByCode("MX");
    }
  } catch (e) {
    console.warn("[detectDeviceCountry] Auto-detect failed, using default:", e);
  }

  return DEFAULT_COUNTRY;
}
