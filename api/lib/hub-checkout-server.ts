import { createServerClient } from "@/lib/supabase"
import { generateTransactionId } from "@/lib/transaction-id"
import { roundMoney } from "@/utils/currency"
import { computeHubFeeFromReceive } from "@/lib/hub-fee"
import { hubPayMatchesProductCurrency, hubSyntheticSameCurrencyRateRow } from "@/lib/hub-same-currency-rate"
import { computeHubCartTotals } from "@/lib/hub-cart-pricing"
import { getCartById, markCartConverted } from "@/lib/hub-cart-server"
import { attachYooKassaPayment, resolveYooKassaReturnUrl, type GatewayConfirmation } from "@/lib/gateway-checkout"
import type { HubTransactionSnapshot, HubProductRow } from "@/lib/hub-types"
import type { ExchangeRate } from "@/types"
import { hubProductEffectivePrice } from "@/lib/hub-product-price"

const HUB_IDEMPOTENCY_PREFIX = "HUB:"
const HUB_CART_IDEMPOTENCY_PREFIX = "HUBCART:"

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

export interface HubCartCheckoutPayload {
  cartId: string
  sendCurrency: string
  contactName: string
  contactPhone: string
  deliveryAddressLine?: string | null
  deliveryAddressId?: string | null
  formAnswers?: Record<string, unknown>
  idempotencyKey?: string
  paymentMethod: "manual" | "yookassa"
  /**
   * App origin (e.g. `https://app.ciuna.com`) the hosted `/pay/[transactionId]` page lives on —
   * only needed to override `NEXT_PUBLIC_APP_URL` (e.g. a mobile build pointing at a different
   * origin). The transaction id is appended server-side once it's generated.
   */
  returnUrl?: string
  /**
   * `native` = create the order for the iOS/Android SDK (no embedded confirmation_token yet);
   * client will POST a payment_token to the gateway confirm route. Default `embedded` for web.
   */
  gatewayMode?: "embedded" | "native"
}

export interface HubCartCheckoutResult {
  transaction: Record<string, unknown>
  duplicate?: boolean
  gateway?: GatewayConfirmation
}

/**
 * Checkout for a multi-item Hub cart (Food/Mart). Re-validates every item server-side against
 * live `hub_products` rows — cart items never carry a frozen price, so this is the only place
 * that price is locked in. Writes one `transactions` header row + N `hub_order_items` rows.
 */
export async function createHubCartCheckoutTransaction(
  userId: string,
  payload: HubCartCheckoutPayload,
): Promise<HubCartCheckoutResult> {
  const server = createServerClient()
  const {
    cartId,
    sendCurrency,
    contactName,
    contactPhone,
    deliveryAddressLine,
    deliveryAddressId,
    formAnswers = {},
    idempotencyKey,
    paymentMethod,
    returnUrl,
    gatewayMode = "embedded",
  } = payload

  if (idempotencyKey?.trim()) {
    const ref = `${HUB_CART_IDEMPOTENCY_PREFIX}${idempotencyKey.trim()}`
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

  const cart = await getCartById(userId, cartId)
  if (cart.status !== "active") throw new Error("Cart is no longer active")
  if (!cart.items.length) throw new Error("Cart is empty")

  const unavailable = cart.items.filter((i) => i.unavailable || !i.product)
  if (unavailable.length) {
    throw new Error(`Some items in your cart are no longer available: ${unavailable.map((i) => i.product?.title || i.hub_product_id).join(", ")}`)
  }

  const items = cart.items.map((i) => ({ product: i.product as HubProductRow, quantity: i.quantity }))
  const firstProduct = items[0].product
  const fulfillmentType = firstProduct.fulfillment_type === "in_person" ? "in_person" : "vendor"

  if (fulfillmentType === "in_person" && !deliveryAddressLine?.trim()) {
    throw new Error("Delivery address required for in-person fulfillment")
  }
  if (paymentMethod === "yookassa" && String(sendCurrency).trim().toUpperCase() !== "RUB") {
    throw new Error("Online payment is only available in RUB")
  }

  const receiveCurrencyResolved = String(firstProduct.fixed_currency || "").trim().toUpperCase()
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
    if (rErr || !row) throw new Error("Exchange rate not available for selected currencies")
    rateRow = row as ExchangeRate
  }

  const totals = computeHubCartTotals(items, rateRow)
  const vendorTitle = cart.vendor?.name ? String(cart.vendor.name) : "Hub order"

  const snapshot: HubTransactionSnapshot = {
    productTitle: `${totals.lines.length} item${totals.lines.length === 1 ? "" : "s"} from ${vendorTitle}`,
    productPricingType: "fixed",
    fundedAmount: totals.totalReceive,
    fundedCurrency: totals.currency,
    feePercent: null,
    hubFeeAmount: totals.hubFeeReceive,
    corridorFeeAmount: totals.transferFee,
    billingContext: null,
    contactName: contactName.trim(),
    contactPhone: contactPhone.trim(),
    fulfillmentType: fulfillmentType === "in_person" ? "in_person" : "vendor",
    deliveryAddressLine: deliveryAddressLine?.trim() || null,
    formAnswers,
    items: totals.lines.map((l) => ({ title: l.title, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal })),
    vendorName: vendorTitle,
  }

  const transactionId = generateTransactionId()
  const reference = idempotencyKey?.trim() ? `${HUB_CART_IDEMPOTENCY_PREFIX}${idempotencyKey.trim()}` : null

  const insertRow = {
    transaction_id: transactionId,
    user_id: userId,
    recipient_id: null,
    send_amount: totals.totalSend,
    send_currency: sendCurrency,
    receive_amount: totals.totalReceive,
    receive_currency: totals.currency,
    exchange_rate: totals.exchangeRate,
    fee_amount: totals.transferFee,
    fee_type: rateRow.fee_type,
    total_amount: totals.total,
    reference,
    fulfillment_type: "bank_transfer",
    logistics_fee_amount: 0,
    logistics_fee_type_snapshot: null,
    delivery_address_line: deliveryAddressLine?.trim() || null,
    delivery_phone: contactPhone.trim(),
    delivery_address_id: deliveryAddressId || null,
    transaction_source: "hub",
    hub_product_id: null,
    hub_snapshot: snapshot as unknown as Record<string, unknown>,
    hub_fee_amount: totals.hubFeeReceive,
    payment_provider: paymentMethod,
    status: "pending",
  }

  const { data: inserted, error: insErr } = await server.from("transactions").insert(insertRow).select().single()

  if (insErr || !inserted) {
    if (insErr?.code === "23505" && reference) {
      const { data: again } = await server
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("reference", reference)
        .maybeSingle()
      if (again) return { transaction: again as Record<string, unknown>, duplicate: true }
    }
    console.error("hub cart checkout insert error", insErr)
    throw new Error("Failed to create transaction")
  }

  const orderItemRows = totals.lines.map((l) => ({
    transaction_id: inserted.id,
    hub_product_id: l.hubProductId,
    title: l.title,
    unit_price: l.unitPrice,
    currency: totals.currency,
    quantity: l.quantity,
    line_total: l.lineTotal,
  }))

  const { error: itemsErr } = await server.from("hub_order_items").insert(orderItemRows)
  if (itemsErr) {
    console.error("hub cart checkout order items insert error", itemsErr)
    await server.from("transactions").delete().eq("id", inserted.id)
    throw new Error("Failed to create order items")
  }

  if (paymentMethod === "yookassa") {
    if (gatewayMode === "native") {
      await markCartConverted(cartId)
      return {
        transaction: inserted as Record<string, unknown>,
        gateway: {
          confirmationType: "native",
          amount: totals.total,
          currency: "RUB",
        },
      }
    }
    try {
      const gateway = await attachYooKassaPayment({
        transactionRowId: String(inserted.id),
        transactionId,
        amount: totals.total,
        description: snapshot.productTitle,
        returnUrl: resolveYooKassaReturnUrl(returnUrl, transactionId),
        metadata: { transactionId, userId },
      })
      await markCartConverted(cartId)
      return { transaction: inserted as Record<string, unknown>, gateway }
    } catch (e) {
      // attachYooKassaPayment already rolled back the transaction row on failure.
      throw e instanceof Error ? e : new Error("Failed to start online payment")
    }
  }

  await markCartConverted(cartId)
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
