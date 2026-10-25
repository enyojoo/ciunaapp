import test from "node:test"
import assert from "node:assert/strict"
import { pickSupportedLanguage } from "../src/locale/pick-language"

const SUPPORTED = ["en", "ru", "fr", "es", "zh", "pt"] as const
const pick = (...tags: string[]) => pickSupportedLanguage(tags.map((languageTag) => ({ languageTag })), SUPPORTED, "en")

test("regional and script variants map to their language", () => {
  assert.equal(pick("zh-Hans-CN"), "zh")
  assert.equal(pick("zh-Hant-TW"), "zh")
  assert.equal(pick("pt-BR"), "pt")
  assert.equal(pick("pt-PT"), "pt")
  assert.equal(pick("fr-CA"), "fr")
  assert.equal(pick("es_MX"), "es")
})

test("the first supported language in the preference list wins", () => {
  assert.equal(pick("de-DE", "zh-CN", "en-US"), "zh")
  assert.equal(pick("ru-RU", "en-US"), "ru")
})

test("languageCode is preferred and unsupported lists fall back to English", () => {
  assert.equal(pickSupportedLanguage([{ languageCode: "RU", languageTag: "en-US" }], SUPPORTED, "en"), "ru")
  assert.equal(pick("de-DE", "ja-JP"), "en")
  assert.equal(pickSupportedLanguage([], SUPPORTED, "en"), "en")
})
