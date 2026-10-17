import { formatCardPrice as formatMoney } from "@/lib/money"

type T = (key: string, opts?: Record<string, unknown>) => string
type Body = { errorCode?: string; details?: Record<string, number | string | undefined> } | null | undefined

/** A readable message for a limit error from Send (what is left, the most or the least), or null for any other error. */
export function limitMessage(body: Body, t: T, locale: string): string | null {
  const d = body?.details || {}
  const cur = String(d.currency || "")
  switch (body?.errorCode) {
    case "LIMIT_EXCEEDED":
      return t("limits.err_LIMIT_EXCEEDED", {
        remaining: formatMoney(Number(d.remaining) || 0, cur),
        date: d.resetsAt ? new Date(String(d.resetsAt)).toLocaleDateString(locale, { dateStyle: "medium" }) : "",
      })
    case "ABOVE_MAX_TRANSFER":
      return t("limits.err_ABOVE_MAX_TRANSFER", { max: formatMoney(Number(d.max) || 0, cur) })
    case "BELOW_MIN_TRANSFER":
      return t("limits.err_BELOW_MIN_TRANSFER", { min: formatMoney(Number(d.min) || 0, cur) })
    default:
      return null
  }
}
