import test from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { ADMIN_ROLE_PERMISSIONS, adminCan, legacyAdminPermission } from "../../lib/admin-roles"

const ROOT = join(__dirname, "../../app/api/admin")
const GUARDS = ["adminRoute(", "adminRawRoute(", "marketplaceRoute(", "requireAdmin(", "requireSuperAdmin("]
// getAdminUser alone is only safe when the route stops on null, as the session endpoint does.
const NULL_CHECKED = [join(ROOT, "me/route.ts")]

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? routes(p) : name === "route.ts" ? [p] : []
  })
}

test("every /api/admin route sits behind an admin guard", () => {
  const unguarded = routes(ROOT).filter((f) => {
    const src = readFileSync(f, "utf8")
    if (NULL_CHECKED.includes(f)) return !/if \(!admin\)/.test(src)
    return !GUARDS.some((g) => src.includes(g))
  })
  assert.deepEqual(unguarded, [])
})

test("no admin route reads a session without the request's cookies or token", () => {
  const bad = routes(ROOT).filter((f) => readFileSync(f, "utf8").includes("auth.getSession("))
  assert.deepEqual(bad, [])
})

test("role matrix: who may do what", () => {
  const can = (role: string, p: Parameters<typeof adminCan>[1]) => adminCan(role, p)
  assert.equal(can("support", "users.manage"), false)
  assert.equal(can("support", "users.read"), true)
  assert.equal(can("finance", "users.manage"), false)
  assert.equal(can("finance", "finance.manage"), true)
  assert.equal(can("compliance", "users.manage"), true)
  assert.equal(can("compliance", "finance.manage"), false)
  assert.equal(can("ops", "roles.manage"), false)
  assert.equal(can("support", "settings.manage"), false)
  for (const p of ADMIN_ROLE_PERMISSIONS.super_admin) assert.equal(can("super_admin", p), true)
})

test("legacy path rules cover the money and settings routes", () => {
  assert.equal(legacyAdminPermission("/api/admin/users/abc/status", "PATCH"), "users.manage")
  assert.equal(legacyAdminPermission("/api/admin/transactions/1/status", "PATCH"), "transactions.manage")
  assert.equal(legacyAdminPermission("/api/admin/referral-payouts/1/complete", "POST"), "finance.manage")
})

test("Office can assign every role in the matrix, and only those", async () => {
  const { ADMIN_ASSIGNABLE_ROLES, isAssignableAdminRole } = await import("../../lib/admin-roles")
  assert.deepEqual([...ADMIN_ASSIGNABLE_ROLES].sort(), Object.keys(ADMIN_ROLE_PERMISSIONS).sort())
  assert.equal(isAssignableAdminRole("ops"), true)
  assert.equal(isAssignableAdminRole("admin"), false)
  assert.equal(isAssignableAdminRole("root"), false)
})

test("admin write routes that change people or money write an audit entry", () => {
  const WRITES = [
    "users/[id]/status", "users/[id]/verification", "kyc", "admin-users", "admin-users/[id]",
    "transactions/[id]/status", "transactions/[id]/retry", "transactions/[id]/refund", "expert/profiles/[id]/credentials", "referral-payouts/[id]/complete", "referral-payouts/[id]/cancel", "exchange-rates",
  ]
  const missing = WRITES.filter((r) => !readFileSync(join(ROOT, r, "route.ts"), "utf8").includes("audit("))
  assert.deepEqual(missing, [])
})

test("no admin route carries on after a failed admin check", () => {
  const bad = routes(ROOT).filter((f) => /isAdmin\s*=\s*!!|don't fail|fallback which should work regardless/i.test(readFileSync(f, "utf8")))
  assert.deepEqual(bad, [])
})

test("document routes open files only for named permissions and for a short time", () => {
  for (const r of ["kyc/documents", "receipts/documents"]) {
    const src = readFileSync(join(ROOT, r, "route.ts"), "utf8")
    assert.match(src, /adminRoute\("/, `${r} must use adminRoute`)
    assert.match(src, /audit\(/, `${r} must audit each open`)
    assert.match(src, /createSignedUrl\(filePath, 300\)/, `${r} must sign for at most 5 minutes`)
  }
})
