"use client"
import * as React from "react"
import { LOCALES, LOCALE_LIST, type Locale } from "@/locales"

const KEY = "ciuna.seller.locale"
type Dict = Record<string, string>
const dicts = LOCALES as unknown as Record<Locale, Dict>

function detect(): Locale {
  try {
    const saved = localStorage.getItem(KEY) as Locale | null
    if (saved && LOCALE_LIST.includes(saved)) return saved
  } catch {}
  const nav = (typeof navigator !== "undefined" ? navigator.language : "en").slice(0, 2).toLowerCase() as Locale
  return LOCALE_LIST.includes(nav) ? nav : "en"
}

interface Ctx { locale: Locale; setLocale: (l: Locale) => void; t: (key: string, vars?: Record<string, string | number>) => string }
const I18nCtx = React.createContext<Ctx>({ locale: "en", setLocale: () => {}, t: (k) => k })

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en")
  React.useEffect(() => { setLocaleState(detect()) }, [])
  React.useEffect(() => { document.documentElement.lang = locale }, [locale])
  const value = React.useMemo<Ctx>(() => ({
    locale,
    setLocale: (l) => { setLocaleState(l); try { localStorage.setItem(KEY, l) } catch {} },
    // English is the fallback so an untranslated key never shows as a raw id.
    t: (key, vars) => {
      const raw = dicts[locale][key] ?? dicts.en[key] ?? key
      return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : raw
    },
  }), [locale])
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}
export const useT = () => React.useContext(I18nCtx)
export { LOCALE_LIST }

/** Maps an API error code to a readable message: `errors.<CODE>` in common, else a generic one. */
export function useErrorText() {
  const { t } = useT()
  return (code: string | undefined) => {
    const key = `errors.${code}`
    const msg = t(key)
    return msg === key ? t("errors.generic") : msg
  }
}
