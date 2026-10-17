import assert from "node:assert/strict"
import { test } from "node:test"
import { cleanCredentials, cleanYears } from "../../lib/merchant/credentials"

const code = (fn: () => unknown) => { try { fn() } catch (e: any) { return e.code } return null }

test("credentials are trimmed and optional parts dropped", () => {
  assert.deepEqual(cleanCredentials([{ title: "  MSc Psychology ", issuer: " ", year: "2018" }, { title: "CPA", issuer: "AICPA" }], 2026), [{ title: "MSc Psychology", year: 2018 }, { title: "CPA", issuer: "AICPA" }])
  assert.deepEqual(cleanCredentials([]), [])
})

test("bad credentials are refused with a clear code", () => {
  assert.equal(code(() => cleanCredentials("x")), "CREDENTIALS_INVALID")
  assert.equal(code(() => cleanCredentials(Array.from({ length: 11 }, () => ({ title: "a" })))), "CREDENTIALS_TOO_MANY")
  assert.equal(code(() => cleanCredentials([{ title: " " }])), "CREDENTIAL_TITLE_INVALID")
  assert.equal(code(() => cleanCredentials([{ title: "x".repeat(121) }])), "CREDENTIAL_TITLE_INVALID")
  assert.equal(code(() => cleanCredentials([{ title: "a", year: 2090 }], 2026)), "CREDENTIAL_YEAR_INVALID")
  assert.equal(code(() => cleanCredentials([{ title: "a", year: 1900 }], 2026)), "CREDENTIAL_YEAR_INVALID")
})

test("years of experience: empty clears it, otherwise 0 to 80", () => {
  assert.equal(cleanYears(""), null)
  assert.equal(cleanYears("12"), 12)
  assert.equal(code(() => cleanYears(81)), "YEARS_INVALID")
  assert.equal(code(() => cleanYears(1.5)), "YEARS_INVALID")
})
