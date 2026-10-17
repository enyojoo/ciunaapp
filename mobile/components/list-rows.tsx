import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { MapPin } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { FavouriteHeart } from "@/components/favourite-heart"
import { VerifiedBadge } from "@/components/verified-badge"
import { languageName } from "@/lib/language-name"
import { storeOpenLine } from "@/lib/store-hours"
import type { ExpertProfile, HubVendor } from "@/lib/types"
import { colors, radius, type as typeSize } from "@/lib/theme"

/** Round 48px picture with the first letter as a fallback. */
function Thumb({ url, name }: { url?: string | null; name: string }) {
  return (
    <View style={styles.thumb}>
      {url ? (
        <Image source={{ uri: url }} style={styles.thumbImg} contentFit="cover" />
      ) : (
        <Text style={styles.initial}>{(name.trim().charAt(0) || "?").toUpperCase()}</Text>
      )}
    </View>
  )
}

/** A store as a list row: logo, name and verified mark, rating, location, closed state, heart. */
export function StoreRow({ vendor, onPress }: { vendor: HubVendor; onPress: () => void }) {
  const { t, i18n } = useTranslation("app")
  const count = Number(vendor.rating_count ?? 0)
  const avg = Number(vendor.rating_avg ?? 0)
  const rated = count > 0 && Number.isFinite(avg)
  const open = storeOpenLine(vendor, t, i18n.language)
  const closed = open && !open.open
  const location = (vendor.location || "").trim()
  return (
    <View style={[styles.row, closed && styles.rowClosed]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={vendor.name} style={styles.press}>
        <Thumb url={vendor.photo_url} name={vendor.name} />
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {vendor.name}
            </Text>
            {vendor.is_verified ? <VerifiedBadge size={15} tier={vendor.verification_tier} /> : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {[rated ? `★ ${avg.toFixed(1)} (${count})` : null, closed ? open.text : null].filter(Boolean).join(" · ") || " "}
          </Text>
          {location ? (
            <View style={styles.locRow}>
              <MapPin size={12} color={colors.muted} strokeWidth={2} />
              <Text style={styles.loc} numberOfLines={1} ellipsizeMode="tail">
                {location}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <FavouriteHeart type="vendor" id={vendor.id} style={styles.heart} />
    </View>
  )
}

/** An expert as a list row: avatar, name and verified mark, role, languages, rating, heart. */
export function ExpertRow({ expert, onPress }: { expert: ExpertProfile; onPress: () => void }) {
  const { t, i18n } = useTranslation("app")
  const count = Number(expert.rating_count ?? 0)
  const avg = Number(expert.rating_avg ?? 0)
  const rated = count > 0 && avg > 0
  const role = (expert.headline || expert.category || "").trim()
  const languages = (expert.languages ?? []).map((l) => languageName(l, i18n.language)).join(", ")
  return (
    <View style={styles.row}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={expert.display_name} style={styles.press}>
        <Thumb url={expert.image_url} name={expert.display_name} />
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {expert.display_name}
            </Text>
            {expert.is_verified ? <VerifiedBadge size={15} kind="expert" tier={expert.verification_tier} /> : null}
          </View>
          {role ? (
            <Text style={styles.meta} numberOfLines={1}>
              {role}
            </Text>
          ) : null}
          <Text style={styles.loc} numberOfLines={1}>
            {[rated ? `★ ${avg.toFixed(1)} (${count})` : null, languages].filter(Boolean).join(" · ") || " "}
          </Text>
        </View>
      </Pressable>
      <FavouriteHeart type="expert" id={expert.id} style={styles.heart} />
    </View>
  )
}

export function RowSkeleton() {
  return <View style={[styles.row, styles.skeleton]} />
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 76,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowClosed: { opacity: 0.75 },
  press: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  thumb: { width: 48, height: 48, borderRadius: 24, overflow: "hidden", backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  thumbImg: { width: "100%", height: "100%" },
  initial: { fontSize: typeSize.headline, fontWeight: "700", color: colors.primaryText },
  body: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { flexShrink: 1, fontSize: typeSize.label, fontWeight: "700", color: colors.text },
  meta: { fontSize: typeSize.meta, color: colors.muted },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  loc: { flexShrink: 1, fontSize: typeSize.meta, color: colors.muted },
  // The heart sits in the row (not on a card corner): 40px plain button at the right.
  heart: { position: "relative", top: 0, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },
  skeleton: { backgroundColor: colors.paper, borderColor: colors.paper },
})
