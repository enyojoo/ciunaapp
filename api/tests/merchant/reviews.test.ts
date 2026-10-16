import assert from "node:assert/strict"
import { test } from "node:test"
import {
  buildSummary, eligibility, firstName, nameWithInitial, replyEditable, replyEditableUntil, reviewEditable, reviewErrorStatus, reviewWindowOpen,
  summaryFromRatings, toPublicReview, validateRating, parsePaging,
} from "../../lib/merchant/reviews"

const NOW = Date.parse("2026-10-16T12:00:00Z")
const ago = (ms: number) => new Date(NOW - ms).toISOString()
const H = 3_600_000
const D = 24 * H

test("rating validation accepts whole numbers 1 to 5 only", () => {
  for (const ok of [1, 2, 3, 4, 5, "4"]) assert.equal(validateRating(ok), Number(ok))
  for (const bad of [0, 6, 4.5, -1, "", "abc", null, undefined, NaN, true, [3]]) assert.equal(validateRating(bad as any), null)
})

test("review window is 30 days from fulfilment", () => {
  assert.ok(reviewWindowOpen(ago(29 * D), NOW))
  assert.ok(reviewWindowOpen(ago(30 * D), NOW))
  assert.ok(!reviewWindowOpen(ago(30 * D + 1000), NOW))
  assert.ok(!reviewWindowOpen("not a date", NOW))
})

test("edit windows: 48 hours for the review, 24 hours for the reply", () => {
  assert.ok(reviewEditable(ago(47 * H), NOW))
  assert.ok(!reviewEditable(ago(49 * H), NOW))
  assert.ok(replyEditable(null, NOW))
  assert.ok(replyEditable(ago(23 * H), NOW))
  assert.ok(!replyEditable(ago(25 * H), NOW))
})

test("summary builder: average, count and distribution", () => {
  const s = buildSummary({ 1: 0, 2: 1, 3: 0, 4: 1, 5: 2 })
  assert.equal(s.count, 4)
  assert.equal(s.avg, 4)
  assert.deepEqual(s.distribution, { 1: 0, 2: 1, 3: 0, 4: 1, 5: 2 })
  assert.equal(buildSummary({ 4: 2, 5: 1 }).avg, 4.33)
  assert.deepEqual(buildSummary(null), { avg: null, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  assert.equal(buildSummary({ 1: -5, 2: "x", 5: 2.9 }).count, 2) // junk is ignored, fractions floored
  assert.deepEqual(summaryFromRatings([5, 5, 1, 9, 0]), buildSummary({ 1: 1, 5: 2 }))
})

test("name masking shows a first name only", () => {
  assert.equal(firstName("Amara Okafor"), "Amara")
  assert.equal(firstName("  Amara  "), "Amara")
  assert.equal(firstName("amara@example.com"), null)
  assert.equal(firstName("", "Customer"), "Customer")
  assert.equal(firstName(null), null)
  assert.equal(nameWithInitial("Amara", "okafor"), "Amara O.")
  assert.equal(nameWithInitial("Amara", ""), "Amara")
})

test("public review never leaks email, last name or user id", () => {
  const out = toPublicReview({
    id: "r1", rating: 5, body: "Lovely", language: "en", created_at: "x", reply: null, reply_at: null,
    user_id: "u1", users: { first_name: "Amara Okafor", last_name: "Okafor", email: "a@b.c" },
  })
  assert.equal(out.customer_first_name, "Amara")
  assert.deepEqual(Object.keys(out).sort(), ["body", "created_at", "customer_first_name", "id", "language", "rating", "reply", "reply_at"])
  assert.equal(toPublicReview({ id: "r2", rating: 3, users: [{ first_name: "Li" }] }).customer_first_name, "Li")
})

test("eligibility mirrors the database rules", () => {
  const order = { user_id: "u1", fulfillment_state: "fulfilled", merchant_id: "m1", updated_at: ago(2 * D) }
  assert.deepEqual(eligibility(order, "u1", null, NOW), { canReview: true, canEdit: false, reason: null })
  assert.equal(eligibility(order, "u2", null, NOW).reason, "REVIEW_NOT_ALLOWED")
  assert.equal(eligibility({ ...order, fulfillment_state: "accepted" }, "u1", null, NOW).reason, "REVIEW_NOT_ALLOWED")
  assert.equal(eligibility({ ...order, updated_at: ago(31 * D) }, "u1", null, NOW).reason, "REVIEW_WINDOW_CLOSED")
  assert.deepEqual(eligibility(order, "u1", { created_at: ago(H) }, NOW), { canReview: true, canEdit: true, reason: null })
  assert.deepEqual(eligibility(order, "u1", { created_at: ago(50 * H) }, NOW), { canReview: false, canEdit: false, reason: "ALREADY_REVIEWED" })
})

test("error codes map to stable statuses; paging is clamped", () => {
  assert.equal(reviewErrorStatus("REVIEW_NOT_ALLOWED"), 403)
  assert.equal(reviewErrorStatus("ALREADY_REVIEWED"), 409)
  assert.equal(reviewErrorStatus("RATING_INVALID"), 422)
  assert.equal(reviewErrorStatus("REVIEW_WINDOW_CLOSED"), 409)
  assert.equal(reviewErrorStatus("SOMETHING_ELSE"), 400)
  assert.deepEqual(parsePaging(new URLSearchParams("limit=999&offset=-4")), { limit: 50, offset: 0 })
  assert.deepEqual(parsePaging(new URLSearchParams("")), { limit: 20, offset: 0 })
})

test("reply edit deadline is 24 hours after the reply", () => {
  assert.equal(replyEditableUntil(null), null)
  assert.equal(replyEditableUntil("2026-10-16T10:00:00Z"), "2026-10-17T10:00:00.000Z")
  assert.equal(replyEditableUntil("not a date"), null)
})
