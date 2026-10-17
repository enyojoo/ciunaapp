import { Platform, StyleSheet, type TextStyle, type ViewStyle } from "react-native"
import { designColors, designRadius, designSpace, designType } from "@ciuna/shared/design"

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace("#", "")
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const r = Number.parseInt(n.slice(0, 2), 16)
  const g = Number.parseInt(n.slice(2, 4), 16)
  const b = Number.parseInt(n.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/** Native `shadow*` / `elevation`; web `boxShadow` (RN Web deprecates `shadow*`). */
export function shadow(opts: {
  color?: string
  opacity: number
  radius: number
  offsetY: number
  offsetX?: number
  elevation: number
}): ViewStyle {
  const color = opts.color ?? "#0F172A"
  const offsetX = opts.offsetX ?? 0
  if (Platform.OS === "web") {
    return {
      boxShadow: `${offsetX}px ${opts.offsetY}px ${opts.radius}px ${hexToRgba(color, opts.opacity)}`,
    } as ViewStyle
  }
  return {
    shadowColor: color,
    shadowOpacity: opts.opacity,
    shadowRadius: opts.radius,
    shadowOffset: { width: offsetX, height: opts.offsetY },
    elevation: opts.elevation,
  }
}

export const shadowNone: ViewStyle =
  Platform.OS === "web" ? ({ boxShadow: "none" } as ViewStyle) : { shadowOpacity: 0, elevation: 0 }

/** Native canvas tokens. Web stays Geist + oklch(0.99); Expo uses paper + system type. */
export const colors = {
  /** Fill for controls (burnt orange, white label 4.56:1). The logo orange is `brand`. */
  primary: designColors.primary,
  brand: designColors.brandPrimary,
  /** Label colour on any primary fill: white. */
  onPrimary: designColors.primaryForeground,
  primaryHover: designColors.primaryHover,
  /** Orange as text/link on paper or white (5.2:1). */
  primaryText: designColors.primaryText,
  primaryDeep: designColors.primaryText,
  primaryTint: designColors.primaryTint,
  primaryBorder: designColors.primaryBorder,
  /** Fill for the selected chip, segment or filter (ink). Orange is kept for the one primary action. */
  selected: designColors.selected,
  onSelected: designColors.onSelected,
  paper: designColors.paper,
  surface: designColors.surface,
  text: designColors.ink,
  muted: designColors.muted,
  subtle: designColors.subtle,
  border: designColors.hairline,
  inputEdge: designColors.inputEdge,
  danger: designColors.destructive,
  dangerText: designColors.destructiveText,
  dangerSurface: designColors.destructiveSurface,
  success: designColors.success,
  successText: designColors.successText,
  successSurface: designColors.successSurface,
  warning: designColors.warning,
  warningText: designColors.warningText,
  warningSurface: designColors.warningSurface,
  neutralText: designColors.neutralText,
  neutralSurface: designColors.neutralSurface,
  refer: designColors.refer,
  referBg: designColors.referSurface,
  cardEdge: designColors.cardEdge,
  starEmpty: designColors.starEmpty,
  scrim: designColors.scrim,
  dangerBorder: "#FECACA",
  warningBorder: "#FDE68A",
  successBorder: "#A7F3D0",
  referBgEnd: "#ECFDF5",
  referBorder: "#99F6E4",
  referText: "#134E4A",
  referIcon: "#115E59",
  /** Image placeholders, skeleton tracks, pressed rows. */
  fill: designColors.fill,
  supportBg: "#F3F4F6",
  supportIcon: "#4B5563",
  heroOrange: "#EA580C",
  heroOrangeMid: "#F97316",
  heroAmber: "#FBBF24",
  heroBody: "#FFF7ED",
} as const

export const radius = {
  /** Inputs, buttons, chips with a box. */
  control: 12,
  card: 16,
  row: 12,
  /** Bottom sheets and dialogs. */
  sheet: 24,
  pill: 999,
  /** Hero media (store cover, gallery, banners). */
  hero: designRadius.hero,
} as const

export const type = {
  /** Root-screen large title (Activities, Account). */
  largeTitle: designType.largeTitle,
  /** Money and hero numerals (amounts on Send, totals). */
  display: designType.display,
  title: designType.title,
  /** Section titles and sheet titles. */
  headline: designType.headline,
  /** Title line of a list row or object card. */
  listTitle: designType.listTitle,
  body: designType.body,
  label: designType.label,
  meta: designType.meta,
  /** Smallest text anywhere: 12px. Badges and timestamps only. */
  caption: designType.caption,
} as const

export const space = {
  page: designSpace.page,
  /** Phone page gutter for redesigned screens. */
  gutter: designSpace.gutter,
  tap: designSpace.tap,
  xs: designSpace.xs,
  sm: designSpace.sm,
  md: designSpace.md,
  lg: designSpace.lg,
  xl: designSpace.xl,
  xxl: designSpace.xxl,
} as const

export const motion = {
  fastMs: 150,
  sheetMs: 180,
  normalMs: 220,
  /** Scale a pressable settles to while held. */
  pressScale: 0.97,
} as const

/** Shadow presets from tokens.json (native-card, native-face, native-heart, native-cart-bar). */
export const shadows = {
  card: shadow({ opacity: 0.08, radius: 10, offsetY: 4, elevation: 3 }),
  face: shadow({ opacity: 0.06, radius: 8, offsetY: 2, elevation: 2 }),
  heart: shadow({ opacity: 0.12, radius: 4, offsetY: 1, elevation: 2 }),
  cartBar: shadow({ opacity: 0.3, radius: 16, offsetY: 6, elevation: 8 }),
} as const

/** Three elevation levels only: flat (hairline edge), raised (cards), floating (cart bar, sheets). */
export const elevation = {
  flat: shadowNone,
  raised: shadows.card,
  floating: shadows.cartBar,
} as const

type TextStyleSpec = { fontSize: number; lineHeight: number; fontWeight: "400" | "500" | "600" | "700"; letterSpacing?: number }

/** Text styles. Money and quantities add `numeric` for tabular figures. */
export const textStyles = {
  largeTitle: { fontSize: type.largeTitle, lineHeight: 38, fontWeight: "700", letterSpacing: -0.6 },
  display: { fontSize: type.display, lineHeight: 52, fontWeight: "700", letterSpacing: -1.2 },
  title: { fontSize: type.title, lineHeight: 30, fontWeight: "700", letterSpacing: -0.4 },
  headline: { fontSize: type.headline, lineHeight: 26, fontWeight: "600", letterSpacing: -0.2 },
  listTitle: { fontSize: type.listTitle, lineHeight: 21, fontWeight: "600" },
  body: { fontSize: type.body, lineHeight: 22, fontWeight: "400" },
  bodyStrong: { fontSize: type.body, lineHeight: 22, fontWeight: "600" },
  label: { fontSize: type.label, lineHeight: 20, fontWeight: "600" },
  meta: { fontSize: type.meta, lineHeight: 18, fontWeight: "400" },
  caption: { fontSize: type.caption, lineHeight: 16, fontWeight: "600", letterSpacing: 0.2 },
} as const satisfies Record<string, TextStyleSpec>

export type TextVariant = keyof typeof textStyles

export const numeric: TextStyle = { fontVariant: ["tabular-nums"] }

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  page: { paddingHorizontal: space.page, paddingBottom: 40 },
  title: { fontSize: type.title, fontWeight: "700", color: colors.text, letterSpacing: -0.4 },
  subtitle: { marginTop: 8, fontSize: type.body, lineHeight: 22, color: colors.muted },
  linkLeft: { fontSize: type.meta, fontWeight: "500", color: colors.primary },
  body: { fontSize: type.body, color: colors.text },
  meta: { fontSize: type.meta, color: colors.muted },
  label: { fontSize: type.meta, fontWeight: "600", color: colors.text, marginBottom: 8 },
  error: { marginBottom: 12, fontSize: type.meta, color: colors.danger },
  link: { fontSize: type.body, fontWeight: "600", color: colors.primary, textAlign: "center" },
  linkMuted: { fontSize: type.body, color: colors.muted, textAlign: "center" },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.card,
  },
})
