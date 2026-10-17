import { MerchantError } from "@/lib/merchant/errors"

/**
 * Customer receipts, built from a transfer or a marketplace order. Pure functions so the privacy rules are testable:
 * the recipient account is masked to its last four digits, no payment provider is ever named, and only paid or
 * completed items have a receipt (a refunded one keeps it, marked refunded).
 */
export type Receipt = {
  kind: "transfer" | "order" | "booking"
  number: string
  issuedAt: string
  status: "completed" | "paid" | "refunded"
  customer: { name: string | null }
  counterparty: { role: "recipient" | "store" | "expert"; name: string | null; account: string | null }
  payMethod: "online" | "bank" | null
  lines: { title: string; quantity: number; unitPrice: number; amount: number }[]
  amounts: { currency: string; items: number; fee: number; delivery: number; conversion: number; total: number; refunded: number | null }
  transfer: { sendAmount: number; sendCurrency: string; receiveAmount: number; receiveCurrency: string; rate: number } | null
  session: { start: string; end: string | null; timezone: string | null } | null
  address: string | null
  notTaxInvoice: true
}

const num = (v: unknown) => (v == null || v === "" ? 0 : Number(v) || 0)
const round2 = (n: number) => Math.round(n * 100) / 100

/** "1234567890" becomes "···· 7890". Anything shorter than four characters is hidden entirely. */
export function maskAccount(account: unknown): string | null {
  const digits = String(account ?? "").replace(/\s+/g, "")
  if (!digits) return null
  return digits.length < 4 ? "····" : `···· ${digits.slice(-4)}`
}

/** Payment rails become plain method names: nothing here may name a provider. */
export function payMethodFor(rail: unknown): "online" | "bank" | null {
  if (rail === "manual") return "bank"
  if (rail === "yookassa" || rail === "bitbanker") return "online"
  return null
}

const fullName = (u: any) => [u?.first_name, u?.last_name].filter(Boolean).join(" ") || null

export function buildTransferReceipt(tx: any): Receipt {
  const status = String(tx?.status || "")
  const refunded = status === "refunded"
  if (!["completed", "deposited", "refunded"].includes(status)) throw new MerchantError("RECEIPT_UNAVAILABLE", 409)
  const total = round2(num(tx.total_amount) || num(tx.send_amount) + num(tx.fee_amount))
  return {
    kind: "transfer",
    number: String(tx.transaction_id),
    issuedAt: String(tx.completed_at || tx.created_at),
    status: refunded ? "refunded" : "completed",
    customer: { name: fullName(tx.user) },
    counterparty: { role: "recipient", name: tx.recipient?.full_name ?? null, account: maskAccount(tx.recipient?.account_number) },
    payMethod: payMethodFor(tx.payment_provider),
    lines: [],
    amounts: { currency: String(tx.send_currency || ""), items: round2(num(tx.send_amount)), fee: round2(num(tx.fee_amount)), delivery: 0, conversion: 0, total, refunded: refunded ? total : null },
    transfer: { sendAmount: num(tx.send_amount), sendCurrency: String(tx.send_currency || ""), receiveAmount: num(tx.receive_amount), receiveCurrency: String(tx.receive_currency || ""), rate: num(tx.exchange_rate) },
    session: null,
    address: null,
    notTaxInvoice: true,
  }
}

export function buildOrderReceipt(order: any, userName: string | null, attemptRail?: unknown): Receipt {
  const pay = String(order?.payment_state || "")
  if (!["paid", "refund_pending", "refunded"].includes(pay)) throw new MerchantError("RECEIPT_UNAVAILABLE", 409)
  const snap = order.snapshot || {}
  const t = snap.totals || {}
  const refunded = pay === "refunded"
  const booking = order.line === "experts"
  const total = round2(num(t.total))
  const lines = (Array.isArray(snap.lines) ? snap.lines : []).map((l: any) => ({
    title: String(l.title || ""),
    quantity: num(l.quantity) || 1,
    unitPrice: num(l.unitPrice),
    amount: round2(num(l.unitPrice) * (num(l.quantity) || 1)),
  }))
  return {
    kind: booking ? "booking" : "order",
    number: String(order.public_id),
    issuedAt: String(order.created_at),
    status: refunded ? "refunded" : "paid",
    customer: { name: userName },
    counterparty: { role: booking ? "expert" : "store", name: snap.title ? String(snap.title).split(" · ")[0] : null, account: null },
    payMethod: payMethodFor(attemptRail),
    lines,
    amounts: {
      currency: String(t.payCurrency || t.productCurrency || ""),
      items: round2(num(t.subtotal)),
      fee: round2(num(t.marketplaceFee)),
      delivery: round2(num(t.deliveryFee)),
      conversion: round2(num(t.corridorFee)),
      total,
      refunded: refunded ? total : null,
    },
    transfer: null,
    session: booking && snap.slotStart ? { start: String(snap.slotStart), end: snap.slotEnd ? String(snap.slotEnd) : null, timezone: snap.timezone ? String(snap.timezone) : null } : null,
    address: order.fulfillment_mode === "delivery" ? (snap.deliveryAddressLine ?? null) : null,
    notTaxInvoice: true,
  }
}
