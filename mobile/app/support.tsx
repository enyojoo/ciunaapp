import { useMemo, useState } from "react"
import { Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Clock, Mail, MessageCircle, Minus, Plus } from "lucide-react-native"
import { GroupCard } from "@/components/row"
import { ScreenScroll } from "@/components/screen"
import { BRAND } from "@ciuna/shared"
import { colors, radius, type as typeSize } from "@/lib/theme"

export default function SupportScreen() {
  const { t } = useTranslation("app")
  const [expanded, setExpanded] = useState<number | null>(null)

  const faqItems = useMemo(
    () => [
      { q: t("support.faq1q"), a: t("support.faq1a") },
      { q: t("support.faq2q"), a: t("support.faq2a") },
      { q: t("support.faq3q"), a: t("support.faq3a") },
    ],
    [t],
  )

  return (
    <ScreenScroll edges={["left", "right"]}>
      <GroupCard title={t("support.getInTouch")}>
        <Pressable
          style={[styles.contactRow, styles.border]}
          onPress={() => void Linking.openURL(`mailto:${BRAND.email}?subject=Support Request`)}
        >
          <View style={styles.contactIcon}>
            <Mail size={18} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.contactBody}>
            <Text style={styles.contactTitle}>{t("support.emailSupport")}</Text>
            <Text style={styles.contactSub}>{BRAND.email}</Text>
          </View>
        </Pressable>
        <Pressable style={styles.contactRow} onPress={() => void Linking.openURL("https://t.me/enyosamm")}>
          <View style={styles.contactIcon}>
            <MessageCircle size={18} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.contactBody}>
            <Text style={styles.contactTitle}>{t("support.telegramChat")}</Text>
            <Text style={styles.contactSub}>{t("support.telegramSubtitle")}</Text>
          </View>
        </Pressable>
      </GroupCard>

      <GroupCard title={t("support.faqTitle")}>
        {faqItems.map((item, i) => {
          const open = expanded === i
          return (
            <View key={i} style={[styles.faqItem, i < faqItems.length - 1 && styles.border]}>
              <Pressable style={styles.faqHead} onPress={() => setExpanded(open ? null : i)}>
                <Text style={styles.faqQ}>{item.q}</Text>
                {open ? (
                  <Minus size={16} color={colors.muted} strokeWidth={2} />
                ) : (
                  <Plus size={16} color={colors.muted} strokeWidth={2} />
                )}
              </Pressable>
              {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
            </View>
          )
        })}
      </GroupCard>

      <GroupCard>
        <View style={styles.hoursRow}>
          <Clock size={16} color={colors.text} strokeWidth={2} />
          <Text style={styles.hoursTitle}>{t("support.hoursTitle")}</Text>
        </View>
        <Text style={styles.hoursBody}>{t("support.hoursBody")}</Text>
      </GroupCard>
    </ScreenScroll>
  )
}

const styles = StyleSheet.create({
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 12 },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.heroBody,
  },
  contactBody: { flex: 1 },
  contactTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  contactSub: { marginTop: 2, fontSize: 12, color: colors.muted },
  faqItem: { paddingVertical: 12 },
  faqHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 32 },
  faqQ: { flex: 1, marginRight: 12, fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  faqA: { marginTop: 8, fontSize: typeSize.meta, lineHeight: 20, color: colors.muted },
  hoursRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 14 },
  hoursTitle: { fontSize: typeSize.body, fontWeight: "600", color: colors.text },
  hoursBody: { marginTop: 8, paddingBottom: 14, fontSize: typeSize.meta, lineHeight: 20, color: colors.muted },
})
