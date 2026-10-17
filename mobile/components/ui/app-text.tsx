import { Text, type TextProps } from "react-native"
import { colors, numeric, textStyles, type TextVariant } from "@/lib/theme"

type Tone = "default" | "muted" | "subtle" | "primary" | "danger" | "success" | "warning" | "onPrimary" | "onSelected"

const TONE: Record<Tone, string> = {
  default: colors.text,
  muted: colors.muted,
  subtle: colors.subtle,
  primary: colors.primaryText,
  danger: colors.dangerText,
  success: colors.successText,
  warning: colors.warningText,
  onPrimary: colors.onPrimary,
  onSelected: colors.onSelected,
}

/** Largest text scale the layouts are designed for (200%). Beyond it the OS setting stops growing text. */
export const MAX_FONT_SCALE = 2

export type AppTextProps = TextProps & {
  variant?: TextVariant
  tone?: Tone
  /** Tabular figures for money and quantities. */
  numeric?: boolean
}

/**
 * Text with the shared type scale. Prefer this over a raw `Text` plus a local `fontSize`. React Native scales the
 * line height together with the font, so a fixed `lineHeight` is safe here; growth stops at 200%.
 */
export function AppText({ variant = "body", tone = "default", numeric: tabular, style, maxFontSizeMultiplier = MAX_FONT_SCALE, ...rest }: AppTextProps) {
  return <Text {...rest} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[textStyles[variant], { color: TONE[tone] }, tabular && numeric, style]} />
}
