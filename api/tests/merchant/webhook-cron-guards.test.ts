import test from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const API = join(__dirname, "../../app/api")

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? routes(p) : name === "route.ts" ? [p] : []
  })
}

test("every cron route checks a shared secret", () => {
  const bad = routes(join(API, "cron")).filter((f) => !/SECRET|timingSafeEqual/.test(readFileSync(f, "utf8")))
  assert.deepEqual(bad, [])
})

test("every webhook verifies its caller (signature, secret, or re-fetch from the provider)", () => {
  const bad = routes(join(API, "webhooks")).filter((f) => !/signature|secret|timingSafeEqual|getYooKassaPayment/i.test(readFileSync(f, "utf8")))
  assert.deepEqual(bad, [])
})

test("every cron route sends a heartbeat when it succeeds", () => {
  const bad = routes(join(API, "cron")).filter((f) => !readFileSync(f, "utf8").includes("pingHeartbeat("))
  assert.deepEqual(bad, [])
})
