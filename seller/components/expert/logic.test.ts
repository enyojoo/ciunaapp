import { test } from "node:test"
import assert from "node:assert/strict"
import { addDaysISO, copyDay, dateKeyInZone, defaultWindow, formatDuration, formatInZone, groupByDate, isHttps, rulesFromWeek, sessionEnded, splitMinutes, toMinutes, validateDay, validateWeek, validateWindow, weekFromRules, windowDays, emptyWeek } from "./logic"

test("validateDay flags end before start and overlaps, allows touching", () => {
  assert.deepEqual(validateDay([{ start: "09:00", end: "12:00" }, { start: "12:00", end: "15:00" }]), {})
  assert.deepEqual(validateDay([{ start: "09:00", end: "09:00" }]), { 0: "order" })
  assert.deepEqual(validateDay([{ start: "09:00", end: "12:00" }, { start: "11:00", end: "13:00" }]), { 0: "overlap", 1: "overlap" })
  assert.deepEqual(validateDay([{ start: "", end: "10:00" }]), { 0: "empty" })
})

test("validateWeek keys by day and index", () => {
  const w = emptyWeek()
  w[1] = [{ start: "10:00", end: "09:00" }]
  assert.deepEqual(validateWeek(w), { "1:0": "order" })
})

test("rules round trip and drop seconds", () => {
  const week = weekFromRules([
    { day_of_week: 1, local_start_time: "13:00:00", local_end_time: "17:00:00", sort_order: 1 },
    { day_of_week: 1, local_start_time: "09:00:00", local_end_time: "12:00:00", sort_order: 0 },
    { day_of_week: 0, local_start_time: "10:00", local_end_time: "11:00" },
  ])
  assert.deepEqual(week[1], [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }])
  const rules = rulesFromWeek(week)
  assert.equal(rules[0].day_of_week, 1)
  assert.equal(rules[rules.length - 1].day_of_week, 0)
  assert.equal(rules.length, 3)
})

test("copyDay replaces targets with independent copies", () => {
  const w = emptyWeek()
  w[1] = [{ start: "09:00", end: "10:00" }]
  w[2] = [{ start: "01:00", end: "02:00" }]
  const next = copyDay(w, 1, [1, 2, 3])
  assert.deepEqual(next[2], w[1])
  assert.deepEqual(next[3], w[1])
  assert.notEqual(next[2][0], w[1][0])
})

test("duration units", () => {
  assert.deepEqual(splitMinutes(120), { amount: 2, unit: "hours" })
  assert.deepEqual(splitMinutes(90), { amount: 90, unit: "minutes" })
  assert.deepEqual(splitMinutes(0), { amount: 0, unit: "minutes" })
  assert.equal(toMinutes(2, "hours"), 120)
  assert.equal(toMinutes(1.5, "hours"), 90)
  assert.equal(formatDuration(90), "1 h 30 min")
  assert.equal(formatDuration(120), "2 h")
  assert.equal(formatDuration(45), "45 min")
})

test("time zone display always includes a zone", () => {
  const iso = "2026-10-14T12:00:00Z"
  assert.match(formatInZone(iso, "Europe/Moscow", "en"), /15:00/)
  assert.match(formatInZone(iso, "Europe/Moscow", "en"), /GMT\+3/)
  assert.equal(dateKeyInZone("2026-10-14T23:30:00Z", "Asia/Tokyo"), "2026-10-15")
})

test("groupByDate groups in the given zone", () => {
  const g = groupByDate([{ start: "2026-10-14T23:30:00Z" }, { start: "2026-10-14T10:00:00Z" }, { start: "2026-10-15T00:30:00Z" }], "Asia/Tokyo")
  assert.equal(g.length, 2)
  assert.equal(g[0].date, "2026-10-14")
  assert.equal(g[1].items.length, 2)
})

test("window helpers", () => {
  assert.equal(addDaysISO("2026-02-27", 2), "2026-03-01")
  assert.equal(windowDays("2026-10-01", "2026-10-10"), 10)
  const w = defaultWindow("UTC", new Date("2026-10-16T10:00:00Z"))
  assert.deepEqual(w, { start: "2026-10-16", end: "2026-12-14" })
  assert.equal(windowDays(w.start, w.end), 60)
  assert.equal(validateWindow("2026-10-10", "2026-10-09"), "order")
  assert.equal(validateWindow("2026-01-01", "2026-12-31"), "too_long")
  assert.equal(validateWindow("2026-01-01", "2026-04-30"), null)
  assert.equal(validateWindow("", "2026-04-30"), "empty")
})

test("sessionEnded and isHttps", () => {
  assert.equal(sessionEnded("2026-10-16T10:00:00Z", new Date("2026-10-16T09:59:59Z")), false)
  assert.equal(sessionEnded("2026-10-16T10:00:00Z", new Date("2026-10-16T10:00:00Z")), true)
  assert.equal(isHttps("https://meet.example.com/x"), true)
  assert.equal(isHttps("http://x.com"), false)
  assert.equal(isHttps("nope"), false)
})
