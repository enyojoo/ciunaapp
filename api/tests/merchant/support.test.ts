import assert from "node:assert/strict"
import { test } from "node:test"
import { adminCan } from "../../lib/admin-roles"
import { mapSupportError, validateBody, validateNewRequest } from "../../lib/support"

const code = (fn: () => unknown) => {
  try {
    fn()
  } catch (e: any) {
    return e.code as string
  }
  return null
}

test("messages are trimmed and limited to 4000 characters", () => {
  assert.equal(validateBody("  hello  "), "hello")
  assert.equal(code(() => validateBody("   ")), "MESSAGE_EMPTY")
  assert.equal(code(() => validateBody(undefined)), "MESSAGE_EMPTY")
  assert.equal(code(() => validateBody("a".repeat(4001))), "MESSAGE_TOO_LONG")
  assert.equal(validateBody("é".repeat(4000)).length, 4000) // characters, not bytes
})

test("a new request needs a known topic, a 3 to 120 character subject and a message", () => {
  const ok = validateNewRequest({ topic: "payment", subject: "  My payment is stuck ", body: "Please help", orderId: "11111111-1111-4111-8111-111111111111" })
  assert.deepEqual(ok, { topic: "payment", subject: "My payment is stuck", body: "Please help", orderId: "11111111-1111-4111-8111-111111111111" })
  assert.equal(validateNewRequest({ topic: "other", subject: "Hello", body: "x" }).orderId, null)
  assert.equal(code(() => validateNewRequest({ topic: "weather", subject: "Hello", body: "x" })), "SUPPORT_TOPIC_INVALID")
  assert.equal(code(() => validateNewRequest({ topic: "other", subject: "ab", body: "x" })), "SUPPORT_SUBJECT_INVALID")
  assert.equal(code(() => validateNewRequest({ topic: "other", subject: "a".repeat(121), body: "x" })), "SUPPORT_SUBJECT_INVALID")
  assert.equal(code(() => validateNewRequest({ topic: "other", subject: "Hello", body: "" })), "MESSAGE_EMPTY")
  assert.equal(code(() => validateNewRequest({ topic: "order", subject: "Hello", body: "x", orderId: "not-a-uuid" })), "SUPPORT_ORDER_NOT_FOUND")
})

test("database exceptions become clean errors with the right status", () => {
  const status = (message: string) => {
    try {
      mapSupportError({ message })
    } catch (e: any) {
      return [e.code, e.status]
    }
  }
  assert.deepEqual(status("SUPPORT_TOO_MANY_OPEN"), ["SUPPORT_TOO_MANY_OPEN", 409])
  assert.deepEqual(status("error: SUPPORT_NOT_FOUND detail"), ["SUPPORT_NOT_FOUND", 404])
  assert.deepEqual(status("SUPPORT_CLOSED"), ["SUPPORT_CLOSED", 409])
  assert.deepEqual(status("something else"), ["DATABASE_ERROR", 500]) // internals are never exposed
})

test("support staff can read and reply; finance and compliance can only read", () => {
  for (const role of ["support", "ops", "super_admin"]) {
    assert.equal(adminCan(role, "support.read"), true)
    assert.equal(adminCan(role, "support.manage"), true)
  }
  for (const role of ["finance", "compliance"]) {
    assert.equal(adminCan(role, "support.read"), true)
    assert.equal(adminCan(role, "support.manage"), false)
  }
})
