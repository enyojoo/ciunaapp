import test from "node:test"
import assert from "node:assert/strict"
import { enrichAudit, loadReasons, loadSla, queueCounts, withOwnerAndSla } from "../../lib/merchant/office-data"
import { DEFAULT_LISTING_REASONS, DEFAULT_SLA } from "../../lib/merchant/office"

type Result = { data?: any; count?: number | null; error?: { code?: string; message: string } | null }

/** A chainable stand-in for the Supabase client. `answer(table, ops)` returns what the awaited query resolves to. */
function fakeDb(answer: (table: string, ops: Array<[string, any[]]>) => Result) {
  return {
    from(table: string) {
      const ops: Array<[string, any[]]> = []
      const b: any = new Proxy({}, {
        get(_t, prop: string) {
          if (prop === "then") return (res: any, rej: any) => Promise.resolve({ data: null, count: null, error: null, ...answer(table, ops) }).then(res, rej)
          return (...args: any[]) => { ops.push([prop, args]); return b }
        },
      })
      return b
    },
  } as any
}
const has = (ops: Array<[string, any[]]>, name: string, arg0?: any) => ops.some(([n, a]) => n === name && (arg0 === undefined || a[0] === arg0))
const isHead = (ops: Array<[string, any[]]>) => ops.some(([n, a]) => n === "select" && a[1]?.head)

test("queue counts are exact (not capped), carry the oldest age and over-SLA, and are scoped by role", async () => {
  const old = new Date(Date.now() - 30 * 3_600_000).toISOString()
  const db = fakeDb((table, ops) => {
    if (table === "merchants") return isHead(ops) ? { count: has(ops, "lt") ? 3 : 250 } : { data: [{ submitted_at: old }] }
    if (table === "merchant_applications") return { count: 2 }
    if (table === "payouts") return isHead(ops) ? { count: 0 } : { data: [] }
    return { count: 0, data: [] }
  })
  const finance = await queueCounts(db, "finance", "me", { ...DEFAULT_SLA })
  assert.deepEqual(Object.keys(finance).sort(), ["kyc", "payouts", "support", "transactions"])
  assert.equal(finance.payouts!.count, 0)
  const ops = await queueCounts(db, "ops", "me", { ...DEFAULT_SLA })
  assert.equal(ops.payouts, undefined)
  assert.equal(ops.merchants!.count, 250, "exact count, not limited to 100 rows")
  assert.equal(ops.merchants!.over_sla, 3)
  assert.equal(ops.merchants!.mine, 2)
  assert.equal(ops.merchants!.oldest, old)
  assert.equal(ops.merchants!.limit_hours, 24)
  assert.equal(ops.merchants!.unavailable, undefined)
})

test("a missing table gives an unavailable queue, not a failure; other queues still count", async () => {
  const db = fakeDb((table, ops) => {
    if (table === "kyc_submissions") return { error: { code: "42P01", message: 'relation "kyc_submissions" does not exist' } }
    if (table === "transactions") return isHead(ops) ? { count: 4 } : { data: [{ created_at: "2026-10-01T00:00:00Z" }] }
    return { count: 0, data: [] }
  })
  const q = await queueCounts(db, "super_admin", "me", { ...DEFAULT_SLA })
  assert.equal(q.kyc!.unavailable, true)
  assert.equal(q.kyc!.count, 0)
  assert.equal(q.transactions!.count, 4)
  assert.equal(q.transactions!.limit_hours, null)
})

test("listings fall back to the last change when the queue columns are not applied yet", async () => {
  const db = fakeDb((table, ops) => {
    if (table !== "hub_products") return { count: 0, data: [] }
    const usesNewCol = ops.some(([n, a]) => (n === "select" && a[0] === "review_requested_at") || (n === "not" && a[0] === "review_requested_at") || (n === "lt" && a[0] === "review_requested_at") || (n === "eq" && a[0] === "review_assigned_to"))
    if (usesNewCol) return { error: { code: "42703", message: "column hub_products.review_requested_at does not exist" } }
    return isHead(ops) ? { count: 5 } : { data: [{ updated_at: "2026-10-10T00:00:00Z" }] }
  })
  const q = await queueCounts(db, "ops", "me", { ...DEFAULT_SLA })
  assert.equal(q.listings!.count, 5)
  assert.equal(q.listings!.oldest, "2026-10-10T00:00:00Z")
  assert.equal(q.listings!.unavailable, undefined)
})

test("SLA settings fall back to defaults when the table or key is missing", async () => {
  assert.deepEqual(await loadSla(fakeDb(() => ({ error: { code: "42P01", message: "x" } }))), DEFAULT_SLA)
  assert.deepEqual(await loadSla(fakeDb(() => ({ data: null }))), DEFAULT_SLA)
  assert.equal((await loadSla(fakeDb(() => ({ data: { value: { payout: 72 } } })))).payout, 72)
})

test("reason templates fall back to the built-in eight when the table is missing", async () => {
  assert.deepEqual(await loadReasons(fakeDb(() => ({ error: { code: "42P01", message: "x" } }))), DEFAULT_LISTING_REASONS)
  assert.deepEqual(await loadReasons(fakeDb(() => ({ data: [] }))), DEFAULT_LISTING_REASONS)
  assert.equal((await loadReasons(fakeDb(() => ({ data: [{ key: "k", label: "L", text: "T" }] }))))[0].key, "k")
})

test("merchant rows get owner, mine and SLA; owner survives a missing claimed_at column", async () => {
  const rows = [
    { id: "m1", status: "in_review", submitted_at: new Date(Date.now() - 30 * 3_600_000).toISOString(), created_at: "2026-10-01T00:00:00Z" },
    { id: "m2", status: "live", submitted_at: null, created_at: "2026-10-01T00:00:00Z" },
  ]
  const db = fakeDb((table, ops) => {
    if (table === "merchant_applications") {
      const withClaim = ops.some(([n, a]) => n === "select" && String(a[0]).includes("claimed_at"))
      return withClaim ? { error: { code: "42703", message: "column claimed_at does not exist" } } : { data: [{ merchant_id: "m1", assigned_to: "me" }] }
    }
    if (table === "admin_users") return { data: [{ id: "me", name: "Ada", email: "ada@x.com" }] }
    return {}
  })
  const out = await withOwnerAndSla(db, rows, { ...DEFAULT_SLA }, "me")
  assert.equal(out[0].owner?.name, "Ada")
  assert.equal(out[0].owner?.mine, true)
  assert.equal(out[0].sla?.breached, true)
  assert.equal(Math.round(out[0].sla!.over_by_hours!), 6)
  assert.equal(out[1].owner, null)
  assert.equal(out[1].sla, null)
})

test("audit rows carry actor name and email and the merchant name", async () => {
  const db = fakeDb((table) => {
    if (table === "admin_users") return { data: [{ id: "a1", name: "Ada Lovelace", email: "ada@x.com" }] }
    if (table === "users") return { data: [{ id: "u1", email: "mama@x.com", first_name: "Mama", last_name: "T" }] }
    if (table === "merchants") return { data: [{ id: "m1", display_name: "Mama T Kitchen" }] }
    return {}
  })
  const base = { created_at: "t", actor_role: null, entity_type: "merchant", entity_id: "m1", details: {} }
  const out = await enrichAudit(db, [
    { ...base, id: 3, actor_kind: "admin", actor_id: "a1", merchant_id: "m1", action: "merchant.approve" },
    { ...base, id: 2, actor_kind: "merchant", actor_id: "u1", merchant_id: "m1", action: "product.updated" },
    { ...base, id: 1, actor_kind: "system", actor_id: null, merchant_id: null, action: "ledger.release" },
  ])
  assert.deepEqual([out[0].actor_name, out[0].actor_email, out[0].merchant_name], ["Ada Lovelace", "ada@x.com", "Mama T Kitchen"])
  assert.deepEqual([out[1].actor_name, out[1].actor_email], ["Mama T", "mama@x.com"])
  assert.deepEqual([out[2].actor_name, out[2].merchant_name], [null, null])
})
