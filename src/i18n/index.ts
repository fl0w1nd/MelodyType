import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import en from "./locales/en"
import zhHans from "./locales/zhHans"
import zhHant from "./locales/zhHant"

export type SupportedLanguage = "en" | "zh-Hans" | "zh-Hant"

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "zh-Hans", "zh-Hant"]

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
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "melodytype-language",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
