import test from "node:test"
import assert from "node:assert/strict"
import { createMarketplacePaymentService } from "../../lib/marketplace/payments"
import { MarketplaceError } from "../../lib/marketplace/service"
function harness(mode = "embedded") {
  process.env.YOOKASSA_SHOP_ID = "shop"
  process.env.MARKETPLACE_TOKEN_KEY = Buffer.alloc(32, 2).toString("base64")
  const a: any = {
    id: "attempt",
    order_id: "order",
    rail: "yookassa",
    active: true,
    state: "created",
    confirmation_mode: mode,
    idempotency_key: "immutable-key",
    created_at: new Date().toISOString(),
    amount: 100,
    currency: "RUB",
  }
  const o: any = {
    id: "order",
    public_id: "PUBLIC",
    fulfillment_state: "awaiting_payment",
    payment_deadline: new Date(Date.now() + 900000).toISOString(),
    snapshot: { title: "Test", totals: { total: 100, payCurrency: "RUB" } },
  }
  const p: any = {
    id: "provider-id",
    status: "succeeded",
    metadata: { orderId: o.id, attemptId: a.id },
    recipient: { account_id: "shop" },
    amount: { value: "100.00", currency: "RUB" },
  }
  const calls: { path: string; init?: RequestInit }[] = [],
    events: string[] = []
  let failPersistence = false,
    failTransition = false,
    loseResponse = false,
    charges = 0
  const seen = new Set<string>()
  const db: any = () => ({
    from: () => ({
      select() {
        return this
      },
      eq() {
        return this
      },
      single: async () => ({ data: { ...a }, error: null }),
      update(values: any) {
        return {
          eq() {
            return this
          },
          is() {
            return this
          },
          then(resolve: any) {
            if (failPersistence) {
              failPersistence = false
              resolve({ error: { message: "database unavailable" } })
            } else {
              Object.assign(a, values)
              resolve({ error: null })
            }
          },
        }
      },
    }),
  })
  const svc = createMarketplacePaymentService({
    db,
    getOrder: async () => o,
    transition: async (_id, action) => {
      events.push(action)
      if (action === "paid" && failTransition) {
        failTransition = false
        throw new Error("database transition failed")
      }
      if (action === "paid") {
        a.state = "succeeded"
        a.active = false
        o.payment_state = "paid"
      } else if (action === "unknown") a.state = "unknown"
      else if (action === "failed") a.state = "failed"
    },
    provider: async (path, init) => {
      calls.push({ path, init })
      if (init?.method === "POST") {
        const key = (init.headers as any)["Idempotence-Key"]
        if (!seen.has(key)) {
          seen.add(key)
          charges++
        }
        if (loseResponse) {
          loseResponse = false
          throw new Error("response lost")
        }
        return p
      }
      if (path.startsWith("/payments?")) return { items: [p] }
      return p
    },
  })
  return {
    a,
    o,
    p,
    svc,
    calls,
    events,
    get charges() {
      return charges
    },
    failPersistence: () => {
      failPersistence = true
    },
    failTransition: () => {
      failTransition = true
    },
    loseResponse: () => {
      loseResponse = true
    },
  }
}
test("provider response lost: replay exact request and key, one charge, same order", async () => {
  const h = harness()
  h.loseResponse()
  await assert.rejects(
    h.svc.startAttempt(h.a.id),
    (e) => e instanceof MarketplaceError && e.code === "PAYMENT_UNRESOLVED",
  )
  assert.equal(h.a.state, "unknown")
  assert.ok(h.a.request_fingerprint)
  assert.equal(await h.svc.reconcileAttempt(h.a.id), true)
  assert.equal(h.charges, 1)
  assert.equal(h.calls[0].init?.body, h.calls[1].init?.body)
  assert.equal(h.o.payment_state, "paid")
})
test("provider success followed by local transition failure resumes from provider reference", async () => {
  const h = harness()
  h.failTransition()
  await assert.rejects(h.svc.startAttempt(h.a.id))
  assert.equal(h.a.provider_id, "provider-id")
  await h.svc.reconcileAttempt(h.a.id)
  assert.equal(h.charges, 1)
  assert.equal(h.calls[1].init?.method, undefined)
  assert.equal(h.o.payment_state, "paid")
})
test("failed replay persistence does not submit a charge", async () => {
  const h = harness()
  h.failPersistence()
  await assert.rejects(h.svc.startAttempt(h.a.id))
  assert.equal(h.calls.length, 0)
  assert.equal(h.charges, 0)
})
test("deadline passed with missing provider reference: lookup only, never create a new charge", async () => {
  const h = harness()
  h.loseResponse()
  await assert.rejects(h.svc.startAttempt(h.a.id))
  h.o.payment_deadline = new Date(Date.now() - 1000).toISOString()
  assert.equal(await h.svc.reconcileAttempt(h.a.id), true)
  assert.equal(h.calls.filter((c) => c.init?.method === "POST").length, 1)
  assert.equal(h.charges, 1)
})
test("native token survives lost response, is replayed identically and removed on recovery", async () => {
  const h = harness("native")
  h.loseResponse()
  await assert.rejects(h.svc.startAttempt(h.a.id, "private-token", "BANK_CARD"))
  assert.ok(h.a.encrypted_token)
  assert.ok(!JSON.stringify(h.a).includes("private-token"))
  await h.svc.reconcileAttempt(h.a.id)
  assert.equal(h.calls[0].init?.body, h.calls[1].init?.body)
  assert.equal(h.a.encrypted_token, null)
  assert.equal(h.charges, 1)
})
test("cancelled order never starts a provider payment", async () => {
  const h = harness()
  h.o.fulfillment_state = "cancelled"
  await assert.rejects(h.svc.startAttempt(h.a.id))
  assert.equal(h.calls.length, 0)
})
