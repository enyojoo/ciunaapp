import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as Localization from "expo-localization"
import AsyncStorage from "@react-native-async-storage/async-storage"

import enCommon from "@ciuna/shared/locales/en/common.json"
import ruCommon from "@ciuna/shared/locales/ru/common.json"
import frCommon from "@ciuna/shared/locales/fr/common.json"
import esCommon from "@ciuna/shared/locales/es/common.json"
import enApp from "@ciuna/shared/locales/en/app.json"
import ruApp from "@ciuna/shared/locales/ru/app.json"
import frApp from "@ciuna/shared/locales/fr/app.json"
import esApp from "@ciuna/shared/locales/es/app.json"

export const SUPPORTED_LOCALES = ["en", "ru", "fr", "es"] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const resources = {
  en: { common: enCommon, app: enApp },
  ru: { common: ruCommon, app: ruApp },
  fr: { common: frCommon, app: frApp },
  es: { common: esCommon, app: esApp },
}

const STORAGE_KEY = "ciuna_locale"

function deviceLocale(): AppLocale {
  const tag = Localization.getLocales()[0]?.languageCode ?? "en"
  return (SUPPORTED_LOCALES as readonly string[]).includes(tag) ? (tag as AppLocale) : "en"
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: resources as never,
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LOCALES],
    ns: ["common", "app"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    lng: deviceLocale(),
    showSupportNotice: false,
  })
}

export async function hydrateLocale(): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    await i18n.changeLanguage(stored)
  }
}

export async function setAppLocale(lng: AppLocale): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, lng)
  await i18n.changeLanguage(lng)
}

export default i18n
