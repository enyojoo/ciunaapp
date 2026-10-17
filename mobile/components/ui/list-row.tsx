import { Children, Fragment, type ReactNode } from "react"
import { StyleSheet, useWindowDimensions, View } from "react-native"
import { AppText } from "@/components/ui/app-text"
import { Icon } from "@/components/ui/icon"
import { PressableScale } from "@/components/ui/pressable-scale"
import { colors, radius, space } from "@/lib/theme"

type WellTone = "neutral" | "primary" | "success" | "warning" | "danger" | "surface"

const WELL: Record<WellTone, string> = {
  neutral: colors.neutralSurface,
  primary: colors.primaryTint,
  success: colors.successSurface,
  warning: colors.warningSurface,
  danger: colors.dangerSurface,
  surface: colors.surface,
}

/** Rounded square behind a row icon. Pick the tone from meaning (success, warning), never decoration. */
export function IconWell({ children, tone = "neutral", size = 36 }: { children: ReactNode; tone?: WellTone; size?: number }) {
  return <View style={[styles.well, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: WELL[tone] }]}>{children}</View>
}

/**
 * One row in a list: optional leading (icon well or avatar), title with optional subtitle, optional value text,
 * optional trailing node, chevron when tappable. Put rows inside a `ListGroup`.
 */
export function ListRow({
  title,
  subtitle,
  value,
  leading,
  trailing,
  onPress,
  destructive,
  chevron,
  accessibilityLabel,
}: {
  title: string
  subtitle?: string
  /** Muted text before the chevron ("English", "Off"). */
  value?: string
  leading?: ReactNode
  trailing?: ReactNode
  onPress?: () => void
  destructive?: boolean
  /** Defaults to true when the row is tappable. */
  chevron?: boolean
  accessibilityLabel?: string
}) {
  const showChevron = chevron ?? Boolean(onPress)
  // At large text sizes the value and trailing badge drop under the title so the title keeps the full width.
  const stacked = useWindowDimensions().fontScale > STACK_AT_SCALE
  const aside = (
    <>
      {value ? (
        <AppText variant="meta" tone="muted" numberOfLines={stacked ? 2 : 1} style={stacked ? undefined : styles.value}>
          {value}
        </AppText>
      ) : null}
      {trailing}
    </>
  )
  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.text}>
        <AppText variant="body" tone={destructive ? "danger" : "default"} numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="meta" tone="muted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
        {stacked ? <View style={styles.asideStacked}>{aside}</View> : null}
      </View>
      {stacked ? null : aside}
      {showChevron ? <Icon name="chevronRight" size={16} color={colors.subtle} /> : null}
    </>
  )
  if (!onPress) return <View style={styles.row}>{content}</View>
  return (
    <PressableScale onPress={onPress} scaleTo={0.99} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} style={styles.row}>
      {content}
    </PressableScale>
  )
}

/**
 * Inset grouped list (iOS Settings style): a white rounded block on the paper canvas, no outer edge, hairline dividers
 * between rows inset past the icon column. Use it for data and settings; cards are only for tappable objects.
 */
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean)
  return (
    <View style={styles.groupWrap}>
      {title ? (
        <AppText variant="caption" tone="muted" style={styles.groupTitle} accessibilityRole="header">
          {title.toUpperCase()}
        </AppText>
      ) : null}
      <View style={styles.group}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={styles.divider} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  )
}

/** Font scale above which a row stacks its value and badge under the title. */
const STACK_AT_SCALE = 1.35

const styles = StyleSheet.create({
  asideStacked: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm, marginTop: space.xs },
  well: { alignItems: "center", justifyContent: "center" },
  row: { minHeight: space.tap + 8, flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  leading: { flexShrink: 0 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  value: { flexShrink: 0, maxWidth: "45%" },
  groupWrap: { marginBottom: space.xl },
  groupTitle: { marginBottom: space.sm, marginLeft: space.xs, letterSpacing: 0.6 },
  group: { backgroundColor: colors.surface, borderRadius: radius.card, overflow: "hidden" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: space.lg + 36 + space.md },
})
