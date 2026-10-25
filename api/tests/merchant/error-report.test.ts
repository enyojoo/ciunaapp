import test from "node:test"
import assert from "node:assert/strict"
import { scrub } from "../../lib/error-report"

test("scrub removes emails, tokens, card numbers, phones and secrets", () => {
  const out = scrub("fail for mama@example.com Bearer abc.def.ghi card 4111 1111 1111 1111 call +7 999 123 45 67 api_key=sk_live_123 token: xyz")
  assert.ok(!out.includes("mama@example.com"))
  assert.ok(!out.includes("abc.def.ghi"))
  assert.ok(!out.includes("4111"))
  assert.ok(!out.includes("999 123"))
  assert.ok(!out.includes("sk_live_123"))
  assert.ok(!out.includes("xyz"))
})

test("scrub keeps ordinary error text readable", () => {
  assert.equal(scrub("Cannot read properties of undefined (reading 'id')"), "Cannot read properties of undefined (reading 'id')")
})
