import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

function key() {
  const raw = process.env.MERCHANT_PAYOUT_KEY || process.env.MARKETPLACE_TOKEN_KEY || ""
  const k = Buffer.from(raw, "base64")
  if (k.length !== 32) throw new Error("PAYOUT_ENCRYPTION_UNAVAILABLE")
  return k
}

/** AES-256-GCM, bound to the merchant so a ciphertext cannot be replayed under another merchant. */
export function encryptDetails(details: Record<string, string>, merchantId: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", key(), iv)
  c.setAAD(Buffer.from(merchantId))
  const out = Buffer.concat([c.update(JSON.stringify(details), "utf8"), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), out]).toString("base64")
}

export function decryptDetails(value: string, merchantId: string): Record<string, string> {
  const b = Buffer.from(value, "base64")
  const d = createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12))
  d.setAAD(Buffer.from(merchantId))
  d.setAuthTag(b.subarray(12, 28))
  return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8"))
}

/** What each payout kind needs. Card numbers are deliberately not accepted (card data is out of scope). */
export const PAYOUT_KINDS: Record<string, { fields: string[]; currencies?: string[] }> = {
  sbp: { fields: ["phone", "bank_name", "recipient_name"], currencies: ["RUB"] },
  bank: { fields: ["account_number", "bank_name", "recipient_name"] },
  ciuna_send: { fields: ["recipient_id"] },
}

export function validateDetails(kind: string, currency: string, details: Record<string, unknown>): Record<string, string> | string {
  const spec = PAYOUT_KINDS[kind]
  if (!spec) return "KIND_INVALID"
  if (spec.currencies && !spec.currencies.includes(currency)) return "CURRENCY_NOT_SUPPORTED"
  const out: Record<string, string> = {}
  for (const f of spec.fields) {
    const v = String(details?.[f] ?? "").trim().slice(0, 120)
    if (!v) return `FIELD_REQUIRED:${f}`
    out[f] = v
  }
  for (const opt of ["bik", "swift", "iban", "country", "notes"]) {
    const v = String(details?.[opt] ?? "").trim().slice(0, 120)
    if (v) out[opt] = v
  }
  if (kind === "sbp" && !/^\+?\d{10,15}$/.test(out.phone.replace(/[\s()-]/g, ""))) return "PHONE_INVALID"
  return out
}

export function lastFour(kind: string, details: Record<string, string>): string | null {
  const src = kind === "sbp" ? details.phone : kind === "bank" ? details.account_number : null
  return src ? src.replace(/\D/g, "").slice(-4) || null : null
}
