import { officeFetch } from "@/lib/api-client"
import { ERROR_TEXT as MERCHANT_ERROR_TEXT } from "@/components/merchants/merchant-lib"

export { formatDateTime, formatDate, jsonBody } from "@/components/merchants/merchant-lib"

export const FINANCE_ERROR_TEXT: Record<string, string> = {
  ...MERCHANT_ERROR_TEXT,
  INSUFFICIENT_BALANCE: "The merchant's available balance no longer covers this payout.",
  BELOW_MINIMUM_PAYOUT: "This amount is below the minimum payout.",
  PAYOUT_METHOD_NOT_FOUND: "Payout method not found.",
  PAYOUT_METHOD_NOT_VERIFIED: "Verify the payout method before approving.",
  PAYOUT_CURRENCY_MISMATCH: "The payout method does not match the payout currency.",
  AMOUNT_INVALID: "The amount is invalid.",
  TOO_MANY_OPEN_PAYOUTS: "This merchant already has too many open payouts.",
  PAYOUT_FEE_INVALID: "The payout fee is invalid.",
  INVALID_TRANSITION: "This payout has already moved on. Refresh and check its status.",
  REFERENCE_REQUIRED: "Enter the bank or SBP reference.",
  PAYOUT_NOT_FOUND: "Payout not found.",
  INVALID_ACTION: "That action is not valid.",
  KIND_INVALID: "Rule kind is invalid.",
  SCOPE_INVALID: "Scope is invalid.",
  FEE_VALUE_REQUIRED: "Enter a percent, a fixed amount, or both.",
  SERVICE_LINE_REQUIRED: "Choose a service line.",
  CATEGORY_REQUIRED: "Choose a category.",
  MERCHANT_REQUIRED: "Choose a merchant.",
  CURRENCY_REQUIRED: "A fixed amount needs a currency.",
  FEE_RULE_INVALID: "The rule's values are inconsistent. Check scope, dates and amounts.",
  NAME_REQUIRED: "Enter a plan name (at least 2 characters).",
  PERCENT_INVALID: "Percent must be between 0 and 100.",
  FEE_INVALID: "Fee must be zero or more.",
  NAME_TAKEN: "A plan with that name already exists.",
  HOLD_DAYS_INVALID: "Hold days must be a whole number from 0 to 60.",
  MIN_PAYOUT_INVALID: "Minimum payouts must be zero or more.",
  UNAVAILABLE: "The service is unavailable. Try again shortly.",
}

export function financeError(code?: string | null): string {
  if (!code) return "Something went wrong. Try again."
  return FINANCE_ERROR_TEXT[code] || `Request failed (${code}).`
}

export type FApiResult<T> = { ok: true; data: T } | { ok: false; error: string; code: string | null }

export async function fapi<T = any>(path: string, init?: RequestInit): Promise<FApiResult<T>> {
  try {
    const res = await officeFetch(path, init)
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const code: string | null = body?.errorCode || (res.status === 403 ? "FORBIDDEN" : res.status === 401 ? "UNAUTHORIZED" : null)
      return { ok: false, error: financeError(code), code }
    }
    return { ok: true, data: body as T }
  } catch {
    return { ok: false, error: "Network error. Try again.", code: null }
  }
}

const norm = (role: string | null | undefined) => (!role || role === "admin" ? "ops" : role)
/** finance.manage: finance and super_admin. The API enforces; this only hides controls. */
/** fees.manage: super_admin only. */
export const canFees = (role: string | null | undefined) => norm(role) === "super_admin"

export function formatMoney(amount: number | string | null | undefined, currency?: string | null): string {
  if (amount === null || amount === undefined || amount === "") return "-"
  const n = Number(amount)
  if (!Number.isFinite(n)) return "-"
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", currencyDisplay: "code" }).format(n).replace(/ /g, " ")
  } catch {
    return `${n.toFixed(2)} ${currency || ""}`.trim()
  }
}

export interface PayoutRow {
  id: string
  merchant_id: string
  currency: string
  amount: number | string
  fee: number | string
  net: number | string
  status: "requested" | "approved" | "paid" | "rejected" | "cancelled"
  reference?: string | null
  reason?: string | null
  method_snapshot?: { kind?: string; label?: string; last4?: string; payout_method_id?: string; method_id?: string } | null
  requested_at: string
  decided_at?: string | null
  paid_at?: string | null
  merchants?: { display_name: string; country: string } | null
  /** Joined by the list route; an object or a one-item array depending on the relation shape. */
  merchant_payout_methods?: { verified: boolean | null } | { verified: boolean | null }[] | null
}

export interface PayoutMethod {
  id: string
  kind: string
  currency: string
  label: string | null
  last4: string | null
  verified: boolean
  is_default: boolean
}

export const SERVICE_LINES = [
  { value: "food", label: "Food" },
  { value: "mart", label: "Mart" },
  { value: "experts", label: "Experts" },
] as const

export const CATEGORIES: Record<string, string[]> = {
  food: ["Meals", "Snacks", "Drinks", "Other"],
  mart: ["Groceries", "Household", "Electronics", "Other"],
  experts: [],
}

export const CURRENCIES = ["RUB", "USD", "EUR", "KZT", "NGN", "GBP", "CNY", "BRL", "AED"]

export const METHOD_KIND_LABEL: Record<string, string> = { sbp: "SBP", bank: "Bank transfer", bank_account: "Bank transfer", card: "Card", crypto: "Crypto" }
export const kindLabel = (k?: string | null) => (k ? METHOD_KIND_LABEL[k] || k.replace(/_/g, " ") : "-")

export const FEE_NOT_RETROACTIVE = "Fees are snapshotted onto an order when the seller accepts it. Edits here never change orders already accepted."
