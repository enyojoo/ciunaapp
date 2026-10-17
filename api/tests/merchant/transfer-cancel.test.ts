import assert from "node:assert/strict"
import { test } from "node:test"
import { interpretCancel } from "../../lib/transfer-cancel"

const code = (r: unknown) => { try { interpretCancel(r) } catch (e: any) { return [e.code, e.status] } return null }

test("a successful cancel, including a repeat, passes", () => {
  assert.equal(code({ ok: true }), null)
  assert.equal(code({ ok: true, already: true }), null)
})

test("not found is 404, paid or past cancelling is 409, anything else 400", () => {
  assert.deepEqual(code({ ok: false, error: "TRANSFER_NOT_FOUND" }), ["TRANSFER_NOT_FOUND", 404])
  assert.deepEqual(code({ ok: false, error: "TRANSFER_NOT_CANCELLABLE" }), ["TRANSFER_NOT_CANCELLABLE", 409])
  assert.deepEqual(code({ ok: false, error: "NOT_A_TRANSFER" }), ["NOT_A_TRANSFER", 400])
  assert.deepEqual(code(null), ["TRANSFER_CANCEL_FAILED", 400])
})
