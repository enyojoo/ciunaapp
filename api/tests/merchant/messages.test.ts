import assert from "node:assert/strict"
import { test } from "node:test"
import { chatAvailable, chatClosed, cleanBody, cleanLanguage, firstName, parseAfter, preview, sendError } from "../../lib/merchant/messages"

test("body is trimmed and validated", () => {
  assert.equal(cleanBody("  hello  \n"), "hello")
  assert.throws(() => cleanBody("   "), { code: "MESSAGE_EMPTY" })
  assert.throws(() => cleanBody(undefined), { code: "MESSAGE_EMPTY" })
  assert.throws(() => cleanBody(42), { code: "MESSAGE_EMPTY" })
  assert.equal(cleanBody("a".repeat(2000)).length, 2000)
  assert.throws(() => cleanBody("a".repeat(2001)), { code: "MESSAGE_TOO_LONG" })
  assert.throws(() => cleanBody(" " + "a".repeat(2001) + " "), { code: "MESSAGE_TOO_LONG" })
})

test("language falls back to en", () => {
  assert.equal(cleanLanguage("RU"), "ru")
  assert.equal(cleanLanguage("pt-BR"), "pt-br")
  assert.equal(cleanLanguage("<script>"), "en")
  assert.equal(cleanLanguage(null), "en")
})

test("preview is one line, at most 120 characters", () => {
  assert.equal(preview("Hi\n\nthere   friend"), "Hi there friend")
  const p = preview("x".repeat(300))
  assert.equal([...p].length, 120)
  assert.ok(p.endsWith("…"))
  assert.equal(preview("y".repeat(120)), "y".repeat(120))
})

test("sellers only see the first name", () => {
  assert.equal(firstName("Amina Okafor"), "Amina")
  assert.equal(firstName("  Amina  "), "Amina")
  assert.equal(firstName(""), null)
  assert.equal(firstName(null), null)
})

test("chat closes 14 days after fulfilment or cancellation", () => {
  const now = Date.parse("2026-10-30T12:00:00Z")
  const day = 86_400_000
  const at = (d: number) => new Date(now - d * day).toISOString()
  assert.equal(chatClosed({ fulfillment_state: "fulfilled", updated_at: at(13.9) }, now), false)
  assert.equal(chatClosed({ fulfillment_state: "fulfilled", updated_at: at(14.1) }, now), true)
  assert.equal(chatClosed({ fulfillment_state: "cancelled", updated_at: at(20) }, now), true)
  assert.equal(chatClosed({ fulfillment_state: "in_progress", updated_at: at(60) }, now), false)
})

test("chat needs a merchant and a paid order", () => {
  assert.equal(chatAvailable({ merchant_id: "m", payment_state: "paid" }), true)
  assert.equal(chatAvailable({ merchant_id: "m", payment_state: "refunded" }), true)
  assert.equal(chatAvailable({ merchant_id: "m", payment_state: "awaiting_payment" }), false)
  assert.equal(chatAvailable({ merchant_id: null, payment_state: "paid" }), false)
})

test("database errors map to API codes and unknown ones are hidden", () => {
  assert.equal(sendError({ message: "RATE_LIMITED" }).status, 429)
  assert.equal(sendError({ message: "CHAT_CLOSED" }).code, "CHAT_CLOSED")
  const e = sendError({ message: "relation secret failed" })
  assert.equal(e.code, "DATABASE_ERROR")
  assert.equal(parseAfter("12"), 12)
  assert.equal(parseAfter("-3"), 0)
  assert.equal(parseAfter("abc"), 0)
})
