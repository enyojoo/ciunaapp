import test from "node:test"
import assert from "node:assert/strict"
import { legacyAdminPermission, adminCanLegacy } from "../../lib/admin-roles"

test("legacy admin routes map to permissions by path and method", () => {
  assert.equal(legacyAdminPermission("/api/admin/exchange-rates", "PUT"), "rates.manage")
  assert.equal(legacyAdminPermission("/api/admin/exchange-rates", "GET"), null)
  assert.equal(legacyAdminPermission("/api/admin/referral-payouts/1/complete", "POST"), "finance.manage")
  assert.equal(legacyAdminPermission("/api/admin/settings", "PUT"), "settings.manage")
  assert.equal(legacyAdminPermission("/api/admin/users", "GET"), "users.read")
  assert.equal(legacyAdminPermission("/api/admin/users", "PATCH"), "users.manage")
  assert.equal(legacyAdminPermission("/api/admin/merchants", "POST"), null)
})

test("roles: support cannot change rates, settings or payouts; finance can change rates; legacy admin keeps access", () => {
  assert.equal(adminCanLegacy("support", "rates.manage"), false)
  assert.equal(adminCanLegacy("support", "settings.manage"), false)
  assert.equal(adminCanLegacy("support", "finance.manage"), false)
  assert.equal(adminCanLegacy("finance", "rates.manage"), true)
  assert.equal(adminCanLegacy("ops", "rates.manage"), false)
  assert.equal(adminCanLegacy("compliance", "users.manage"), true)
  assert.equal(adminCanLegacy("super_admin", "settings.manage"), true)
  assert.equal(adminCanLegacy("admin", "rates.manage"), true)
})
