import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native"
import { Heart } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { useFavourites, type FavouriteType } from "@/lib/favourites"
import { colors, shadow } from "@/lib/theme"

/**
 * Heart toggle for a product, store or expert. Filled orange = saved, outline = not saved, so the
 * state never relies on colour alone. Render it as a sibling of the card's Pressable (never inside it).
 */
export function FavouriteHeart({
  type,
  id,
  style,
}: {
  type: FavouriteType
  id: string
  style?: StyleProp<ViewStyle>
}) {
  const { t } = useTranslation("app")
  const { isFav, toggle, unavailable } = useFavourites()
  if (unavailable) return null
  const on = isFav(type, id)
  const label = on
    ? t("favourites.removeAria", { defaultValue: "Remove from favourites" })
    : t("favourites.addAria", { defaultValue: "Add to favourites" })
  return (
    <Pressable
      onPress={() => void toggle(type, id)}
      hitSlop={7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={[styles.chip, style]}
    >
      <Heart
        size={18}
        strokeWidth={2.2}
        color={on ? colors.primaryText : colors.muted}
        fill={on ? colors.primaryText : "transparent"}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    ...shadow({ opacity: 0.12, radius: 4, offsetY: 1, elevation: 2 }),
  },
})
