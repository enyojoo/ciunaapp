import { createServerClient } from "@/lib/supabase"
import { generateTransactionId } from "@/lib/transaction-id"
import { roundMoney } from "@/utils/currency"
import { computeHubFeeFromReceive } from "@/lib/hub-fee"
import { hubPayMatchesProductCurrency, hubSyntheticSameCurrencyRateRow } from "@/lib/hub-same-currency-rate"
import type { HubTransactionSnapshot, HubProductRow } from "@/lib/hub-types"
import type { ExchangeRate } from "@/types"
import { hubProductEffectivePrice } from "@/lib/hub-product-price"

const HUB_IDEMPOTENCY_PREFIX = "HUB:"

function parseFormSchema(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  return []
}

function computeCorridorFee(sendAmount: number, rateRow: ExchangeRate): { fee: number; feeType: string } {
  if (rateRow.fee_type === "free") return { fee: 0, feeType: "free" }
  if (rateRow.fee_type === "fixed") return { fee: Number(rateRow.fee_amount) || 0, feeType: "fixed" }
  if (rateRow.fee_type === "percentage") {
    return { fee: (sendAmount * (Number(rateRow.fee_amount) || 0)) / 100, feeType: "percentage" }
  }
  return { fee: 0, feeType: "free" }
}

export interface HubCheckoutPayload {
  hubProductId: string
  sendCurrency: string
  receiveCurrency: string
  /** Funded amount in `receiveCurrency` (required when product is `user_input`). */
  fundedAmount?: number
  contactName: string
  contactPhone: string
  deliveryAddressLine?: string | null
  deliveryAddressId?: string | null
  formAnswers?: Record<string, unknown>
  idempotencyKey?: string
}

export async function createHubCheckoutTransaction(
  userId: string,
  payload: HubCheckoutPayload,
): Promise<{ transaction: Record<string, unknown>; duplicate?: boolean }> {
  const server = createServerClient()
  const {
    hubProductId,
    sendCurrency,
    receiveCurrency,
    fundedAmount: fundedInput,
    contactName,
    contactPhone,
    deliveryAddressLine,
    deliveryAddressId,
    formAnswers = {},
    idempotencyKey,
  } = payload

  if (idempotencyKey?.trim()) {
    const ref = `${HUB_IDEMPOTENCY_PREFIX}${idempotencyKey.trim()}`
    const { data: existing } = await server
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("reference", ref)
      .maybeSingle()
    if (existing?.transaction_id) {
      return { transaction: existing as Record<string, unknown>, duplicate: true }
    }
  }

  const { data: product, error: pErr } = await server
    .from("hub_products")
    .select("*")
    .eq("id", hubProductId)
    .single()

  if (pErr || !product) {
    throw new Error("Hub product not found")
  }
  if (product.status !== "live") {
    throw new Error("Product is not available for purchase")
  }
  if (product.fulfillment_type === "in_person" && !deliveryAddressLine?.trim()) {
    throw new Error("Delivery address required for in-person fulfillment")
  }
  if (product.fulfillment_type === "vendor" && !(product.vendor_id != null && String(product.vendor_id).trim())) {
    throw new Error("Vendor fulfillment requires a linked vendor")
  }

  let fundedAmount: number
  if (product.pricing_type === "fixed") {
    fundedAmount = hubProductEffectivePrice(product as HubProductRow)
    if (fundedAmount <= 0) throw new Error("Invalid product price")
  } else {
    fundedAmount = Number(fundedInput) || 0
    if (fundedAmount <= 0) throw new Error("Amount required")
    const min = product.funded_min != null ? Number(product.funded_min) : null
    const max = product.funded_max != null ? Number(product.funded_max) : null
    if (min != null && fundedAmount < min) throw new Error(`Minimum amount is ${min}`)
    if (max != null && fundedAmount > max) throw new Error(`Maximum amount is ${max}`)
  }

  const receiveCurrencyResolved =
    product.pricing_type === "fixed"
      ? String(product.fixed_currency || receiveCurrency)
      : String(product.default_input_currency || receiveCurrency)

  const payInProductCurrency = hubPayMatchesProductCurrency(sendCurrency, receiveCurrencyResolved)

  let rateRow: ExchangeRate
  if (payInProductCurrency) {
    rateRow = hubSyntheticSameCurrencyRateRow(sendCurrency, receiveCurrencyResolved)
  } else {
    const { data: row, error: rErr } = await server
      .from("exchange_rates")
      .select("*")
      .eq("from_currency", sendCurrency)
      .eq("to_currency", receiveCurrencyResolved)
      .eq("status", "active")
      .single()

    if (rErr || !row) {
      throw new Error("Exchange rate not available for selected currencies")
    }
    rateRow = row as ExchangeRate
  }

  const rate = Number(rateRow.rate) || 0
  if (rate <= 0) throw new Error("Invalid exchange rate")

  const requiredSend = fundedAmount / rate
  const corridor = computeCorridorFee(requiredSend, rateRow)
  const feePercent = product.fee_percent != null ? Number(product.fee_percent) : 0
  const hubFee = computeHubFeeFromReceive(fundedAmount, rateRow, feePercent)
  const sendAmount = roundMoney(requiredSend)
  const feeAmount = roundMoney(corridor.fee)
  const hubFeeAmount = roundMoney(hubFee)
  const totalAmount = roundMoney(sendAmount + feeAmount + hubFeeAmount)

  const snapshot: HubTransactionSnapshot = {
    productTitle: String(product.title),
    productPricingType: product.pricing_type,
    fundedAmount: roundMoney(fundedAmount),
    fundedCurrency: receiveCurrencyResolved,
    feePercent: feePercent > 0 ? feePercent : null,
    hubFeeAmount,
    corridorFeeAmount: feeAmount,
    billingContext: null,
    contactName: contactName.trim(),
    contactPhone: contactPhone.trim(),
    fulfillmentType:
      product.fulfillment_type === "in_person"
        ? "in_person"
        : product.fulfillment_type === "vendor"
          ? "vendor"
          : "online",
    deliveryAddressLine: deliveryAddressLine?.trim() || null,
    formAnswers,
  }

  const transactionId = generateTransactionId()
  const reference = idempotencyKey?.trim() ? `${HUB_IDEMPOTENCY_PREFIX}${idempotencyKey.trim()}` : null

  const insertRow = {
    transaction_id: transactionId,
    user_id: userId,
    recipient_id: null,
    send_amount: sendAmount,
    send_currency: sendCurrency,
    receive_amount: roundMoney(fundedAmount),
    receive_currency: receiveCurrencyResolved,
    exchange_rate: rate,
    fee_amount: feeAmount,
    fee_type: corridor.feeType,
    total_amount: totalAmount,
    reference,
    fulfillment_type: "bank_transfer",
    logistics_fee_amount: 0,
    logistics_fee_type_snapshot: null,
    delivery_address_line: deliveryAddressLine?.trim() || null,
    delivery_phone: contactPhone.trim(),
    delivery_address_id: deliveryAddressId || null,
    transaction_source: "hub",
    hub_product_id: hubProductId,
    hub_snapshot: snapshot as unknown as Record<string, unknown>,
    hub_fee_amount: hubFeeAmount,
    status: "pending",
  }

  const { data: inserted, error: insErr } = await server.from("transactions").insert(insertRow).select().single()

  if (insErr) {
    if (insErr.code === "23505" && reference) {
      const { data: again } = await server
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("reference", reference)
        .maybeSingle()
      if (again) return { transaction: again as Record<string, unknown>, duplicate: true }
    }
    console.error("hub checkout insert error", insErr)
    throw new Error("Failed to create transaction")
  }

  return { transaction: inserted as Record<string, unknown> }
}

/** Validate `formAnswers` keys exist in schema; does not validate format deeply. */
export function validateHubFormAnswers(
  formSchema: unknown,
  answers: Record<string, unknown>,
): { ok: true } | { ok: false; message: string } {
  const fields = parseFormSchema(formSchema) as { key?: string; required?: boolean; label?: string }[]
  for (const f of fields) {
    const key = f?.key
    if (!key || key === "customer_info") continue
    const v = answers[key]
    if (f.required && (v === undefined || v === null || String(v).trim() === "")) {
      return { ok: false, message: `Missing required field: ${f.label || key}` }
    }
  }
  return { ok: true }
}
