import { createHash } from "node:crypto"
import {
  marketplaceTotals,
  type MarketplaceQuote,
  type MarketplacePreviewInput,
  type MarketplaceSubmit,
  type MarketplaceLineItem,
  type FulfillmentMode,
  type MarketplaceOrder,
  type MarketplaceMethod,
} from "@ciuna/shared"
import { createServerClient } from "@/lib/supabase"
import { generateTransactionId } from "@/lib/transaction-id"
import { isYooKassaConfigured } from "@/lib/yookassa"

export const db = () => createServerClient()
export class MarketplaceError extends Error {
  constructor(
    public code: string,
    public status = 409,
  ) {
    super(code)
  }
}
export function assert(condition: unknown, code: string, status = 409): asserts condition {
  if (!condition) throw new MarketplaceError(code, status)
}
export function check(error: { message: string } | null) {
  if (error) {
    const match = error.message.match(/\b[A-Z][A-Z_]{3,}\b/)
    throw new MarketplaceError(match?.[0] || "MARKETPLACE_UNAVAILABLE", match ? 409 : 503)
  }
}
function canonical(value: any): any {
  return Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((k) => value[k] !== undefined)
            .map((k) => [k, canonical(value[k])]),
        )
      : value
}
export const hash = (value: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex")
/** Marketplace purchase lines. Office Settings → Hub service lines (`is_enabled`) is the product switch. */
const MARKETPLACE_LINES = new Set(["food", "mart", "experts"])

/**
 * Optional env allow-list. Empty / unset = all marketplace lines may check out
 * (still subject to Office `hub_service_lines.is_enabled`).
 * Set e.g. `food` only if you need an emergency API-level restrict without touching Office.
 */
export function envAllowsLine(line: string) {
  if (!MARKETPLACE_LINES.has(line)) return false
  const raw = (process.env.MARKETPLACE_CHECKOUT_LINES || "").trim()
  if (!raw) return true
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(line)
}

/** @deprecated use envAllowsLine / lineCheckoutEnabled — empty env now means on, not off */
export function enabled(line: string) {
  return envAllowsLine(line)
}

export async function lineCheckoutEnabled(line: string) {
  if (!envAllowsLine(line)) return false
  const { data, error } = await db()
    .from("hub_service_lines")
    .select("is_enabled")
    .eq("slug", line)
    .maybeSingle()
  check(error)
  if (!data) return true
  return Boolean(data.is_enabled)
}

export async function requireEnabled(line: string) {
  assert(await lineCheckoutEnabled(line), "CHECKOUT_UNAVAILABLE", 503)
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function validId(id: unknown) {
  assert(typeof id === "string" && uuid.test(id), "INVALID_ID", 400)
  return id
}
async function row(table: string, id: string) {
  const { data, error } = await db().from(table).select("*").eq("id", validId(id)).maybeSingle()
  check(error)
  assert(data, "NOT_FOUND", 404)
  return data
}
export async function methods(
  currency: string,
  productCurrency = currency,
): Promise<{ options: MarketplaceMethod[]; rows: Record<string, unknown> }> {
  const { data, error } = await db()
    .from("payment_methods")
    .select("*")
    .eq("status", "active")
    .eq("currency", currency)
  check(error)
  const rows = (data || []).filter((m) => !m.provider || m.provider === "manual")
  const options: MarketplaceMethod[] = rows.map((m) => ({
    id: m.id,
    rail: "manual",
    name: m.name,
    currency,
    instructions: Object.fromEntries(
      [
        "name",
        "type",
        "instructions",
        "account_name",
        "account_number",
        "bank_name",
        "routing_number",
        "sort_code",
        "iban",
        "swift_bic",
        "qr_code_data",
        "crypto_asset",
        "crypto_network",
        "wallet_address",
      ]
        .filter((k) => m[k] != null)
        .map((k) => [k, m[k]]),
    ),
  }))
  if (currency === "RUB" && productCurrency === "RUB" && isYooKassaConfigured())
    options.unshift({ id: "yookassa", rail: "yookassa", name: "YooKassa", currency, instructions: {} })
  return { options, rows: Object.fromEntries(rows.map((r) => [r.id, r])) }
}

export async function buildQuote(userId: string, input: MarketplacePreviewInput) {
  assert(input?.source && ["cart", "product", "expert"].includes(input.source.kind), "INVALID_SOURCE", 400)
  let products: any[] = [],
    lines: MarketplaceLineItem[] = [],
    vendor: any = null,
    cart: any = null,
    slot: any = null,
    service: any = null,
    profile: any = null
  let line: "food" | "mart" | "experts" = "mart",
    currency = "",
    modes: FulfillmentMode[] = [],
    requirePhone = false,
    instructions = ""
  const productVersions: Record<string, string> = {}
  if (input.source.kind === "expert") {
    slot = await row("expert_service_slots", input.source.expertServiceSlotId)
    service = await row("expert_services", slot.expert_service_id)
    profile = await row("expert_profiles", service.expert_profile_id)
    assert(service.is_published && profile.is_published, "CATALOG_UNAVAILABLE")
    assert(
      slot.status === "available" &&
        Date.parse(slot.slot_start) > Date.now() + service.booking_lead_minutes * 60000,
      "SLOT_UNAVAILABLE",
    )
    assert(service.pricing_type !== "quote", "QUOTE_NOT_PAYABLE")
    const { data: heldSlot, error: heldError } = await db()
      .from("marketplace_reservations")
      .select("id")
      .eq("slot_id", slot.id)
      .or(`state.eq.consumed,and(state.eq.held,expires_at.gt.${new Date().toISOString()})`)
    check(heldError)
    assert(!heldSlot?.length, "SLOT_UNAVAILABLE")
    const duration = (Date.parse(slot.slot_end) - Date.parse(slot.slot_start)) / 60000
    assert(
      duration > 0 &&
        (!service.min_session_minutes || duration >= service.min_session_minutes) &&
        (!service.max_session_minutes || duration <= service.max_session_minutes),
      "INVALID_DURATION",
    )
    const amount =
      service.pricing_type === "hourly"
        ? (Number(service.hourly_rate) * duration) / 60
        : Number(service.fixed_amount)
    currency = String(
      service.pricing_type === "hourly" ? service.hourly_currency : service.fixed_currency,
    ).toUpperCase()
    lines = [
      {
        id: service.id,
        title: `${profile.display_name} · ${service.title}`,
        quantity: 1,
        unitPrice: amount,
        feePercent: 0,
        fields: [],
      },
    ]
    line = "experts"
    requirePhone = true
    modes =
      service.fulfillment_type === "both"
        ? ["online_appointment", "in_person_appointment"]
        : [service.fulfillment_type === "in_person" ? "in_person_appointment" : "online_appointment"]
    instructions = service.meeting_instructions || profile.meeting_hint || ""
  } else {
    if (input.source.kind === "cart") {
      cart = await row("hub_carts", input.source.cartId)
      assert(cart.user_id === userId, "NOT_FOUND", 404)
      assert(cart.status === "active", "CART_CONVERTED")
      const { data: items, error } = await db()
        .from("hub_cart_items")
        .select("*")
        .eq("cart_id", cart.id)
        .order("hub_product_id")
      check(error)
      assert(items?.length, "EMPTY_ORDER")
      const results = await Promise.all(
        items.map(async (i) => ({ ...(await row("hub_products", i.hub_product_id)), quantity: i.quantity })),
      )
      products = results
      vendor = await row("hub_vendors", cart.vendor_id)
    } else {
      products = [{ ...(await row("hub_products", input.source.hubProductId)), quantity: 1 }]
      if (products[0].vendor_id) vendor = await row("hub_vendors", products[0].vendor_id)
    }
    if (vendor) assert(vendor.is_published, "CATALOG_UNAVAILABLE")
    for (const p of products) {
      assert(
        p.status === "live" && !p.sold_out && (p.stock_quantity == null || p.stock_quantity >= p.quantity),
        "OUT_OF_STOCK",
      )
      assert(p.service_line_slug === "food" || p.service_line_slug === "mart", "CATALOG_UNAVAILABLE")
      if (vendor) assert(vendor.service_line_slug === p.service_line_slug, "CATALOG_UNAVAILABLE")
      assert(p.fulfillment_mode, "FULFILLMENT_REVIEW_REQUIRED")
      if (cart)
        assert(
          p.vendor_id === cart.vendor_id &&
            p.service_line_slug === cart.service_line_slug &&
            p.pricing_type === "fixed",
          "INCOMPATIBLE_CART",
        )
      assert(p.vendor_id || p.fulfillment_mode === "digital", "VENDOR_REQUIRED")
      let amount = Number(p.sale_price ?? p.list_price ?? p.fixed_amount)
      if (p.pricing_type === "user_input") {
        amount = input.source.kind === "product" ? Number(input.source.fundedAmount) : NaN
        assert(
          Number.isFinite(amount) &&
            amount > 0 &&
            (p.funded_min == null || amount >= p.funded_min) &&
            (p.funded_max == null || amount <= p.funded_max),
          "AMOUNT_REQUIRED",
          400,
        )
      }
      const cur = String(
        p.pricing_type === "fixed" ? p.fixed_currency : p.default_input_currency,
      ).toUpperCase()
      assert(!currency || cur === currency, "MIXED_CURRENCY")
      currency = cur
      assert(!modes.length || modes[0] === p.fulfillment_mode, "MIXED_FULFILLMENT")
      modes = [p.fulfillment_mode]
      requirePhone ||= p.require_phone ?? p.fulfillment_mode !== "digital"
      productVersions[p.id] = p.updated_at
      lines.push({
        id: p.id,
        productId: p.id,
        title: p.title,
        quantity: p.quantity,
        unitPrice: amount,
        feePercent: Number(p.fee_percent || 0),
        fields: p.form_schema || [],
      })
    }
    const { data: holds, error: holdError } = await db()
      .from("marketplace_reservations")
      .select("product_id,quantity")
      .in(
        "product_id",
        products.map((p) => p.id),
      )
      .eq("state", "held")
      .gt("expires_at", new Date().toISOString())
    check(holdError)
    for (const p of products) {
      const reserved = (holds || [])
        .filter((h) => h.product_id === p.id)
        .reduce((n, h) => n + Number(h.quantity), 0)
      assert(p.stock_quantity == null || p.stock_quantity - reserved >= p.quantity, "OUT_OF_STOCK")
    }
    line = products[0].service_line_slug
    instructions = vendor?.fulfillment_notes || ""
    if (modes[0] === "pickup") {
      assert(vendor?.pickup_location && vendor?.pickup_hours, "PICKUP_UNAVAILABLE")
      instructions = [vendor.pickup_location, vendor.pickup_hours, instructions].filter(Boolean).join("\n")
    }
  }
  const fulfillmentMode = input.fulfillmentMode || modes[0]
  assert(modes.includes(fulfillmentMode), "INVALID_FULFILLMENT", 400)
  const pickupLocation =
    fulfillmentMode === "pickup" && vendor?.pickup_location ? String(vendor.pickup_location) : undefined
  const pickupHours =
    fulfillmentMode === "pickup" && vendor?.pickup_hours ? String(vendor.pickup_hours) : undefined
  const fulfillmentNotes = vendor?.fulfillment_notes ? String(vendor.fulfillment_notes) : undefined
  const { data: zoneRows, error: zoneError } = vendor
    ? await db().from("marketplace_zones").select("*").eq("vendor_id", vendor.id).eq("active", true)
    : { data: [], error: null }
  check(zoneError)
  const zones = (zoneRows || []).filter((z) => z.currency === currency)
  const zone = zones.find((z) => z.id === input.deliveryZoneId)
  if (input.deliveryZoneId) assert(zone, "DELIVERY_UNAVAILABLE")
  const payCurrency = String(input.payCurrency || currency).toUpperCase()
  let rate: any = { rate: 1, fee_type: "free", fee_amount: 0 }
  if (payCurrency !== currency) {
    const result = await db()
      .from("exchange_rates")
      .select("*")
      .eq("from_currency", payCurrency)
      .eq("to_currency", currency)
      .eq("status", "active")
      .maybeSingle()
    check(result.error)
    assert(result.data, "RATE_UNAVAILABLE")
    rate = result.data
  }
  const available = await methods(payCurrency, currency)
  const { data: payRows, error: payErr } = await db()
    .from("payment_methods")
    .select("currency,provider")
    .eq("status", "active")
  check(payErr)
  const { data: corridors, error: rateErr } = await db()
    .from("exchange_rates")
    .select("from_currency")
    .eq("to_currency", currency)
    .eq("status", "active")
  check(rateErr)
  const payCurrencies = [
    ...new Set([
      currency,
      ...(payRows || [])
        .filter(
          (m) =>
            (!m.provider || m.provider === "manual") &&
            (corridors || []).some((r) => r.from_currency === m.currency),
        )
        .map((m) => String(m.currency)),
    ]),
  ]
  const totals = marketplaceTotals({
    lines,
    productCurrency: currency,
    payCurrency,
    rate: Number(rate.rate),
    deliveryFee: fulfillmentMode === "delivery" ? Number(zone?.fee || 0) : 0,
    corridorFeeType: rate.fee_type,
    corridorFeeAmount: Number(rate.fee_amount || 0),
  })
  const snapshot: Omit<MarketplaceQuote, "id" | "expiresAt"> = {
    source: input.source,
    line,
    title: vendor ? `${vendor.name} · ${lines.length}` : lines[0].title,
    lines,
    totals,
    modes,
    fulfillmentMode,
    zones: zones.map((z) => ({
      id: z.id,
      city: z.city,
      district: z.district,
      fee: Number(z.fee),
      currency: z.currency,
    })),
    deliveryZoneId: zone?.id,
    requirePhone,
    methods: available.options,
    payCurrencies,
    instructions,
    ...(pickupLocation ? { pickupLocation } : {}),
    ...(pickupHours ? { pickupHours } : {}),
    ...(fulfillmentNotes ? { fulfillmentNotes } : {}),
    ...(slot ? { slotStart: slot.slot_start, slotEnd: slot.slot_end, timezone: service.timezone } : {}),
    fulfillmentMinutes: Math.max(
      1,
      ...products.map((p) => {
        const m = /^(\d+):(\d{2}):(\d{2})$/.exec(p.sla_text || "")
        return m ? Math.ceil(Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 60) : 60
      }),
    ),
    checkoutReady:
      (await lineCheckoutEnabled(line)) &&
      available.options.length > 0 &&
      (fulfillmentMode !== "delivery" || !!zone),
  }
  return {
    snapshot,
    input,
    ownerTeam: vendor?.owner_team || products[0]?.owner_team || "operations",
    productVersions,
    vendorId: vendor?.id,
    vendorVersion: vendor?.updated_at,
    cartId: cart?.id,
    cartItems: products
      .map((p) => ({ id: p.id, quantity: p.quantity }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    slotId: slot?.id,
    profileId: profile?.id,
    serviceVersion: service?.updated_at,
    profileVersion: profile?.updated_at,
    leadMinutes: service?.booking_lead_minutes,
    cutoffMinutes: service?.payment_cutoff_minutes,
    pricingType: service?.pricing_type,
    zoneRow: zone,
    methodRows: available.rows,
    rateRow: payCurrency !== currency ? rate : undefined,
  }
}
export async function preview(userId: string, input: MarketplacePreviewInput): Promise<MarketplaceQuote> {
  const payload = await buildQuote(userId, input)
  const expires = new Date(Date.now() + 5 * 60000).toISOString()
  const { data, error } = await db()
    .from("marketplace_quotes")
    .insert({ user_id: userId, payload, expires_at: expires })
    .select("id")
    .single()
  check(error)
  return { ...payload.snapshot, id: data!.id, expiresAt: expires }
}
export async function submit(user: { id: string; email: string }, body: MarketplaceSubmit) {
  validId(body.quoteId)
  assert(
    typeof body.idempotencyKey === "string" &&
      body.idempotencyKey.length >= 8 &&
      body.idempotencyKey.length <= 128,
    "INVALID_IDEMPOTENCY_KEY",
    400,
  )
  const requestHash = hash(body)
  const { data: existing, error: existingErr } = await db()
    .from("marketplace_orders")
    .select("id,request_hash")
    .eq("user_id", user.id)
    .eq("request_key", body.idempotencyKey)
    .maybeSingle()
  check(existingErr)
  if (existing) {
    assert(existing.request_hash === requestHash, "IDEMPOTENCY_CONFLICT")
    return existing.id as string
  }
  const q = await row("marketplace_quotes", body.quoteId)
  assert(q.user_id === user.id, "NOT_FOUND", 404)
  assert(Date.parse(q.expires_at) > Date.now(), "QUOTE_EXPIRED")
  const snapshot = q.payload.snapshot as MarketplaceQuote
  await requireEnabled(snapshot.line)
  const fresh = await buildQuote(user.id, q.payload.input)
  assert(hash(fresh) === hash(q.payload), "PRICE_CHANGED")
  assert(snapshot.checkoutReady, "CHECKOUT_UNAVAILABLE")
  assert(
    typeof body.contactName === "string" &&
      body.contactName.trim().length > 0 &&
      body.contactName.length <= 200,
    "CONTACT_NAME_REQUIRED",
    400,
  )
  assert(
    !snapshot.requirePhone || (typeof body.contactPhone === "string" && body.contactPhone.trim().length >= 5),
    "CONTACT_PHONE_REQUIRED",
    400,
  )
  assert(user.email, "EMAIL_REQUIRED", 400)
  let address = body.deliveryAddressLine?.trim() || ""
  if (snapshot.fulfillmentMode === "delivery") {
    const zone = snapshot.zones.find((z) => z.id === snapshot.deliveryZoneId)
    assert(zone, "DELIVERY_UNAVAILABLE")
    if (body.deliveryAddressId) {
      const saved = await row("delivery_addresses", body.deliveryAddressId)
      assert(saved.user_id === user.id, "NOT_FOUND", 404)
      // Explicit selection in preview supplies the structured zone for old free-text addresses.
      address = saved.address_line
      const { error } = await db()
        .from("delivery_addresses")
        .update({ city: zone.city, district: zone.district })
        .eq("id", saved.id)
        .eq("user_id", user.id)
      check(error)
    }
    assert(address.length >= 5 && address.length <= 2000, "ADDRESS_REQUIRED", 400)
  } else address = ""
  for (const line of snapshot.lines) {
    const answers = body.lineFormAnswers?.[line.id] || {}
    assert(!Array.isArray(answers) && typeof answers === "object", "INVALID_FORM", 400)
    assert(
      Object.keys(answers).every((k) => line.fields.some((f) => f.key === k)),
      "INVALID_FORM",
      400,
    )
    for (const f of line.fields) {
      const value = answers[f.key]
      if (value == null || value === "") {
        assert(!f.required, "FORM_REQUIRED", 400)
        continue
      }
      assert(
        f.type === "number"
          ? typeof value === "number" && Number.isFinite(value)
          : typeof value === "string" && value.length <= 4000,
        "INVALID_FORM",
        400,
      )
      if (f.type === "select")
        assert(
          f.options?.some((o) => o.value === value),
          "INVALID_FORM",
          400,
        )
      if (f.type === "url") assert(/^https:\/\//.test(String(value)), "INVALID_FORM", 400)
    }
  }
  assert(body.rail === "manual" || body.rail === "yookassa", "INVALID_PAYMENT_METHOD", 400)
  if (body.rail === "manual") validId(body.paymentMethodId)
  else assert(!body.paymentMethodId, "INVALID_PAYMENT_METHOD", 400)
  const contact = {
    contactName: body.contactName.trim(),
    contactPhone: body.contactPhone?.trim() || null,
    contactEmail: user.email,
    deliveryAddressLine: address || null,
    note: String(body.note || "").slice(0, 4000),
    lineFormAnswers: body.lineFormAnswers || {},
  }
  const { data, error } = await db().rpc("marketplace_create_order", {
    p_user: user.id,
    p_quote: body.quoteId,
    p_key: body.idempotencyKey,
    p_hash: requestHash,
    p_contact: contact,
    p_rail: body.rail,
    p_method: body.paymentMethodId || null,
    p_mode: body.gatewayMode || "embedded",
    p_public: generateTransactionId(),
  })
  check(error)
  return data as string
}
export async function transition(
  orderId: string,
  action: string,
  actor: string | null,
  data: Record<string, unknown> = {},
) {
  const result = await db().rpc("marketplace_transition", {
    p_order: orderId,
    p_action: action,
    p_actor: actor,
    p_data: data,
  })
  check(result.error)
}
export async function getOrder(id: string, userId?: string, admin = false): Promise<MarketplaceOrder> {
  let query = db().from("marketplace_orders").select("*")
  query = uuid.test(id) ? query.eq("id", id) : query.eq("public_id", id.toUpperCase())
  if (!admin) query = query.eq("user_id", userId!)
  const { data: order, error } = await query.maybeSingle()
  check(error)
  assert(order, "ORDER_NOT_FOUND", 404)
  const [a, e] = await Promise.all([
    db()
      .from("marketplace_attempts")
      .select(
        "id,rail,state,confirmation_mode,confirmation_token,confirmation_url,native_payment_type,instructions,proof_path,active,method_id,created_at",
      )
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
    db()
      .from("marketplace_events")
      .select("id,kind,created_at,message,customer_visible,actor_id,details")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
  ])
  check(a.error)
  check(e.error)
  const canCancel = ["awaiting_payment", "awaiting_acceptance"].includes(order.fulfillment_state)
  const nextAction =
    order.fulfillment_state === "cancelled"
      ? order.payment_state === "refund_pending"
        ? "refund"
        : "none"
      : order.payment_state === "paid"
        ? "track"
        : order.payment_state === "processing"
          ? "checking"
          : order.payment_state === "expired"
            ? "review"
            : ["refund_pending", "refunded"].includes(order.payment_state)
              ? "refund"
              : "pay"
  // Never return quote internals, encrypted replay data, provider credentials, or internal events.
  return {
    ...order,
    attempts: a.data || [],
    events: (e.data || [])
      .filter((ev) => admin || ev.customer_visible)
      .map((ev) =>
        admin ? ev : { id: ev.id, kind: ev.kind, created_at: ev.created_at, message: ev.message },
      ),
    canCancel,
    nextAction,
  } as MarketplaceOrder
}
