import { providerPaymentMatches } from "./provider-validation"
import { encryptToken, decryptToken } from "./token-crypto"
import {
  db,
  assert,
  check,
  transition,
  getOrder,
  methods,
  requireEnabled,
  MarketplaceError,
  hash,
} from "./service"

class ProviderError extends Error {
  constructor(public status: number) {
    super(`Provider HTTP ${status}`)
  }
}
async function provider(path: string, init: RequestInit = {}) {
  const shop = process.env.YOOKASSA_SHOP_ID,
    key = process.env.YOOKASSA_SECRET_KEY
  assert(shop && key, "PAYMENT_PROVIDER_UNAVAILABLE", 503)
  const r = await fetch(`https://api.yookassa.ru/v3${path}`, {
    ...init,
    signal: AbortSignal.timeout(35000),
    headers: {
      Authorization: `Basic ${Buffer.from(`${shop}:${key}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  })
  if (!r.ok) throw new ProviderError(r.status)
  return r.json()
}
const defaultDependencies = { db, getOrder, transition, provider }
/** Injectable I/O keeps recovery failure tests independent of credentials or a gateway. */
export function createMarketplacePaymentService(overrides: Partial<typeof defaultDependencies> = {}) {
  const { db, getOrder, transition, provider } = { ...defaultDependencies, ...overrides }
  async function attempt(id: string) {
    const { data, error } = await db().from("marketplace_attempts").select("*").eq("id", id).single()
    check(error)
    assert(data, "ATTEMPT_NOT_FOUND", 404)
    return data
  }
  async function applyProvider(payment: any, attemptId?: string) {
    const id = attemptId || payment.metadata?.attemptId
    assert(id, "PAYMENT_MISMATCH")
    const a = await attempt(id),
      o = await getOrder(a.order_id, undefined, true)
    assert(providerPaymentMatches(payment, a, o.id, process.env.YOOKASSA_SHOP_ID), "PAYMENT_MISMATCH")
    const { error } = await db()
      .from("marketplace_attempts")
      .update({
        provider_id: payment.id,
        provider_status: payment.status,
        confirmation_token: payment.confirmation?.confirmation_token || a.confirmation_token || null,
        confirmation_url: payment.confirmation?.confirmation_url || a.confirmation_url || null,
        encrypted_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", a.id)
    check(error)
    if (payment.status === "succeeded") await transition(o.id, "paid", null, { attemptId: a.id })
    else if (payment.status === "canceled") await transition(o.id, "failed", null, { attemptId: a.id })
    else {
      await transition(o.id, "pending", null, { attemptId: a.id })
    }
    return payment
  }
  async function startAttempt(attemptId: string, paymentToken?: string, paymentType?: string) {
    let a = await attempt(attemptId)
    const o = await getOrder(a.order_id, undefined, true)
    if (a.provider_id)
      return applyProvider(await provider(`/payments/${encodeURIComponent(a.provider_id)}`), a.id)
    assert(
      a.active && a.rail === "yookassa" && !["succeeded", "failed", "superseded"].includes(a.state),
      "INVALID_TRANSITION",
    )
    assert(
      o.fulfillment_state !== "cancelled" && Date.parse(o.payment_deadline) > Date.now(),
      "PAYMENT_DEADLINE_PASSED",
    )
    if (!a.request_payload) {
      if (a.confirmation_mode === "native")
        assert(paymentToken && paymentToken.length < 8192, "PAYMENT_TOKEN_REQUIRED", 400)
      const payload: any = {
        amount: { value: o.snapshot.totals.total.toFixed(2), currency: o.snapshot.totals.payCurrency },
        capture: true,
        description: o.snapshot.title.slice(0, 128),
        metadata: { orderId: o.id, attemptId: a.id },
      }
      if (a.confirmation_mode === "embedded")
        payload.confirmation = {
          type: "embedded",
          return_url: `${(process.env.NEXT_PUBLIC_APP_URL || "https://app.ciuna.com").replace(/\/$/, "")}/pay/${o.public_id.toLowerCase()}`,
        }
      const { error } = await db()
        .from("marketplace_attempts")
        .update({
          request_payload: payload,
          request_fingerprint: hash({ ...payload, payment_token: paymentToken }),
          native_payment_type: paymentType || null,
          encrypted_token: a.confirmation_mode === "native" ? encryptToken(paymentToken!, a.id) : null,
        })
        .eq("id", a.id)
        .is("request_payload", null)
      check(error)
      a = await attempt(a.id)
    }
    const body = {
      ...a.request_payload,
      ...(a.encrypted_token ? { payment_token: decryptToken(a.encrypted_token, a.id) } : {}),
    }
    assert(a.confirmation_mode !== "native" || body.payment_token, "PAYMENT_UNRESOLVED")
    assert(hash(body) === a.request_fingerprint, "PAYMENT_UNRESOLVED")
    try {
      const payment = await provider("/payments", {
        method: "POST",
        headers: { "Idempotence-Key": a.idempotency_key },
        body: JSON.stringify(body),
      })
      return await applyProvider(payment, a.id)
    } catch (e) {
      const definite =
        e instanceof ProviderError && e.status >= 400 && e.status < 500 && ![408, 409, 429].includes(e.status)
      await transition(o.id, definite ? "failed" : "unknown", null, { attemptId: a.id })
      throw new MarketplaceError(definite ? "PAYMENT_FAILED" : "PAYMENT_UNRESOLVED", definite ? 409 : 202)
    }
  }
  async function reconcileAttempt(id: string): Promise<boolean> {
    const a = await attempt(id)
    if (["succeeded", "failed", "superseded"].includes(a.state)) return true
    const o = await getOrder(a.order_id, undefined, true)
    if (a.provider_id) {
      const p = await applyProvider(await provider(`/payments/${encodeURIComponent(a.provider_id)}`), id)
      return ["succeeded", "canceled"].includes(p.status)
    }
    // Native sheet has not submitted a token: no request exists at the provider.
    if (a.confirmation_mode === "native" && !a.request_payload) {
      if (Date.parse(o.payment_deadline) <= Date.now() || o.fulfillment_state === "cancelled") {
        await transition(o.id, "failed", null, { attemptId: id })
        return true
      }
      return false
    }
    const canCreate =
      Date.parse(o.payment_deadline) > Date.now() &&
      o.fulfillment_state !== "cancelled" &&
      Date.now() - Date.parse(a.created_at) < 23 * 3600000
    if (canCreate) {
      try {
        const p = await startAttempt(id)
        return ["succeeded", "canceled"].includes(p.status)
      } catch (e) {
        if (!(e instanceof MarketplaceError)) throw e
        return e.code === "PAYMENT_FAILED"
      }
    }
    if (!a.request_payload) {
      await transition(o.id, "failed", null, { attemptId: id })
      return true
    }
    // After the local deadline, search only; replaying POST could create a new charge.
    let cursor: string | undefined
    for (let page = 0; page < 20; page++) {
      const q = new URLSearchParams({
        "created_at.gte": new Date(Date.parse(a.created_at) - 60000).toISOString(),
        limit: "100",
      })
      if (cursor) q.set("cursor", cursor)
      const result = await provider(`/payments?${q}`)
      const found = result.items?.find((p: any) => p.metadata?.attemptId === id)
      if (found) {
        const p = await applyProvider(await provider(`/payments/${encodeURIComponent(found.id)}`), id)
        return ["succeeded", "canceled"].includes(p.status)
      }
      cursor = result.next_cursor
      if (!cursor) break
    }
    await transition(o.id, "unknown", null, { attemptId: id })
    return false
  }
  async function providerWebhook(paymentId: string) {
    const p = await provider(`/payments/${encodeURIComponent(paymentId)}`)
    if (!p.metadata?.attemptId) return false
    await applyProvider(p)
    return true
  }
  async function newAttempt(
    orderId: string,
    userId: string,
    body: { rail: "manual" | "yookassa"; paymentMethodId?: string; gatewayMode?: "embedded" | "native" },
  ) {
    const o = await getOrder(orderId, userId)
    await requireEnabled(o.line)
    const available = await methods(o.snapshot.totals.payCurrency, o.snapshot.totals.productCurrency)
    const selected = available.options.find(
      (m) => m.rail === body.rail && (body.rail === "yookassa" || m.id === body.paymentMethodId),
    )
    assert(selected, "INVALID_PAYMENT_METHOD", 400)
    const { data, error } = await db().rpc("marketplace_new_attempt", {
      p_order: o.id,
      p_user: userId,
      p_rail: body.rail,
      p_method: body.rail === "manual" ? body.paymentMethodId : null,
      p_mode: body.gatewayMode || "embedded",
      p_instructions: selected.instructions,
    })
    check(error)
    return data as string
  }

  return { applyProvider, startAttempt, reconcileAttempt, providerWebhook, newAttempt }
}
export const { applyProvider, startAttempt, reconcileAttempt, providerWebhook, newAttempt } =
  createMarketplacePaymentService()
