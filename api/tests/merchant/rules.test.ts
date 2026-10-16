import assert from "node:assert/strict"
import { test } from "node:test"
import { can, ROLE_PERMISSIONS } from "../../lib/merchant/permissions"
import { canSelfTransition } from "../../lib/merchant/status"
import { adminCan, normalizeAdminRole } from "../../lib/admin-roles"
import { slugify, withSuffix } from "../../lib/merchant/slug"
import { pathBelongsTo } from "../../lib/merchant/storage"
import { pickEditable } from "../../lib/merchant/service"
import { MerchantError } from "../../lib/merchant/errors"

const merchant: any = { id: "m1", languages: ["en", "ru"], default_language: "en" }

test("roles: owner can do everything, staff cannot touch money or team", () => {
  assert.equal(ROLE_PERMISSIONS.owner.size, 9)
  assert.ok(can("staff", "orders"))
  assert.ok(!can("staff", "earnings"))
  assert.ok(!can("staff", "team"))
  assert.ok(can("finance", "payouts"))
  assert.ok(!can("finance", "catalog"))
  assert.ok(!can("manager", "payouts"))
  assert.ok(!can("manager", "team"))
})

test("merchant self transitions", () => {
  assert.ok(canSelfTransition("draft", "in_review"))
  assert.ok(canSelfTransition("rejected", "in_review"))
  assert.ok(canSelfTransition("live", "paused"))
  assert.ok(canSelfTransition("paused", "live"))
  assert.ok(!canSelfTransition("draft", "live"))
  assert.ok(!canSelfTransition("in_review", "live"))
  assert.ok(!canSelfTransition("suspended", "live"))
})

test("admin roles: legacy admin acts as ops; finance cannot review merchants", () => {
  assert.equal(normalizeAdminRole("admin"), "ops")
  assert.ok(adminCan("admin", "merchants.review"))
  assert.ok(!adminCan("admin", "finance.manage"))
  assert.ok(adminCan("super_admin", "roles.manage"))
  assert.ok(!adminCan("finance", "merchants.review"))
  assert.ok(adminCan("compliance", "kyb.manage"))
  assert.ok(!adminCan("support", "merchants.review"))
})

test("slugs are ascii and bounded; collisions get a suffix", () => {
  assert.equal(slugify("Mama T's Kitchen — Москва"), "mama-t-s-kitchen")
  assert.equal(slugify("   "), "")
  assert.equal(withSuffix("shop", 0), "shop")
  assert.match(withSuffix("shop", 1), /^shop-[a-z0-9]{1,4}$/)
  assert.ok(slugify("x".repeat(200)).length <= 48)
})

test("uploads must stay inside the merchant folder", () => {
  assert.ok(pathBelongsTo("m1", "m1/documents/a.pdf"))
  assert.ok(!pathBelongsTo("m1", "m2/documents/a.pdf"))
  assert.ok(!pathBelongsTo("m1", "m1/../m2/a.pdf"))
})

test("profile patch validates languages, currency, urls and default language", () => {
  const ok = pickEditable({ display_name: "  Mama T  ", languages: ["en", "ru", "zh"], default_currency: "rub", description: { en: "hello", xx: "nope" } }, merchant)
  assert.equal(ok.display_name, "Mama T")
  assert.deepEqual(ok.languages, ["en", "ru", "zh"])
  assert.equal(ok.default_currency, "RUB")
  assert.deepEqual(ok.description, { en: "hello" })
  const bad = (body: any, code: string) => assert.throws(() => pickEditable(body, merchant), (e: any) => e instanceof MerchantError && e.code === code)
  bad({ languages: ["en", "de"] }, "LANGUAGE_INVALID")
  bad({ default_currency: "XXX" }, "CURRENCY_INVALID")
  bad({ logo_url: "http://insecure.example/x.png" }, "URL_INVALID")
  bad({ contact_email: "nope" }, "EMAIL_INVALID")
  bad({ display_name: "x" }, "DISPLAY_NAME_INVALID")
  bad({ languages: ["ru"] }, "DEFAULT_LANGUAGE_NOT_IN_LANGUAGES")
})
