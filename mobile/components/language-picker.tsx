import { Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react-native"
import i18n, { setAppLocale, SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { colors, type as typeSize } from "@/lib/theme"

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
    <View style={styles.wrap}>
      <Text style={styles.caption}>{t("app.language", { defaultValue: "Language" })}</Text>
      {SUPPORTED_LOCALES.map((lng) => (
        <Pressable key={lng} onPress={() => void changeLang(lng)} style={styles.row}>
          <Text style={[styles.label, current === lng && styles.active]}>{LANG_LABEL[lng]}</Text>
          {current === lng ? <Check size={18} color={colors.primary} /> : null}
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: 12 },
  caption: { marginBottom: 4, fontSize: typeSize.meta, color: colors.muted },
  row: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  label: { fontSize: typeSize.body, color: colors.text },
  active: { fontWeight: "600" },
})
