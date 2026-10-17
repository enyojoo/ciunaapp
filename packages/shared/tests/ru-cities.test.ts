import assert from "node:assert/strict"
import { test } from "node:test"
import { RU_CITIES, normalizeRuCity, sameCity, searchRuCities, ruCityLabel } from "../src/geo/ru-cities"

test("every city is listed once, with both names", () => {
  assert.equal(new Set(RU_CITIES.map((c) => c.en)).size, RU_CITIES.length)
  assert.ok(RU_CITIES.every((c) => c.en && c.ru))
})

test("any spelling of a city normalises to its English name", () => {
  assert.equal(normalizeRuCity("moscow"), "Moscow")
  assert.equal(normalizeRuCity("Москва"), "Moscow")
  assert.equal(normalizeRuCity("Saint-Petersburg"), "Saint Petersburg")
  assert.equal(normalizeRuCity("Санкт-Петербург"), "Saint Petersburg")
  assert.equal(normalizeRuCity("Atlantis"), null)
})

test("same city across spellings, and unknown text compares as typed", () => {
  assert.ok(sameCity("Moscow", "Москва"))
  assert.ok(!sameCity("Moscow", "Kazan"))
  assert.ok(sameCity("Smallville", "smallville "))
})

test("search matches either language; labels follow the app language", () => {
  assert.deepEqual(searchRuCities("казан").map((c) => c.en), ["Kazan"])
  assert.deepEqual(searchRuCities("nizh").map((c) => c.en), ["Nizhny Novgorod"])
  assert.ok(RU_CITIES.every((c) => c.en.length <= 16))
  assert.equal(ruCityLabel("Moscow", "ru"), "Москва")
  assert.equal(ruCityLabel("Moscow", "fr"), "Moscow")
})
