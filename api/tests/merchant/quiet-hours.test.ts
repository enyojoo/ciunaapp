import assert from "node:assert/strict"
import { test } from "node:test"
import { inQuietHours, localHour, parseQuiet } from "../../lib/quiet-hours"

const at = (iso: string) => new Date(iso)

test("a window that wraps midnight holds pushes late and early", () => {
  const q = { start: 22, end: 7, tz: "UTC" }
  assert.equal(inQuietHours(at("2026-10-19T23:30:00Z"), q), true)
  assert.equal(inQuietHours(at("2026-10-19T03:00:00Z"), q), true)
  assert.equal(inQuietHours(at("2026-10-19T07:00:00Z"), q), false)
  assert.equal(inQuietHours(at("2026-10-19T12:00:00Z"), q), false)
})

test("a same-day window and the person's own time zone are respected", () => {
  assert.equal(inQuietHours(at("2026-10-19T13:00:00Z"), { start: 13, end: 15, tz: "UTC" }), true)
  assert.equal(inQuietHours(at("2026-10-19T15:00:00Z"), { start: 13, end: 15, tz: "UTC" }), false)
  // 20:00 UTC is 23:00 in Moscow: inside 22 to 7 there, outside it in UTC.
  assert.equal(inQuietHours(at("2026-10-19T20:00:00Z"), { start: 22, end: 7, tz: "Europe/Moscow" }), true)
  assert.equal(inQuietHours(at("2026-10-19T20:00:00Z"), { start: 22, end: 7, tz: "UTC" }), false)
  assert.equal(localHour(at("2026-10-19T20:00:00Z"), "Not/AZone"), 20)
})

test("quiet hours are off when unset or the window is empty", () => {
  assert.equal(inQuietHours(at("2026-10-19T23:00:00Z"), null), false)
  assert.equal(inQuietHours(at("2026-10-19T23:00:00Z"), { start: null, end: null, tz: null }), false)
  assert.equal(inQuietHours(at("2026-10-19T23:00:00Z"), { start: 8, end: 8, tz: "UTC" }), false)
})

test("what the app sends is checked", () => {
  assert.deepEqual(parseQuiet({ enabled: false }), { quiet_start: null, quiet_end: null, quiet_tz: null })
  assert.deepEqual(parseQuiet({ enabled: true, start: 22, end: 7, tz: "Europe/Moscow" }), { quiet_start: 22, quiet_end: 7, quiet_tz: "Europe/Moscow" })
  assert.deepEqual(parseQuiet({ enabled: true, start: 22, end: 7, tz: "Bad/Zone" }), { quiet_start: 22, quiet_end: 7, quiet_tz: null })
  assert.equal(parseQuiet({ enabled: true, start: 24, end: 7 }), null)
  assert.equal(parseQuiet({ enabled: true, start: 5, end: 5 }), null)
  assert.equal(parseQuiet(null), null)
})
