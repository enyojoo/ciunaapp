/**
 * Ciuna money format (design-system/README.md, "Money has one format"):
 * symbol first, comma thousands, dot decimals, true minus, no `.00` on whole amounts unless `breakdown`.
 * Currencies without a minor unit never show decimals. XOF/XAF render as `CFA 250,000`.
 */
const SYMBOLS: Record<string, string> = {
  USD: "$", CAD: "$", EUR: "€", GBP: "£", RUB: "₽", NGN: "₦", GHS: "₵", KES: "KSh", RWF: "R₣", ZAR: "R",
  CNY: "¥", JPY: "¥", BRL: "R$", MXN: "$", ARS: "$", COP: "$", CLP: "$", INR: "₹", TRY: "₺", UAH: "₴",
  KZT: "₸", UZS: "soʻm ", EGP: "E£", MAD: "MAD ", TZS: "TSh", UGX: "USh", XOF: "CFA ", XAF: "CFA ",
}

const NO_MINOR = new Set(["XOF", "XAF", "RWF", "UGX", "JPY", "CLP", "KRW", "VND"])

export function currencySymbol(code: string | null | undefined): string {
  const c = String(code || "").trim().toUpperCase()
  if (!c) return ""
  return SYMBOLS[c] ?? `${c} `
}

export interface FormatMoneyOptions {
  /** Show cents even when whole (review rows, receipts, statements, anything that must add up). */
  breakdown?: boolean
  /** Prefix `+` for money in. */
  signed?: boolean
}

export function formatMoneyDisplay(amount: number | string | null | undefined, currency: string | null | undefined, opts: FormatMoneyOptions = {}): string {
  if (amount === null || amount === undefined || amount === "") return "—"
  const n = Number(amount)
  if (!Number.isFinite(n)) return "—"
  const code = String(currency || "").trim().toUpperCase()
  const noMinor = NO_MINOR.has(code)
  const rounded = noMinor ? Math.round(n) : Math.round((n + Number.EPSILON) * 100) / 100
  const abs = Math.abs(rounded)
  const whole = Number.isInteger(abs)
  const digits = noMinor ? 0 : whole && !opts.breakdown ? 0 : 2
  const body = abs.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const sign = rounded < 0 ? "−" : opts.signed && rounded > 0 ? "+" : ""
  return `${sign}${currencySymbol(code)}${body}`
}
