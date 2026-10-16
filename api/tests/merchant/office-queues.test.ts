import test from "node:test"
import assert from "node:assert/strict"
import {
  AUDIT_CSV_HEADER, DEFAULT_LISTING_REASONS, DEFAULT_SLA, QUEUE_PERMISSION, auditCsv, auditRange, buildReviewNote, businessHoursBetween, claimOutcome,
  cleanSearch, csvCell, isMissingSchema, parseSla, searchKinds, slaState, validateSlaUpdate, validateView, visibleQueues,
} from "../../lib/merchant/office"
import { adminCan } from "../../lib/admin-roles"
import { renderAlert, ALERT_LANGS } from "../../lib/merchant/notify-messages"
import { MerchantError } from "../../lib/merchant/errors"

test("missing table, column or function is detected for Postgres and PostgREST errors", () => {
  assert.equal(isMissingSchema({ code: "42P01", message: "relation x does not exist" }), true)
  assert.equal(isMissingSchema({ code: "42703", message: "column" }), true)
  assert.equal(isMissingSchema({ code: "PGRST205", message: "x" }), true)
  assert.equal(isMissingSchema({ code: "42883", message: "function" }), true)
  assert.equal(isMissingSchema({ message: "Could not find the 'claimed_at' column of 'merchant_applications' in the schema cache" }), true)
  assert.equal(isMissingSchema({ code: "23505", message: "duplicate key" }), false)
  assert.equal(isMissingSchema(null), false)
})

test("SLA defaults match the decisions guide and stored values merge over them", () => {
  assert.deepEqual(
    [DEFAULT_SLA.merchant_application, DEFAULT_SLA.listing_review, DEFAULT_SLA.payout, DEFAULT_SLA.kyc_business_hours, DEFAULT_SLA.support_business_days],
    [24, 12, 48, 4, 1],
  )
  assert.equal(parseSla({ payout: 72 }).payout, 72)
  assert.equal(parseSla({ payout: 72 }).listing_review, 12)
  assert.equal(parseSla({ payout: -3, listing_review: "x" }).payout, 48)
  assert.deepEqual(parseSla(null), DEFAULT_SLA)
  assert.equal(parseSla({ business_start_hour: 18, business_end_hour: 9 }).business_start_hour, 9)
})

test("SLA edits are validated", () => {
  assert.deepEqual(validateSlaUpdate({ payout: 36 }), { ok: true, value: { payout: 36 } })
  assert.equal(validateSlaUpdate({}).ok, false)
  assert.equal((validateSlaUpdate({ payout: 0 }) as any).code, "SLA_INVALID")
  assert.equal((validateSlaUpdate({ payout: 9999 }) as any).code, "SLA_INVALID")
  assert.equal((validateSlaUpdate({ business_start_hour: 18, business_end_hour: 9 }) as any).code, "SLA_INVALID")
  assert.equal((validateSlaUpdate({ business_start_hour: 8.5 }) as any).code, "SLA_INVALID")
})

test("slaState reports the breach as 'over by' and never when within the target", () => {
  const now = new Date("2026-10-16T12:00:00Z")
  const within = slaState("2026-10-16T02:00:00Z", 24, now)!
  assert.equal(within.breached, false)
  assert.equal(within.over_by_hours, null)
  const over = slaState("2026-10-15T00:00:00Z", 24, now)!
  assert.equal(over.breached, true)
  assert.equal(over.over_by_hours, 12)
  assert.equal(slaState(null, 24, now), null)
})

test("business hours count only Mon-Fri inside the working window", () => {
  // Fri 2026-10-16 17:00 -> Mon 2026-10-19 10:00: 1h Friday + 1h Monday
  assert.equal(businessHoursBetween("2026-10-16T17:00:00Z", new Date("2026-10-19T10:00:00Z")), 2)
  assert.equal(businessHoursBetween("2026-10-17T10:00:00Z", new Date("2026-10-18T10:00:00Z")), 0)
  assert.equal(businessHoursBetween("2026-10-16T08:00:00Z", new Date("2026-10-16T13:00:00Z")), 4)
  const kyc = slaState("2026-10-16T08:00:00Z", 4, new Date("2026-10-16T15:00:00Z"), { business: true })!
  assert.equal(kyc.waited_hours, 6)
  assert.equal(kyc.over_by_hours, 2)
})

test("claim results: ok, conflict with the owner (409), not found (404)", () => {
  assert.deepEqual(claimOutcome({ ok: true, owner: "a", claimed_at: "t" }), { owner: "a", claimed_at: "t" })
  assert.deepEqual(claimOutcome({ ok: true, owner: null }), { owner: null, claimed_at: null })
  assert.throws(() => claimOutcome({ ok: false, code: "CLAIMED", owner: "other" }), (e: any) => e instanceof MerchantError && e.status === 409 && e.code === "CLAIMED_BY_OTHER" && e.details?.owner === "other")
  assert.throws(() => claimOutcome({ ok: false, code: "NOT_FOUND" }), (e: any) => e.status === 404)
})

test("rejection templates: the eight from the decisions guide, 'other' needs a message", () => {
  assert.deepEqual(DEFAULT_LISTING_REASONS.map((t) => t.key), ["prohibited_item", "unclear_photos", "wrong_category", "missing_information", "misleading", "contact_details", "duplicate", "other"])
  const photos = DEFAULT_LISTING_REASONS[1]
  assert.equal(buildReviewNote(photos, ""), photos.text)
  assert.equal(buildReviewNote(photos, "  Photo 2 is blurry. "), `${photos.text}\n\nPhoto 2 is blurry.`)
  assert.equal(buildReviewNote({ ...photos, translations: { ru: "Фото нечёткие." } }, "", "ru"), "Фото нечёткие.")
  const other = DEFAULT_LISTING_REASONS[7]
  assert.throws(() => buildReviewNote(other, ""), (e: any) => e.code === "REASON_REQUIRED" && e.status === 422)
  assert.equal(buildReviewNote(other, "Please add a product label."), "Please add a product label.")
})

test("seller listing alert renders approved and rejected in every language", () => {
  for (const l of ALERT_LANGS) {
    const ok = renderAlert("listing_review", { status: "approved", title: "Jollof", productId: "p1" }, { lang: l, merchantName: "Mama T", portalUrl: "https://seller.ciuna.com/" })
    const no = renderAlert("listing_review", { status: "rejected", title: "Jollof", note: "Photos unclear.", productId: "p1" }, { lang: l, merchantName: "Mama T", portalUrl: "https://seller.ciuna.com/" })
    assert.ok(ok.body.includes("Jollof"), l)
    assert.ok(no.body.includes("Photos unclear."), l)
    assert.notEqual(ok.title, no.title, l)
    assert.equal(no.url, "https://seller.ciuna.com/catalog/p1")
    assert.ok(!/\{\w+\}/.test(ok.text + no.text), `${l} placeholder`)
  }
})

test("queues are scoped by permission", () => {
  assert.deepEqual(visibleQueues("support").sort(), ["kyc", "support", "transactions"])
  assert.deepEqual(visibleQueues("finance").sort(), ["kyc", "payouts", "support", "transactions"])
  assert.ok(visibleQueues("ops").includes("listings") && visibleQueues("ops").includes("merchants") && !visibleQueues("ops").includes("payouts"))
  assert.deepEqual(visibleQueues("compliance").sort(), ["kyc", "merchants", "support", "transactions"])
  assert.equal(visibleQueues("super_admin").length, Object.keys(QUEUE_PERMISSION).length)
})

test("search needs 2+ characters, strips filter syntax, and is permission-filtered", () => {
  assert.equal(cleanSearch("a"), null)
  assert.equal(cleanSearch(" % , "), null)
  assert.equal(cleanSearch("Mama%,(T)"), "Mama T")
  assert.equal(cleanSearch("x".repeat(200))!.length, 60)
  assert.deepEqual(searchKinds("support"), ["merchant", "order"])
  assert.deepEqual(searchKinds("finance"), ["merchant", "order", "payout"])
  assert.deepEqual(searchKinds("compliance"), ["merchant"])
})

test("saved views validate scope, name and filters", () => {
  assert.deepEqual(validateView({ scope: "merchants", name: " Mine ", filters: { tab: "in_review", mine: true, q: "", n: 3 } }), { scope: "merchants", name: "Mine", filters: { tab: "in_review", mine: true, n: 3 } })
  assert.throws(() => validateView({ scope: "users", name: "x", filters: {} }), (e: any) => e.code === "VIEW_SCOPE_INVALID")
  assert.throws(() => validateView({ scope: "audit", name: "", filters: {} }), (e: any) => e.code === "VIEW_NAME_INVALID")
  assert.throws(() => validateView({ scope: "audit", name: "x", filters: { a: { b: 1 } } }), (e: any) => e.code === "VIEW_FILTERS_INVALID")
  assert.throws(() => validateView({ scope: "audit", name: "x", filters: { "Bad Key": "1" } }), (e: any) => e.code === "VIEW_FILTERS_INVALID")
  assert.throws(() => validateView({ scope: "audit", name: "x", filters: [] }), (e: any) => e.code === "VIEW_FILTERS_INVALID")
})

test("audit permission: finance, ops, compliance and super admin read it; support does not", () => {
  for (const r of ["finance", "ops", "compliance", "super_admin"]) assert.equal(adminCan(r, "audit.read"), true, r)
  assert.equal(adminCan("support", "audit.read"), false)
})

test("audit date range is inclusive of the end day", () => {
  assert.deepEqual(auditRange("2026-10-01", "2026-10-02"), { gte: "2026-10-01T00:00:00.000Z", lt: "2026-10-03T00:00:00.000Z" })
  assert.deepEqual(auditRange(null, "nonsense"), { gte: null, lt: null })
})

test("CSV export quotes, escapes and neutralises formulas", () => {
  assert.equal(csvCell('a,"b"'), '"a,""b"""')
  assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)")
  assert.equal(csvCell({ x: 1 }), '"{""x"":1}"')
  assert.equal(csvCell(null), "")
  const csv = auditCsv([{ id: 7, created_at: "2026-10-16T10:00:00Z", actor_kind: "admin", actor_id: "u1", actor_role: "ops", actor_name: "Ada, Lovelace", actor_email: "ada@x.com", merchant_id: "m1", merchant_name: "Mama T", action: "merchant.approve", entity_type: "merchant", entity_id: "m1", details: { reason: "ok" } }])
  const [head, row] = csv.trim().split("\n")
  assert.equal(head, AUDIT_CSV_HEADER.join(","))
  assert.ok(row.includes('"Ada, Lovelace"') && row.includes("Mama T") && row.includes("merchant.approve"))
})
