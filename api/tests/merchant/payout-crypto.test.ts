import test from "node:test"
import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import { decryptDetails, encryptDetails } from "../../lib/merchant/payout-crypto"

const env = process.env as Record<string, string | undefined>
const saved = { ...env }
const restore = () => {
  for (const k of ["MERCHANT_PAYOUT_KEY", "MARKETPLACE_TOKEN_KEY", "NODE_ENV"]) {
    if (saved[k] === undefined) delete env[k]
    else env[k] = saved[k]
  }
}

test("payout details round-trip and are bound to the merchant", () => {
  env.MERCHANT_PAYOUT_KEY = randomBytes(32).toString("base64")
  const sealed = encryptDetails({ phone: "+79990000000" }, "m1")
  assert.deepEqual(decryptDetails(sealed, "m1"), { phone: "+79990000000" })
  assert.throws(() => decryptDetails(sealed, "m2"))
  restore()
})

test("production refuses to fall back to the marketplace key", () => {
  delete env.MERCHANT_PAYOUT_KEY
  env.MARKETPLACE_TOKEN_KEY = randomBytes(32).toString("base64")
  env.NODE_ENV = "production"
  assert.throws(() => encryptDetails({ a: "b" }, "m1"), /PAYOUT_ENCRYPTION_UNAVAILABLE/)
  env.NODE_ENV = "development"
  assert.doesNotThrow(() => encryptDetails({ a: "b" }, "m1"))
  restore()
})
