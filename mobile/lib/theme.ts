import { Platform, StyleSheet, type ViewStyle } from "react-native"
import { designColors } from "@ciuna/shared/design"

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
  primary: designColors.brandPrimary,
  /** Label colour on any orange fill. Never white on orange (2.8:1). */
  onPrimary: designColors.primaryForeground,
  primaryHover: designColors.primaryHover,
  /** Orange as text/link on paper or white (5.2:1). */
  primaryText: designColors.primaryText,
  primaryDeep: designColors.primaryText,
  primaryTint: designColors.primaryTint,
  primaryBorder: designColors.primaryBorder,
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
  referBgEnd: "#ECFDF5",
  referBorder: "#99F6E4",
  referText: "#134E4A",
  referIcon: "#115E59",
  supportBg: "#F3F4F6",
  supportIcon: "#4B5563",
  heroOrange: "#EA580C",
  heroOrangeMid: "#F97316",
  heroAmber: "#FBBF24",
  heroBody: "#FFF7ED",
} as const

export const radius = {
  card: 16,
  row: 12,
  pill: 999,
} as const

export const type = {
  title: 24,
  body: 16,
  label: 15,
  meta: 13,
} as const

export const space = {
  page: 20,
  tap: 48,
} as const

export const motion = {
  sheetMs: 180,
} as const

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
