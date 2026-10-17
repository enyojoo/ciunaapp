import { type ReactNode } from "react"
import { StyleSheet, View } from "react-native"
import { AppText } from "@/components/ui/app-text"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, elevation, space } from "@/lib/theme"

/**
 * Bottom bar that keeps the one action on screen: Add to cart, Checkout, Pay. Sits above the home indicator,
 * with a hairline and a soft shadow. Put one `Button` (and optionally a line of summary text) inside it.
 * Give the scroll content `paddingBottom` of about 96 so the last row clears the bar. When the action is disabled,
 * pass `hint` with the reason ("Pick a time") so the user knows what unlocks it.
 */
export function StickyActionBar({
  children,
  tabBar,
  hint,
}: {
  children: ReactNode
  /** Set when the bar sits above a tab bar that already owns the bottom inset. */
  tabBar?: boolean
  /** One muted line above the action: why it is disabled, or what happens next. */
  hint?: string | null
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.bar, { paddingBottom: tabBar ? space.md : Math.max(insets.bottom, space.md) }]}>
      <View style={styles.inner}>
        {hint ? (
          <AppText variant="meta" tone="muted" style={styles.hint} accessibilityLiveRegion="polite">
            {hint}
          </AppText>
        ) : null}
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space.md,
    paddingHorizontal: space.gutter,
    ...elevation.floating,
    shadowOpacity: 0.08,
  },
  inner: { gap: space.sm },
  hint: { textAlign: "center" },
})
