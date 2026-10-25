import test from "node:test"
import assert from "node:assert/strict"
import { hubServiceLineTileCopy } from "../src/hub/service-lines"

const line = { slug: "food", title: "Food", short_description: "Have all your cravings" } as Parameters<typeof hubServiceLineTileCopy>[0]
const ru: Record<string, string> = { "hub.serviceLineTiles.food.title": "Еда", "hub.serviceLineTiles.food.shortDescription": "Всё, на что захотите" }
const t = (key: string, o?: { defaultValue?: string }) => ru[key] ?? (o?.defaultValue === "" ? key : (o?.defaultValue ?? key))

test("English shows the Office copy from the database", () => {
  assert.deepEqual(hubServiceLineTileCopy(line, t, "en"), { title: "Food", shortDescription: "Have all your cravings" })
})

test("other languages show the translated tile copy", () => {
  assert.deepEqual(hubServiceLineTileCopy(line, t, "ru"), { title: "Еда", shortDescription: "Всё, на что захотите" })
})

test("a missing translation falls back to the database copy", () => {
  const other = { ...line, slug: "gift-packs", title: "Gift packs", short_description: "Send gifts" } as typeof line
  assert.deepEqual(hubServiceLineTileCopy(other, t, "ru"), { title: "Gift packs", shortDescription: "Send gifts" })
})
