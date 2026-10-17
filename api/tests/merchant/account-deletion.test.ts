import assert from "node:assert/strict"
import { test } from "node:test"
import { interpretRequest } from "../../lib/account-deletion"
import { MerchantError } from "../../lib/merchant/errors"

test("a clean request returns the removal date", () => {
  assert.deepEqual(interpretRequest({ ok: true, purge_after: "2026-11-18T00:00:00Z" }), { purgeAfter: "2026-11-18T00:00:00Z" })
})

test("work in progress is reported as DELETION_BLOCKED with the counts", () => {
  try {
    interpretRequest({ ok: false, blockers: { orders: 1, transfers: 0, refunds: 0 } })
    assert.fail("should throw")
  } catch (e) {
    assert.ok(e instanceof MerchantError)
    assert.equal(e.code, "DELETION_BLOCKED")
    assert.equal(e.status, 409)
    assert.deepEqual(e.details, { blockers: { orders: 1, transfers: 0, refunds: 0 } })
  }
})

test("an unknown user is a plain error", () => {
  assert.throws(() => interpretRequest({ ok: false, error: "USER_NOT_FOUND" }), (e: any) => e.code === "USER_NOT_FOUND")
  assert.throws(() => interpretRequest(null), (e: any) => e.code === "DELETION_FAILED")
})
