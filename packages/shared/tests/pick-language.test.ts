import assert from "node:assert/strict"
import { test } from "node:test"
import { pickSupportedLanguage } from "../src/locale/pick-language"

const SUPPORTED = ["en", "ru", "fr", "es", "zh", "pt"] as const
const pick = (...tags: string[]) => pickSupportedLanguage(tags.map((t) => ({ languageTag: t, languageCode: t.split("-")[0] })), SUPPORTED, "en")

test("a Chinese device gets Chinese, whichever variant", () => {
  assert.equal(pick("zh-Hans-CN"), "zh")
  assert.equal(pick("zh-Hant-TW"), "zh")
  assert.equal(pick("zh-HK"), "zh")
})

test("regional variants map to their language", () => {
  assert.equal(pick("pt-BR"), "pt")
  assert.equal(pick("pt-PT"), "pt")
  assert.equal(pick("fr-CA"), "fr")
  assert.equal(pick("es-MX"), "es")
  assert.equal(pick("ru-RU"), "ru")
})

test("the first supported language in the list wins, not just the first entry", () => {
  assert.equal(pick("de-DE", "zh-Hans-CN", "en-US"), "zh")
  assert.equal(pick("ja-JP", "fr-FR"), "fr")
  assert.equal(pick("ru-RU", "en-US"), "ru")
})

test("nothing supported falls back to English; underscores and a missing languageCode are handled", () => {
  assert.equal(pick("de-DE", "ja-JP"), "en")
  assert.equal(pick(), "en")
  assert.equal(pickSupportedLanguage([{ languageTag: "zh_Hans_CN" }], SUPPORTED, "en"), "zh")
  assert.equal(pickSupportedLanguage([{ languageCode: "PT" }], SUPPORTED, "en"), "pt")
})
