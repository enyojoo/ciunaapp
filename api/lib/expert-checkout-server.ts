import { createServerClient } from "@/lib/supabase"
import { generateTransactionId } from "@/lib/transaction-id"
import { roundMoney } from "@/utils/currency"
import { computeHubFeeFromReceive } from "@/lib/hub-fee"
import { hubPayMatchesProductCurrency, hubSyntheticSameCurrencyRateRow } from "@/lib/hub-same-currency-rate"
import type { HubTransactionSnapshot } from "@/lib/hub-types"
import type { ExchangeRate } from "@/types"

const EXBOOK_IDEMPOTENCY_PREFIX = "EXBOOK:"

function computeCorridorFee(sendAmount: number, rateRow: ExchangeRate): { fee: number; feeType: string } {
  if (rateRow.fee_type === "free") return { fee: 0, feeType: "free" }
  if (rateRow.fee_type === "fixed") return { fee: Number(rateRow.fee_amount) || 0, feeType: "fixed" }
  if (rateRow.fee_type === "percentage") {
    return { fee: (sendAmount * (Number(rateRow.fee_amount) || 0)) / 100, feeType: "percentage" }
  }
  return { fee: 0, feeType: "free" }
}

export interface ExpertCheckoutPayload {
  expert_service_slot_id: string
  sendCurrency: string
  receiveCurrency: string
  contactName: string
  contactPhone: string
  message?: string | null
  idempotencyKey?: string
}

export function computeExpertFundedAmount(params: {
  pricing_type: string
  hourly_rate: number | null
  hourly_currency: string | null
  fixed_amount: number | null
  fixed_currency: string | null
  slot_start: string
  slot_end: string
}): { fundedAmount: number; fundedCurrency: string } {
  const { pricing_type, hourly_rate, hourly_currency, fixed_amount, fixed_currency, slot_start, slot_end } = params
  if (pricing_type === "quote") {
    throw new Error("Quote pricing cannot be paid online yet")
  }
  if (pricing_type === "fixed") {
    const amt = Number(fixed_amount) || 0
    const cur = String(fixed_currency || "").trim()
    if (amt <= 0 || !cur) throw new Error("Invalid fixed price")
    return { fundedAmount: roundMoney(amt), fundedCurrency: cur }
  }
  if (pricing_type === "hourly") {
    const rate = Number(hourly_rate) || 0
    const cur = String(hourly_currency || "").trim()
    const ms = new Date(slot_end).getTime() - new Date(slot_start).getTime()
    const hours = Math.max(ms / 3600000, 1 / 60)
    const amt = roundMoney(rate * hours)
    if (amt <= 0 || !cur) throw new Error("Invalid hourly price")
    return { fundedAmount: amt, fundedCurrency: cur }
  }
  throw new Error("Unsupported expert pricing type")
}

export async function createExpertBookingCheckoutTransaction(
  userId: string,
  payload: ExpertCheckoutPayload,
): Promise<{ transaction: Record<string, unknown>; booking: Record<string, unknown>; duplicate?: boolean }> {
  const server = createServerClient()
  const {
    expert_service_slot_id: slotId,
    sendCurrency,
    receiveCurrency: receiveCurrencyInput,
    contactName,
    contactPhone,
    message,
    idempotencyKey,
  } = payload

  const sendCur = sendCurrency.trim()
  const receiveCurInput = receiveCurrencyInput.trim()

  if (!slotId || !sendCur || !receiveCurInput) {
    throw new Error("Missing required fields")
  }
  if (!contactName.trim() || !contactPhone.trim()) {
    throw new Error("Contact name and phone required")
  }

  if (idempotencyKey?.trim()) {
    const ref = `${EXBOOK_IDEMPOTENCY_PREFIX}${idempotencyKey.trim()}`
    const { data: existing } = await server
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("reference", ref)
      .maybeSingle()
    if (existing?.transaction_id) {
      const { data: bookingRow } = await server
        .from("expert_bookings")
        .select("*")
        .eq("user_id", userId)
        .eq("transaction_id", String(existing.transaction_id))
        .maybeSingle()
      if (bookingRow) {
        return {
          transaction: existing as Record<string, unknown>,
          booking: bookingRow as Record<string, unknown>,
          duplicate: true,
        }
      }
    }
  }

  const { data: slot, error: slotErr } = await server
    .from("expert_service_slots")
    .select("id, slot_start, slot_end, status, expert_service_id")
    .eq("id", slotId)
    .maybeSingle()

  if (slotErr || !slot) throw new Error("Slot not found")
  const startMs = new Date(String(slot.slot_start)).getTime()
  const endMs = new Date(String(slot.slot_end)).getTime()
  const nowMs = Date.now()
  if (slot.status !== "available" || startMs <= nowMs || endMs <= nowMs) {
    throw new Error("Slot not available")
  }

  const { data: svc, error: svcErr } = await server
    .from("expert_services")
    .select(
      "id, title, pricing_type, hourly_rate, hourly_currency, fixed_amount, fixed_currency, expert_profile_id, is_published",
    )
    .eq("id", slot.expert_service_id)
    .maybeSingle()

  if (svcErr || !svc?.is_published) throw new Error("Service not found")

  const { data: prof, error: profErr } = await server
    .from("expert_profiles")
    .select("id, is_published")
    .eq("id", svc.expert_profile_id)
    .maybeSingle()

  if (profErr || !prof?.is_published) throw new Error("Expert not found")

  let fundedAmount: number
  let receiveCurrencyResolved: string
  try {
    const computed = computeExpertFundedAmount({
      pricing_type: String(svc.pricing_type || ""),
      hourly_rate: svc.hourly_rate,
      hourly_currency: svc.hourly_currency,
      fixed_amount: svc.fixed_amount,
      fixed_currency: svc.fixed_currency,
      slot_start: String(slot.slot_start),
      slot_end: String(slot.slot_end),
    })
    fundedAmount = computed.fundedAmount
    receiveCurrencyResolved = computed.fundedCurrency
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Pricing error"
    throw new Error(msg)
  }

  if (receiveCurInput.toUpperCase() !== receiveCurrencyResolved.toUpperCase()) {
    throw new Error("Receive currency mismatch")
  }

  const feePercent = 0
  const payInProductCurrency = hubPayMatchesProductCurrency(sendCur, receiveCurrencyResolved)

  let rateRow: ExchangeRate
  if (payInProductCurrency) {
    rateRow = hubSyntheticSameCurrencyRateRow(sendCur, receiveCurrencyResolved)
  } else {
    const { data: row, error: rErr } = await server
      .from("exchange_rates")
      .select("*")
      .eq("from_currency", sendCur)
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
  const hubFee = computeHubFeeFromReceive(fundedAmount, rateRow, feePercent)
  const sendAmount = roundMoney(requiredSend)
  const feeAmount = roundMoney(corridor.fee)
  const hubFeeAmount = roundMoney(hubFee)
  const totalAmount = roundMoney(sendAmount + feeAmount + hubFeeAmount)

  const snapshot: HubTransactionSnapshot = {
    productTitle: String(svc.title),
    productPricingType: "fixed",
    fundedAmount: roundMoney(fundedAmount),
    fundedCurrency: receiveCurrencyResolved,
    feePercent: null,
    hubFeeAmount,
    corridorFeeAmount: feeAmount,
    billingContext: null,
    contactName: contactName.trim(),
    contactPhone: contactPhone.trim(),
    fulfillmentType: "online",
    deliveryAddressLine: null,
    formAnswers: {
      expert_checkout: true,
      expert_service_id: svc.id,
      expert_service_slot_id: slotId,
      expert_pricing_type: svc.pricing_type,
      message: message != null ? String(message).trim() || null : null,
    },
  }

  const transactionId = generateTransactionId()
  const reference = idempotencyKey?.trim() ? `${EXBOOK_IDEMPOTENCY_PREFIX}${idempotencyKey.trim()}` : null

  const insertTx = {
    transaction_id: transactionId,
    user_id: userId,
    recipient_id: null,
    send_amount: sendAmount,
    send_currency: sendCur,
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
    delivery_address_line: null,
    delivery_phone: contactPhone.trim(),
    delivery_address_id: null,
    transaction_source: "hub",
    hub_product_id: null,
    hub_snapshot: snapshot as unknown as Record<string, unknown>,
    hub_fee_amount: hubFeeAmount,
    status: "pending",
  }

  const { data: locked, error: lockErr } = await server
    .from("expert_service_slots")
    .update({ status: "booked", updated_at: new Date().toISOString() })
    .eq("id", slotId)
    .eq("status", "available")
    .select("id")
    .maybeSingle()

  if (lockErr || !locked) {
    throw new Error("Slot just taken")
  }

  const { data: insertedTx, error: insErr } = await server.from("transactions").insert(insertTx).select().single()

  if (insErr) {
    await server
      .from("expert_service_slots")
      .update({ status: "available", updated_at: new Date().toISOString() })
      .eq("id", slotId)
    console.error("expert checkout transaction insert", insErr)
    throw new Error("Failed to create transaction")
  }

  const bookingRow = {
    user_id: userId,
    expert_profile_id: svc.expert_profile_id,
    expert_service_id: svc.id,
    expert_service_slot_id: slotId,
    pricing_type_snapshot: svc.pricing_type,
    status: "pending",
    slot_start: slot.slot_start,
    slot_end: slot.slot_end,
    message: message != null ? String(message).trim() || null : null,
    updated_at: new Date().toISOString(),
    transaction_id: String(insertedTx.transaction_id),
  }

  const { data: booking, error: bookErr } = await server.from("expert_bookings").insert(bookingRow).select("*").single()

  if (bookErr || !booking) {
    console.error("expert checkout booking insert", bookErr)
    await server.from("transactions").delete().eq("transaction_id", insertedTx.transaction_id)
    await server
      .from("expert_service_slots")
      .update({ status: "available", updated_at: new Date().toISOString() })
      .eq("id", slotId)
    throw new Error("Failed to create booking record")
  }

  return { transaction: insertedTx as Record<string, unknown>, booking: booking as Record<string, unknown> }
}
