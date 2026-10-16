import assert from "node:assert/strict"
import { test } from "node:test"
import { getCorsHeaders } from "../../lib/cors"

const req = (origin: string) => new Request("https://api.ciuna.com/api/merchant/me", { headers: { origin } }) as any

test("seller portal may call the API and send the acting-merchant header", () => {
  const h = getCorsHeaders(req("https://seller.ciuna.com"))
  assert.equal(h["Access-Control-Allow-Origin"], "https://seller.ciuna.com")
  assert.match(h["Access-Control-Allow-Headers"], /X-Merchant-Id/i)
  assert.match(h["Access-Control-Allow-Headers"], /Authorization/)
})

test("local seller and unknown origins", () => {
  assert.equal(getCorsHeaders(req("http://localhost:3003"))["Access-Control-Allow-Origin"], "http://localhost:3003")
  assert.equal(getCorsHeaders(req("https://evil.example"))["Access-Control-Allow-Origin"], undefined)
})
