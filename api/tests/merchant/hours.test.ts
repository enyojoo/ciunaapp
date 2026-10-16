import assert from "node:assert/strict"
import { test } from "node:test"
import { isValidTimeZone, normalizeSchedule, openState } from "../../lib/merchant/hours"

const week = normalizeSchedule({
  mon: [{ open: "09:00", close: "21:00" }],
  tue: [{ open: "09:00", close: "13:00" }, { open: "15:00", close: "21:00" }],
  sat: [{ open: "10:00", close: "24:00" }],
})

test("an empty schedule means not set, never closed", () => {
  assert.deepEqual(openState({}, "Europe/Moscow"), { configured: false, open: true })
  assert.deepEqual(normalizeSchedule(undefined), {})
})

test("open now reports the closing time in the store's zone", () => {
  // Monday 10:30 in Moscow (UTC+3) is 07:30 UTC
  const s = openState(week, "Europe/Moscow", new Date("2026-10-19T07:30:00Z"))
  assert.equal(s.open, true)
  assert.equal(s.closesAt, "21:00")
})

test("closed between shifts names the next opening today", () => {
  // Tuesday 14:00 Moscow = 11:00 UTC
  const s = openState(week, "Europe/Moscow", new Date("2026-10-20T11:00:00Z"))
  assert.equal(s.open, false)
  assert.deepEqual(s.opensAt, { day: "tue", time: "15:00" })
})

test("closed after the last shift names the next day that opens", () => {
  // Tuesday 22:30 Moscow = 19:30 UTC; Wednesday to Friday are closed, so Saturday
  const s = openState(week, "Europe/Moscow", new Date("2026-10-20T19:30:00Z"))
  assert.equal(s.open, false)
  assert.deepEqual(s.opensAt, { day: "sat", time: "10:00" })
})

test("the same instant is a different day in another zone", () => {
  // 2026-10-19 22:30 UTC is Tuesday 01:30 in Moscow (closed) but Monday 22:30 in London (closed, after hours)
  const moscow = openState(week, "Europe/Moscow", new Date("2026-10-19T22:30:00Z"))
  assert.deepEqual(moscow.opensAt, { day: "tue", time: "09:00" })
})

test("bad schedules are rejected", () => {
  assert.throws(() => normalizeSchedule({ mon: [{ open: "21:00", close: "09:00" }] }), /HOURS_INVALID/)
  assert.throws(() => normalizeSchedule({ funday: [{ open: "09:00", close: "10:00" }] }), /HOURS_INVALID/)
  assert.throws(() => normalizeSchedule({ mon: [{ open: "09:00", close: "12:00" }, { open: "11:00", close: "14:00" }] }), /HOURS_OVERLAP/)
  assert.throws(() => normalizeSchedule({ mon: [{ open: "9:00", close: "12:00" }] }), /HOURS_INVALID/)
})

test("time zones are checked", () => {
  assert.equal(isValidTimeZone("Africa/Lagos"), true)
  assert.equal(isValidTimeZone("Mars/Base"), false)
  assert.equal(isValidTimeZone(""), false)
})
