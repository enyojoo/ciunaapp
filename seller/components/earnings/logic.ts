export interface Balance { currency: string; pending: number; available: number; inPayout: number; paidOut: number; lifetimeNet: number }
export interface PayoutMethod { id: string; kind: string; currency: string; label: string; last4: string | null; verified: boolean; is_default: boolean }
export type AmountError = "AMOUNT_INVALID" | "BELOW_MINIMUM_PAYOUT" | "INSUFFICIENT_BALANCE"

/** Currencies with any money in them first by available, then alphabetical; empty list when nothing has ever moved. */
export function groupBalances(balances: Balance[] | undefined): Balance[] {
  return (balances ?? [])
    .filter((b) => b.pending || b.available || b.inPayout || b.paidOut || b.lifetimeNet)
    .slice()
    .sort((a, b) => b.available - a.available || a.currency.localeCompare(b.currency))
}

/** Accepts "1234.5", "1 234,50", "1,234.50". Returns null when it is not a positive amount with at most 2 decimals. */
export function parseAmount(raw: string): number | null {
  let s = raw.replace(/[\s ]/g, "")
  if (!s) return null
  const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".")
  if (lastComma > -1 && lastDot > -1) s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "")
  else if (lastComma > -1) s = /,\d{1,2}$/.test(s) && s.indexOf(",") === lastComma ? s.replace(",", ".") : s.replace(/,/g, "")
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const n = Number(s)
  return n > 0 ? n : null
}

export function validateAmount(raw: string, available: number, min: number): { amount: number | null; error: AmountError | null } {
  const amount = parseAmount(raw)
  if (amount === null) return { amount: null, error: "AMOUNT_INVALID" }
  if (amount < min) return { amount, error: "BELOW_MINIMUM_PAYOUT" }
  if (amount > available + 1e-9) return { amount, error: "INSUFFICIENT_BALANCE" }
  return { amount, error: null }
}

export function amountToInput(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "")
}

/** Methods the seller can withdraw to in this currency, default first; unverified ones are kept apart so the UI can explain them. */
export function methodsForCurrency(methods: PayoutMethod[] | undefined, currency: string) {
  const mine = (methods ?? []).filter((m) => m.currency === currency).sort((a, b) => Number(b.is_default) - Number(a.is_default))
  return { verified: mine.filter((m) => m.verified), unverified: mine.filter((m) => !m.verified) }
}

/** Trailing-edge debounce with cancel, used for the live fee preview. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const run = (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { timer = null; fn(...args) }, ms)
  }
  run.cancel = () => { if (timer) clearTimeout(timer); timer = null }
  return run
}

const pad = (n: number) => String(n).padStart(2, "0")
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** Current calendar month, local time, as YYYY-MM-DD strings. */
export function currentMonthRange(now: Date = new Date()) {
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) }
}
export function validRange(from: string, to: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to
}

export type MethodKind = "sbp" | "bank"
export const KIND_FIELDS: Record<MethodKind, { required: string[]; optional: string[]; currencies?: string[] }> = {
  sbp: { required: ["phone", "bank_name", "recipient_name"], optional: [], currencies: ["RUB"] },
  bank: { required: ["account_number", "bank_name", "recipient_name"], optional: ["bik", "swift", "iban", "country"] },
}

/** Mirrors the API's validateDetails so errors show before the request. Returns an error code and the field it belongs to. */
export function validateMethodForm(kind: MethodKind, currency: string, details: Record<string, string>): { code: string; field?: string } | null {
  const spec = KIND_FIELDS[kind]
  if (!spec) return { code: "KIND_INVALID" }
  if (!/^[A-Z]{3}$/.test(currency)) return { code: "CURRENCY_INVALID", field: "currency" }
  if (spec.currencies && !spec.currencies.includes(currency)) return { code: "CURRENCY_NOT_SUPPORTED", field: "currency" }
  for (const f of spec.required) if (!String(details[f] ?? "").trim()) return { code: "FIELD_REQUIRED", field: f }
  if (kind === "sbp" && !/^\+?\d{10,15}$/.test(details.phone.trim().replace(/[\s()-]/g, ""))) return { code: "PHONE_INVALID", field: "phone" }
  return null
}

export type StatementTab = "all" | "pending" | "available" | "reversed"
export const statementStatusParam = (tab: StatementTab) => (tab === "all" ? "" : `&status=${tab}`)
