import assert from "node:assert/strict"
import { test } from "node:test"
import { cleanQuery, likePattern, matchesTranslations } from "../../lib/discovery"

test("query cleaning: trims, collapses spaces, needs 2+ chars, caps length", () => {
  assert.equal(cleanQuery("  jollof   rice "), "jollof rice")
  assert.equal(cleanQuery("a"), null)
  assert.equal(cleanQuery(null), null)
  assert.equal(cleanQuery("x".repeat(200))!.length, 60)
  assert.equal(cleanQuery("Ｊｏｌｌｏｆ"), "Jollof") // NFKC folds full-width
})

test("LIKE patterns escape wildcards and PostgREST syntax", () => {
  assert.equal(likePattern("100%"), "%100\\%%")
  assert.equal(likePattern("a_b"), "%a\\_b%")
  assert.equal(likePattern("a,b(c)"), "%a b c %")
})

test("translations are searchable", () => {
  assert.ok(matchesTranslations({ translations: { ru: { title: "Рис джолоф" } } }, "джолоф"))
  assert.ok(!matchesTranslations({ translations: {} }, "x"))
  assert.ok(!matchesTranslations({}, "x"))
})
