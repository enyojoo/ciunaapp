import { StyleSheet } from "react-native"

/** Native canvas tokens. Web stays Geist + oklch(0.99); Expo uses paper + system type. */
export const colors = {
  primary: "#F97316",
  primaryHover: "#EA580C",
  primaryDeep: "#C2410C",
  paper: "#FAFAF8",
  surface: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E8E4DC",
  danger: "#DC2626",
  success: "#059669",
  refer: "#059669",
  referBg: "#F0FDFA",
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
