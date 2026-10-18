import { type ReactNode } from "react"
import { Platform, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AppText } from "@/components/ui/app-text"
import { Icon } from "@/components/ui/icon"
import { IconButton } from "@/components/ui/icon-button"
import { PressableScale } from "@/components/ui/pressable-scale"
import { colors, space, type as typeSize } from "@/lib/theme"

/**
 * One action in a nav bar (cart, heart, share, search). Every action is the same 44 pt slot with a 22 pt ink glyph,
 * so a screen's actions line up with every other screen's. Put the cart last: it then sits in the same place
 * everywhere. `dot` shows a small orange dot on the glyph ("there is something in here", e.g. a cart with items);
 * `badge` shows a count (9+ above nine).
 */
export function NavAction({
  label,
  onPress,
  children,
  badge,
  dot,
  selected,
}: {
  label: string
  onPress?: () => void
  children: ReactNode
  badge?: number
  dot?: boolean
  selected?: boolean
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptics
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected == null ? undefined : { selected }}
      hitSlop={4}
      style={styles.action}
    >
      {children}
      {dot ? <View style={styles.dot} /> : null}
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <AppText variant="caption" tone="onPrimary" style={styles.badgeText} maxFontSizeMultiplier={1.2}>
            {badge > 9 ? "9+" : String(badge)}
          </AppText>
        </View>
      ) : null}
    </PressableScale>
  )
}

/** Size of the glyph inside a `NavAction`. */
export const NAV_ICON = 22

/** Bar height under the status bar, as on a native navigation bar. */
export const NAV_BAR_HEIGHT = 44

const ios = Platform.OS === "ios"

/**
 * Top bar for screens that draw their own header (store, product, expert, checkout). It matches the native stack
 * header: 44 pt, plain back chevron, title centred on iOS and left-aligned on Android, actions on the right, no
 * hairline unless the content has scrolled under it.
 *
 * `overlay` floats the bar over a photo: transparent, with the back and actions on white discs. Render it inside an
 * absolutely positioned parent (or pass `floating`) so the photo runs under the status bar.
 */
export function NavBar({
  title,
  onBack,
  backLabel = "Back",
  trailing,
  variant = "default",
  hairline,
  floating,
  safeTop = true,
}: {
  title?: string
  onBack?: () => void
  backLabel?: string
  trailing?: ReactNode
  variant?: "default" | "overlay"
  /** Show the bottom hairline (set it once the content scrolls under the bar). */
  hairline?: boolean
  /** Position the bar absolutely over the content (photo headers). */
  floating?: boolean
  /** Pad for the status bar. Off only when the bar is not at the top of the screen (previews). */
  safeTop?: boolean
}) {
  const insets = useSafeAreaInsets()
  const overlay = variant === "overlay"
  const back = onBack ? (
    overlay ? (
      <IconButton label={backLabel} onPress={onBack} tone="overlay" size={36}>
        <Icon name="back" size={ios ? 17 : 20} color={colors.text} strokeWidth={2.4} />
      </IconButton>
    ) : (
      <PressableScale onPress={onBack} scaleTo={0.9} accessibilityRole="button" accessibilityLabel={backLabel} hitSlop={8} style={styles.back}>
        <Icon name="back" size={ios ? 22 : 24} color={colors.text} strokeWidth={2.2} />
      </PressableScale>
    )
  ) : null

  return (
    <View
      style={[
        { paddingTop: safeTop ? insets.top : 0 },
        overlay ? styles.clear : styles.solid,
        hairline && !overlay && styles.hairline,
        floating && styles.floating,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} pointerEvents="box-none">
        {title && ios ? (
          <View style={styles.centerTitle} pointerEvents="none">
            <AppText variant="headline" numberOfLines={1} accessibilityRole="header">
              {title}
            </AppText>
          </View>
        ) : null}
        <View style={styles.side}>{back}</View>
        {title && !ios ? (
          <AppText variant="headline" numberOfLines={1} accessibilityRole="header" style={styles.leftTitle}>
            {title}
          </AppText>
        ) : (
          <View style={styles.spacer} />
        )}
        {trailing ? <View style={[styles.side, styles.trailing]}>{trailing}</View> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  solid: { backgroundColor: colors.paper },
  clear: { backgroundColor: "transparent" },
  hairline: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  floating: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 },
  bar: { height: NAV_BAR_HEIGHT, flexDirection: "row", alignItems: "center", paddingHorizontal: space.sm },
  side: { minWidth: 44, flexDirection: "row", alignItems: "center" },
  trailing: { justifyContent: "flex-end", flexShrink: 1 },
  action: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  // A 10 pt dot (plus a 2 pt ring in the page colour) centred on the glyph's top-right corner.
  dot: { position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.paper },
  // Sits on the icon's top-right corner (icon is 22 pt centred in the 44 pt slot) so it never hides the glyph.
  badge: { position: "absolute", top: 0, right: -2, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.paper },
  badgeText: { fontSize: typeSize.caption, lineHeight: 12 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  spacer: { flex: 1 },
  leftTitle: { flex: 1, marginLeft: space.xs },
  centerTitle: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 96 },
})
