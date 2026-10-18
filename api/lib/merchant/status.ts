export type MerchantStatus = "draft" | "in_review" | "live" | "paused" | "rejected" | "suspended"

/** Transitions a merchant can make itself. Office decisions (approve, reject, suspend) are in lib/merchant/review.ts. */
export const SELF_TRANSITIONS: Record<string, MerchantStatus[]> = {
  draft: ["in_review"],
  rejected: ["in_review"],
  live: ["paused"],
  paused: ["live"],
}

export function canSelfTransition(from: string, to: string): boolean {
  return (SELF_TRANSITIONS[from] || []).includes(to as MerchantStatus)
}

/** A merchant can sell only when live. */
export const isSelling = (status: string) => status === "live"

/** Fields a seller may edit directly on `merchants`. */
export const MERCHANT_EDITABLE_FIELDS = [
  "display_name",
  "legal_name",
  "country",
  "operating_country",
  "languages",
  "default_language",
  "default_currency",
  "logo_url",
  "cover_url",
  "description",
  "contact_email",
  "contact_phone",
  "website",
  "time_zone",
  "communities",
] as const

export const SUPPORTED_LANGUAGES = ["en", "ru", "fr", "es", "zh", "pt"] as const
export const SUPPORTED_CURRENCIES = ["RUB", "USD", "EUR", "CNY", "NGN", "GHS", "KES", "BRL"] as const
