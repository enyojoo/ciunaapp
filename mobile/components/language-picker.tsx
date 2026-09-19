import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ChevronDown, Globe } from "lucide-react-native"
import i18n, { setAppLocale, SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { FlagIcon } from "@/components/flag-icon"
import { SheetPicker } from "@/components/sheet-picker"
import { colors, type as typeSize } from "@/lib/theme"

const LANG_LABEL: Record<AppLocale, string> = {
  en: "English",
  ru: "Русский",
  fr: "Français",
  es: "Español",
}

/** Country whose nucleo-flags icon represents each language, matching web's LanguagePicker choices. */
const LANG_FLAG_COUNTRY: Record<AppLocale, string> = {
  en: "GB",
  ru: "RU",
  fr: "FR",
  es: "ES",
}

export function LanguagePicker({ last }: { last?: boolean }) {
  const { t } = useTranslation("common")
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const current = (i18n.language.split("-")[0] || "en") as AppLocale

  const changeLang = async (lng: AppLocale) => {
    await setAppLocale(lng)
    if (profile?.id) {
      await supabase.from("users").update({ preferred_language: lng }).eq("id", profile.id)
    }
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.row, !last && styles.border]}>
        <View style={styles.icon}>
          <Globe size={16} color={colors.primaryDeep} strokeWidth={2.2} />
        </View>
        <Text style={styles.label}>{t("app.language", { defaultValue: "Language" })}</Text>
        <View style={styles.trail}>
          <FlagIcon code={LANG_FLAG_COUNTRY[current]} size={16} />
          <Text style={styles.current}>{LANG_LABEL[current]}</Text>
          <ChevronDown size={16} color={colors.muted} strokeWidth={2.2} />
        </View>
      </Pressable>
      <SheetPicker
        open={open}
        title={t("app.language", { defaultValue: "Language" })}
        items={[...SUPPORTED_LOCALES]}
        keyExtractor={(lng) => lng}
        labelExtractor={(lng) => LANG_LABEL[lng]}
        leadingExtractor={(lng) => <FlagIcon code={LANG_FLAG_COUNTRY[lng]} size={18} />}
        selectedId={current}
        onSelect={(lng) => void changeLang(lng)}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  row: { minHeight: 52, flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  icon: {
    width: 30,
    height: 30,
    marginRight: 12,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
  },
  label: { flex: 1, fontSize: typeSize.body, color: colors.text },
  trail: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  current: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
})
