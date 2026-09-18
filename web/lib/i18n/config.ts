import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import enCommon from "@ciuna/shared/locales/en/common.json"
import ruCommon from "@ciuna/shared/locales/ru/common.json"
import frCommon from "@ciuna/shared/locales/fr/common.json"
import esCommon from "@ciuna/shared/locales/es/common.json"
import enApp from "@ciuna/shared/locales/en/app.json"
import ruApp from "@ciuna/shared/locales/ru/app.json"
import frApp from "@ciuna/shared/locales/fr/app.json"
import esApp from "@ciuna/shared/locales/es/app.json"

const resources = {
  en: { common: enCommon, app: enApp },
  ru: { common: ruCommon, app: ruApp },
  fr: { common: frCommon, app: frApp },
  es: { common: esCommon, app: esApp },
} as const

const isBrowser = typeof window !== "undefined"

if (!i18n.isInitialized) {
  const instance = i18n.use(initReactI18next)
  if (isBrowser) {
    instance.use(LanguageDetector)
  }

  void instance.init({
    resources: resources as unknown as Record<string, Record<string, Record<string, string>>>,
    fallbackLng: "en",
    supportedLngs: ["en", "ru", "fr", "es"],
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    ns: ["common", "app"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    lng: isBrowser ? undefined : "en",
    showSupportNotice: false,
    detection: isBrowser
      ? {
          order: ["localStorage", "navigator"],
          caches: ["localStorage"],
          lookupLocalStorage: "ciuna_locale",
        }
      : undefined,
  })
}

export default i18n
