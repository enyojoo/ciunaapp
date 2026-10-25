import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { canMoveStatus, REFUNDABLE, RETRYABLE } from "../../lib/transaction-transitions"
import { adminCan } from "../../lib/admin-roles"

test("a transaction moves forward by hand, and a finished one is never edited", () => {
  assert.equal(canMoveStatus("pending", "processing"), true)
  assert.equal(canMoveStatus("processing", "completed"), true)
  assert.equal(canMoveStatus("pending", "completed"), false)
  for (const done of ["completed", "failed", "cancelled", "refunded"]) assert.equal(canMoveStatus(done, "processing"), false, done)
  assert.equal(canMoveStatus("completed", "completed"), true)
  assert.equal(canMoveStatus("converting", "completed"), true) // legacy state keeps old behaviour
})

test("retry starts from failed only; refund from money received or failed after payment", () => {
  assert.deepEqual([...RETRYABLE], ["failed"])
  assert.deepEqual([...REFUNDABLE].sort(), ["completed", "failed", "processing"])
})

test("refund needs finance, retry needs transactions, and support has neither", () => {
  assert.equal(adminCan("finance", "finance.manage"), true)
  assert.equal(adminCan("ops", "finance.manage"), false)
  assert.equal(adminCan("support", "transactions.manage"), false)
  assert.equal(adminCan("ops", "transactions.manage"), true)
  const root = join(__dirname, "../../app/api/admin/transactions/[id]")
  assert.match(readFileSync(join(root, "refund/route.ts"), "utf8"), /adminRoute\("finance\.manage"/)
  assert.match(readFileSync(join(root, "retry/route.ts"), "utf8"), /adminRoute\("transactions\.manage"/)
  for (const r of ["refund", "retry"]) assert.match(readFileSync(join(root, r, "route.ts"), "utf8"), /REASON_REQUIRED/)
})
