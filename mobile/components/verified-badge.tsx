import { useState } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { BadgeCheck } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { PrimaryButton } from "./primary-button"
import { colors, radius } from "@/lib/theme"

/**
 * Compact verified mark shown after a seller or expert name. Success colour with an icon (never
 * colour alone), and a label for screen readers. Unverified people show nothing: don't render it.
 * With `explain`, tapping it says in plain words what the check covers (profile screens only).
 */
export function VerifiedBadge({ size = 14, label, kind = "vendor", tier, explain }: { size?: number; label?: string; kind?: "vendor" | "expert"; /** 2 = registered business; anything else reads as an individual check. */ tier?: number; explain?: boolean }) {
  const { t } = useTranslation("app")
  const [open, setOpen] = useState(false)
  const text =
    label ||
    (tier === 2
      ? t("hub.verifiedBusiness", { defaultValue: "Verified business" })
      : kind === "expert"
      ? t("hub.expertVerified", { defaultValue: "Verified expert" })
      : t("hub.verifiedVendor", { defaultValue: "Verified vendor" }))
  const icon = <BadgeCheck size={size} color={colors.success} strokeWidth={2.2} accessibilityLabel={text} />
  if (!explain) return icon
  const body =
    tier === 2
      ? t("hub.verifiedInfoBusiness", { defaultValue: "Ciuna checked this business against its official company details." })
      : t("hub.verifiedInfoIndividual", { defaultValue: "Ciuna checked this person's identity." })
  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel={text} accessibilityHint={t("hub.verifiedInfoHint", { defaultValue: "What does this mean?" })}>
        {icon}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel={t("hub.verifiedInfoClose", { defaultValue: "Got it" })} />
          <View style={styles.card} accessibilityRole="alert">
            <Text style={styles.title}>{text}</Text>
            <Text style={styles.body}>{body}</Text>
            <View style={styles.actions}>
              <PrimaryButton label={t("hub.verifiedInfoClose", { defaultValue: "Got it" })} onPress={() => setOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(17,24,39,0.55)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card + 4, padding: 20, gap: 8 },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.muted },
  actions: { marginTop: 12 },
})
