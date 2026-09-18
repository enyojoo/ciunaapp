import { Pressable, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import i18n, { setAppLocale, SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

const LANG_LABEL: Record<AppLocale, string> = {
  en: "English",
  ru: "Русский",
  fr: "Français",
  es: "Español",
}

export function LanguagePicker() {
  const { t } = useTranslation("common")
  const { profile } = useAuth()
  const current = (i18n.language.split("-")[0] || "en") as AppLocale

  const changeLang = async (lng: AppLocale) => {
    await setAppLocale(lng)
    if (profile?.id) {
      await supabase.from("users").update({ preferred_language: lng }).eq("id", profile.id)
    }
  }

  return (
    <View className="mt-5">
      <Text className="mb-2 font-semibold text-gray-900">{t("more.language", { defaultValue: "Language" })}</Text>
      {SUPPORTED_LOCALES.map((lng) => (
        <Pressable key={lng} onPress={() => void changeLang(lng)} className="py-2.5">
          <Text className={current === lng ? "font-bold text-primary" : "text-gray-900"}>{LANG_LABEL[lng]}</Text>
        </Pressable>
      ))}
    </View>
  )
}
