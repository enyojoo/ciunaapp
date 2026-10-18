import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Check, ChevronDown, Users } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import type { CommunityId } from "@ciuna/shared"
import { PressableScale } from "@/components/ui/pressable-scale"
import { Sheet } from "@/components/ui/sheet"
import { useAvailableCommunities, useCommunity } from "@/lib/community"
import { colors, radius, type as typeSize } from "@/lib/theme"

/**
 * Header control for Food and Mart: filter stores by the community they serve (Nigerian, Chinese, ...). Shows
 * "Community" until one is chosen, then its name. Only communities that at least one store serves are listed, and the
 * control stays hidden until stores have set any.
 */
export function CommunityPill() {
  const { t } = useTranslation("app")
  const { community, setCommunity } = useCommunity()
  const available = useAvailableCommunities()
  const [open, setOpen] = useState(false)
  if (available.length === 0 && !community) return null

  const name = (id: CommunityId) => t(`hub.community_${id}`, { defaultValue: id })
  const choose = (next: CommunityId | null) => {
    void setCommunity(next)
    setOpen(false)
  }
  const options = community && !available.includes(community) ? [community, ...available] : available

  return (
    <>
      <PressableScale
        onPress={() => setOpen(true)}
        haptics
        scaleTo={0.96}
        accessibilityRole="button"
        accessibilityLabel={`${t("hub.communityLabel", { defaultValue: "Community" })}: ${community ? name(community) : t("hub.communityAll", { defaultValue: "All communities" })}`}
        hitSlop={6}
        style={styles.pill}
      >
        <Users size={16} color={colors.text} strokeWidth={2.2} />
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {community ? name(community) : t("hub.communityLabel", { defaultValue: "Community" })}
        </Text>
        <ChevronDown size={14} color={colors.muted} strokeWidth={2.4} />
      </PressableScale>
      <Sheet open={open} title={t("hub.communityTitle", { defaultValue: "Choose a community" })} onClose={() => setOpen(false)}>
        <Text style={styles.hint}>
          {t("hub.communityHint", { defaultValue: "Show stores that serve a community, such as Nigerian or Chinese food and groceries." })}
        </Text>
        <Row label={t("hub.communityAll", { defaultValue: "All communities" })} selected={!community} onPress={() => choose(null)} />
        {options.map((id) => (
          <Row key={id} label={name(id)} selected={community === id} onPress={() => choose(id)} />
        ))}
      </Sheet>
    </>
  )
}

function Row({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} style={styles.row}>
      <Text style={[styles.rowLabel, selected && styles.rowLabelOn]}>{label}</Text>
      {selected ? <Check size={20} color={colors.primary} strokeWidth={2.4} /> : <View style={styles.checkSpace} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 36,
    width: 142,
    flexShrink: 1,
    paddingHorizontal: 10,
    marginRight: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { flex: 1, minWidth: 0, fontSize: typeSize.meta, fontWeight: "600", color: colors.text },
  hint: { fontSize: typeSize.meta, lineHeight: 18, color: colors.muted, marginBottom: 8 },
  row: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { fontSize: typeSize.body, color: colors.text },
  rowLabelOn: { fontWeight: "700" },
  checkSpace: { width: 20 },
})
