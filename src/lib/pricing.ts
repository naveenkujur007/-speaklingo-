// Country-based pricing system + hint language detection.

export type CountryTier = "low" | "mid" | "high";
export type Currency = "INR" | "USD" | "EUR" | "GBP" | "BRL";

export interface PricingPlan {
  tier: CountryTier;
  countryName: string;
  countryCode: string;
  currency: Currency;
  currencySymbol: string;
  monthly: number;
  yearly: number;
  monthlyDisplay: string;
  yearlyDisplay: string;
  yearlyPerMonth: string;
  discount: number;
}

const COUNTRY_TIERS: Record<string, CountryTier> = {
  IN: "low", PK: "low", BD: "low", NP: "low", LK: "low",
  NG: "low", KE: "low", GH: "low", UG: "low", TZ: "low",
  ET: "low", VN: "low", PH: "low", ID: "low", EG: "low",
  MA: "low", UA: "low", UZ: "low",
  BR: "mid", MX: "mid", AR: "mid", CO: "mid", CL: "mid",
  PE: "mid", TH: "mid", MY: "mid", TR: "mid", ZA: "mid",
  PL: "mid", RO: "mid", BG: "mid", GR: "mid", PT: "mid",
  HU: "mid", CZ: "mid", RU: "mid", CN: "mid",
  US: "high", CA: "high", GB: "high", AU: "high", NZ: "high",
  DE: "high", FR: "high", IT: "high", ES: "high", NL: "high",
  BE: "high", AT: "high", CH: "high", IE: "high", DK: "high",
  SE: "high", NO: "high", FI: "high", JP: "high", KR: "high",
  SG: "high", HK: "high", TW: "high", IL: "high",
  AE: "high", SA: "high", QA: "high", KW: "high", BH: "high", OM: "high",
};

const TIER_PRICING: Record<
  CountryTier,
  { currency: Currency; monthly: number; yearly: number }
> = {
  low: { currency: "INR", monthly: 99, yearly: 499 },
  mid: { currency: "EUR", monthly: 4.99, yearly: 24.99 },
  high: { currency: "USD", monthly: 9.99, yearly: 49.99 },
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", BRL: "R$",
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India", US: "United States", GB: "United Kingdom",
  CA: "Canada", AU: "Australia", DE: "Germany", FR: "France",
  BR: "Brazil", MX: "Mexico", ES: "Spain", IT: "Italy",
  JP: "Japan", CN: "China", KR: "South Korea", AE: "UAE",
  SG: "Singapore", ID: "Indonesia", VN: "Vietnam",
};

export function detectCountry(): string {
  if (typeof window === "undefined") return "US";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const tzToCountry: Record<string, string> = {
      "Asia/Kolkata": "IN", "Asia/Karachi": "PK", "Asia/Dhaka": "BD",
      "Asia/Jakarta": "ID", "Asia/Bangkok": "TH", "Asia/Manila": "PH",
      "Asia/Ho_Chi_Minh": "VN", "Asia/Tokyo": "JP", "Asia/Seoul": "KR",
      "Asia/Singapore": "SG", "Asia/Hong_Kong": "HK", "Asia/Shanghai": "CN",
      "Asia/Dubai": "AE", "Asia/Riyadh": "SA",
      "Europe/London": "GB", "Europe/Paris": "FR", "Europe/Berlin": "DE",
      "Europe/Madrid": "ES", "Europe/Rome": "IT", "Europe/Amsterdam": "NL",
      "America/New_York": "US", "America/Chicago": "US",
      "America/Denver": "US", "America/Los_Angeles": "US",
      "America/Toronto": "CA", "America/Mexico_City": "MX",
      "America/Sao_Paulo": "BR", "Australia/Sydney": "AU",
    };
    const country = tzToCountry[tz];
    if (country) return country;
  } catch {}
  try {
    const lang = navigator.language || "";
    const parts = lang.split("-");
    if (parts.length === 2) return parts[1].toUpperCase();
  } catch {}
  return "US";
}

export function getPricingForCountry(countryCode: string): PricingPlan {
  const tier = COUNTRY_TIERS[countryCode] ?? "high";
  const pricing = TIER_PRICING[tier];
  const symbol = CURRENCY_SYMBOLS[pricing.currency];
  const countryName = COUNTRY_NAMES[countryCode] ?? "Your Region";
  const monthlyDisplay = `${symbol}${pricing.monthly}`;
  const yearlyDisplay = `${symbol}${pricing.yearly}`;
  const yearlyPerMonth = `${symbol}${(pricing.yearly / 12).toFixed(2)}`;
  const monthlyCostPerYear = pricing.monthly * 12;
  const discount = Math.round(
    ((monthlyCostPerYear - pricing.yearly) / monthlyCostPerYear) * 100
  );
  return {
    tier, countryName, countryCode,
    currency: pricing.currency, currencySymbol: symbol,
    monthly: pricing.monthly, yearly: pricing.yearly,
    monthlyDisplay, yearlyDisplay, yearlyPerMonth, discount,
  };
}

export function detectPricing(): PricingPlan {
  if (typeof window === "undefined") return getPricingForCountry("US");
  return getPricingForCountry(detectCountry());
}

export const FREE_LESSON_LIMIT = 5;

// ============================================================
// HINT LANGUAGE — explanations in user's native language
// ============================================================
export type HintLanguage =
  | "Hindi/Hinglish" | "English" | "Spanish" | "Portuguese"
  | "French" | "German" | "Arabic" | "Chinese" | "Japanese"
  | "Indonesian" | "Russian" | "Turkish";

export interface HintLanguageOption {
  code: HintLanguage;
  label: string;
  flag: string;
}

export const HINT_LANGUAGES: HintLanguageOption[] = [
  { code: "English", label: "English", flag: "🌐" },
  { code: "Hindi/Hinglish", label: "Hindi / Hinglish", flag: "🇮🇳" },
  { code: "Spanish", label: "Spanish", flag: "🇪🇸" },
  { code: "Portuguese", label: "Portuguese", flag: "🇧🇷" },
  { code: "French", label: "French", flag: "🇫🇷" },
  { code: "German", label: "German", flag: "🇩🇪" },
  { code: "Arabic", label: "Arabic", flag: "🇸🇦" },
  { code: "Chinese", label: "Chinese", flag: "🇨🇳" },
  { code: "Japanese", label: "Japanese", flag: "🇯🇵" },
  { code: "Indonesian", label: "Indonesian", flag: "🇮🇩" },
  { code: "Russian", label: "Russian", flag: "🇷🇺" },
  { code: "Turkish", label: "Turkish", flag: "🇹🇷" },
];

const COUNTRY_HINT_LANGUAGE: Record<string, HintLanguage> = {
  IN: "Hindi/Hinglish", PK: "Hindi/Hinglish", BD: "Hindi/Hinglish",
  NP: "Hindi/Hinglish", LK: "Hindi/Hinglish",
  ES: "Spanish", MX: "Spanish", AR: "Spanish", CO: "Spanish",
  CL: "Spanish", PE: "Spanish",
  BR: "Portuguese", PT: "Portuguese",
  FR: "French", BE: "French",
  DE: "German", AT: "German",
  SA: "Arabic", AE: "Arabic", QA: "Arabic", KW: "Arabic",
  BH: "Arabic", OM: "Arabic", EG: "Arabic", MA: "Arabic",
  CN: "Chinese", TW: "Chinese", HK: "Chinese",
  JP: "Japanese", ID: "Indonesian",
  RU: "Russian", UA: "Russian", UZ: "Russian", KZ: "Russian",
  TR: "Turkish",
};

export function detectHintLanguage(): HintLanguage {
  if (typeof window === "undefined") return "English";
  const country = detectCountry();
  return COUNTRY_HINT_LANGUAGE[country] ?? "English";
}
