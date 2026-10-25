import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const API = join(__dirname, "../../app/api")

// Surfaces that must be rate limited (docs/build-plan/launch-readiness.md, section 5).
const LIMITED = [
  "auth/login", "auth/admin/login", "auth/register", "auth/forgot-password", "auth/verify-reset-otp", "auth/resend-verification",
  "hub/search", "hub/favorites", "hub/cart/items", "hub/orders/[id]/messages", "hub/orders/[id]/review", "hub/checkout",
  "merchant/messages/[orderId]", "merchant/uploads", "merchant/documents",
  "send/quotes", "send/transfers", "kyc/submissions", "assistant/requests", "support/requests",
]

test("rate limits are present on every listed surface", () => {
  const missing = LIMITED.filter((r) => !/limitOrResponse|rateLimit\(|marketplaceRoute|checkoutRoute|limit:/.test(readFileSync(join(API, r, "route.ts"), "utf8")))
  assert.deepEqual(missing, [])
})
