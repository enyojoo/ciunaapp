import { type TextStyle } from "react-native"
import { AppText } from "@/components/ui/app-text"
import { formatCardPrice, formatMoney } from "@/lib/money"
import type { TextVariant } from "@/lib/theme"

const VARIANT: Record<"display" | "headline" | "body" | "small", TextVariant> = {
  display: "display",
  headline: "headline",
  body: "bodyStrong",
  small: "label",
}

/**
 * Money through one component. Symbol first, comma thousands, tabular figures, true minus. Lists drop `.00` on
 * whole amounts; breakdowns that add up pass `precise` to keep cents. Use `display` where the amount is the hero.
 */
export function Amount({
  value,
  currency,
  size = "body",
  precise,
  negative,
  tone = "default",
  style,
}: {
  value: number | null | undefined
  currency?: string | null
  size?: "display" | "headline" | "body" | "small"
  /** Keep cents on whole amounts (receipts, fee breakdowns, totals that must add up). */
  precise?: boolean
  /** Render as an outgoing amount with a true minus sign. */
  negative?: boolean
  tone?: "default" | "muted" | "success" | "danger" | "primary"
  style?: TextStyle
}) {
  const text = (precise ? formatMoney(value, currency) : formatCardPrice(value, currency)).replace(/^-/, "")
  const isNeg = negative || (typeof value === "number" && value < 0)
  return (
    <AppText variant={VARIANT[size]} tone={tone} numeric style={style} numberOfLines={1} adjustsFontSizeToFit={size === "display"} minimumFontScale={0.6}>
      {value != null && isNeg ? `−${text}` : text}
    </AppText>
  )
}
