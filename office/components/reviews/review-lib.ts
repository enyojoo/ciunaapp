export interface OfficeReview {
  id: string
  merchant_id: string
  target_type: "vendor" | "expert"
  rating: number
  body: string
  language: string | null
  status: "published" | "hidden"
  hidden_reason: string | null
  reply: string | null
  has_reply: boolean
  created_at: string
  customer: string | null
  merchant: { name: string; type: string; slug: string } | null
}

export const HIDE_REASONS = ["Contains personal data.", "Not about this purchase.", "Abusive language."]

export function excerpt(text: string, max = 90): string {
  const t = text.replace(/\s+/g, " ").trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

export function starsText(n: number): string {
  return `${n} out of 5`
}
