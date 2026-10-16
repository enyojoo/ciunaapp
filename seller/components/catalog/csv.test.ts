import { test } from "node:test"
import assert from "node:assert/strict"
import { parseCsv, toCsv, mapImportRows, templateCsv } from "./csv.ts"

test("parses simple rows and CRLF", () => {
  assert.deepEqual(parseCsv("a,b\r\nc,d\r\n"), [["a", "b"], ["c", "d"]])
})
test("handles quotes, commas and escaped quotes", () => {
  assert.deepEqual(parseCsv('"a,b","say ""hi""",c\n'), [["a,b", 'say "hi"', "c"]])
})
test("keeps newlines inside quotes", () => {
  assert.deepEqual(parseCsv('"line1\nline2",x'), [["line1\nline2", "x"]])
})
test("strips BOM, keeps empty fields, no trailing newline", () => {
  assert.deepEqual(parseCsv("﻿a,,c\n,,"), [["a", "", "c"], ["", "", ""]])
})
test("skips blank lines", () => {
  assert.deepEqual(parseCsv("a\n\nb\n"), [["a"], ["b"]])
})
test("round trips through toCsv", () => {
  const rows = [["x,y", 'q"r', "plain"], ["a\nb", "", "z"]]
  assert.deepEqual(parseCsv(toCsv(rows)), rows)
})
test("maps and validates product rows", () => {
  const t = parseCsv(templateCsv("USD", "food") + "Pizza,,Pasta,5,6,USD,,delivery\n,,Meals,0,,USD,-1,fly\n")
  const res = mapImportRows(t, { defaultCurrency: "USD", categories: ["Meals", "Snacks", "Drinks", "Other"] })
  assert.equal(res.rows.length, 4)
  assert.ok(res.rows[0].payload && res.rows[1].payload)
  assert.equal(res.rows[1].payload?.stock_quantity, null)
  assert.deepEqual(res.rows[2].errors, ["SALE_PRICE_TOO_HIGH", "CATEGORY_OUTSIDE_LINE"])
  assert.deepEqual(res.rows[3].errors, ["TITLE_REQUIRED", "PRICE_REQUIRED", "INVALID_STOCK", "FULFILLMENT_REQUIRED"])
})
test("caps at 200 rows", () => {
  const lines = ["title,list_price"]
  for (let i = 0; i < 250; i++) lines.push(`Item ${i},1`)
  const res = mapImportRows(parseCsv(lines.join("\n")), { defaultCurrency: "USD", categories: null })
  assert.equal(res.rows.length, 200)
  assert.equal(res.tooMany, true)
  assert.equal(res.total, 250)
})
