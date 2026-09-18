import i18next, { type i18n as I18nInstance } from "i18next"

import enEmails from "@/locales/en/emails.json"
import ruEmails from "@/locales/ru/emails.json"
import frEmails from "@/locales/fr/emails.json"
import esEmails from "@/locales/es/emails.json"

export type EmailLocale = "en" | "ru" | "fr" | "es"

const SUPPORTED_LOCALES: EmailLocale[] = ["en", "ru", "fr", "es"]

let instance: I18nInstance | null = null

function getInstance(): I18nInstance {
  if (instance && instance.isInitialized) return instance

  const server = i18next.createInstance()
  void server.init({
    resources: {
      en: { emails: enEmails },
      ru: { emails: ruEmails },
      fr: { emails: frEmails },
      es: { emails: esEmails },
    },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LOCALES,
    ns: ["emails"],
    defaultNS: "emails",
    interpolation: { escapeValue: false },
    initImmediate: false,
  })

  instance = server
  return server
}

export function normalizeEmailLocale(lng: string | null | undefined): EmailLocale {
  const base = ((lng ?? "en").split("-")[0] ?? "en") as EmailLocale
  return (SUPPORTED_LOCALES as string[]).includes(base) ? base : "en"
}

/** Translate an email string key for the given locale. Falls back to `en` automatically. */
export function tEmail(
  key: string,
  opts?: Record<string, unknown>,
  lng?: string | null,
): string {
  const i18n = getInstance()
  const locale = normalizeEmailLocale(lng)
  return i18n.t(key, { ...opts, lng: locale }) as string
}

/** Format a date for the given email locale. Safe for invalid dates (returns empty). */
export function formatEmailDate(value: string | Date | null | undefined, lng?: string | null): string {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ""
  const locale = normalizeEmailLocale(lng)
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  } catch {
    return date.toDateString()
  }
}
