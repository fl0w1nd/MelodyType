import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import en from "./locales/en"
import zh from "./locales/zh"

export type SupportedLanguage = "en" | "zh"

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "zh"]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    // LanguageDetector order: localStorage key "i18nextLng", then browser navigator
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
