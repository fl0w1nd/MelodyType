import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import en from "./locales/en"
import zhHans from "./locales/zhHans"
import zhHant from "./locales/zhHant"

export type SupportedLanguage = "en" | "zh-Hans" | "zh-Hant"

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "zh-Hans", "zh-Hant"]

/**
 * Map a browser-detected BCP-47 language tag to one of our supported locales.
 * Browsers report things like "zh-CN", "zh-TW", "zh-Hant-HK" — none of which
 * match our supportedLngs list directly, so without normalization the
 * detector falls through to the English fallback.
 */
function normalizeLanguage(lng?: string | readonly string[] | null): string {
  const raw = Array.isArray(lng) ? lng[0] : (lng as string | null | undefined)
  if (!raw) return "en"

  // Already one of our exact codes.
  if ((SUPPORTED_LANGUAGES as string[]).includes(raw)) return raw

  const lower = raw.toLowerCase()

  // Explicit script tags take precedence.
  if (lower.includes("hans")) return "zh-Hans"
  if (lower.includes("hant")) return "zh-Hant"

  if (lower.startsWith("zh")) {
    // Region-based mapping for legacy zh-XX tags.
    const region = lower.split(/[-_]/)[1]
    if (region === "tw" || region === "hk" || region === "mo") return "zh-Hant"
    // zh, zh-cn, zh-sg, zh-my, … → Simplified by default.
    return "zh-Hans"
  }

  if (lower.startsWith("en")) return "en"

  return "en"
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      "zh-Hans": { translation: zhHans },
      "zh-Hant": { translation: zhHant },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: false,
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "melodytype-language",
      caches: ["localStorage"],
      convertDetectedLanguage: normalizeLanguage,
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
