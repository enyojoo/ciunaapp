import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Installed apps keep calling the API for months. A field in this list may be added to but never removed or renamed
// (docs/build-plan/api-and-data.md, section 4). To retire one, ship a replacement first and wait for old builds to age out.
const PUBLIC_FLAG_FIELDS = ["maintenanceMode", "registrationEnabled", "emailVerificationRequired", "yookassaEnabled"]

const read = (p: string) => readFileSync(join(__dirname, "../..", p), "utf8")

test("public platform flags keep every field shipped apps read", () => {
  const type = read("lib/platform-settings-server.ts").match(/export type PublicPlatformFlags = \{([\s\S]*?)\n\}/)?.[1] ?? ""
  for (const f of PUBLIC_FLAG_FIELDS) assert.match(type, new RegExp(`\\b${f}\\b`), `PublicPlatformFlags lost ${f}`)
})

test("the flags route answers with every field even when the database is down", () => {
  const route = read("app/api/platform/public-flags/route.ts")
  for (const f of PUBLIC_FLAG_FIELDS) assert.match(route, new RegExp(`\\b${f}\\b`), `fallback response lost ${f}`)
})
