"use client"

import { useTranslation } from "react-i18next"
import { IconBrazil, IconChina, IconFrance, IconRussia, IconSpain, IconUnitedKingdom } from "nucleo-flags"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import i18n from "@/lib/i18n/config"
import { useAuth } from "@/lib/auth-context"
import { userService } from "@/lib/database"

const FLAGS = {
  en: IconUnitedKingdom,
  ru: IconRussia,
  fr: IconFrance,
  es: IconSpain,
  zh: IconChina,
  pt: IconBrazil,
} as const

type LocaleCode = keyof typeof FLAGS

const CODES: LocaleCode[] = ["en", "ru", "fr", "es", "zh", "pt"]

function normalizeLng(lng: string): LocaleCode {
  const base = (lng.split("-")[0] ?? "en") as LocaleCode
  return base in FLAGS ? base : "en"
}

export function LanguagePicker() {
  const { t } = useTranslation("common")
  const { user, userProfile, refreshUserProfile } = useAuth()
  const value = normalizeLng(i18n.language)

  const handleChange = async (v: LocaleCode) => {
    await i18n.changeLanguage(v)
    if (user && !userProfile?.id?.startsWith("admin")) {
      try {
        await userService.updateProfile(user.id, { preferredLanguage: v })
        await refreshUserProfile?.()
      } catch (err) {
        console.warn("Failed to persist preferred_language:", err)
      }
    }
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 gap-3">
      <span className="text-base text-gray-900 shrink-0">{t("app.language")}</span>
      <Select
        value={value}
        onValueChange={(v) => {
          void handleChange(v as LocaleCode)
        }}
      >
        <SelectTrigger className="w-[min(100%,13rem)] h-11 rounded-lg border-gray-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {CODES.map((code) => {
            const Flag = FLAGS[code]
            return (
              <SelectItem key={code} value={code} className="pl-8">
                <span className="flex items-center gap-2">
                  <Flag size={18} className="shrink-0 rounded-sm" aria-hidden />
                  <span>{t(`languages.${code}`)}</span>
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
