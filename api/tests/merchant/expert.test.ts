import assert from "node:assert/strict"
import { test } from "node:test"
import { MerchantError } from "../../lib/merchant/errors"
import {
  bookingInScope,
  buildSellerService,
  parseMeeting,
  parseRange,
  parseScheduleBody,
  parseSlotInput,
  parseSlotStatus,
  previewSlots,
  sanitizeTranslations,
  serviceContentChanged,
  validateWindow,
} from "../../lib/merchant/expert"

const code = (c: string) => (e: any) => e instanceof MerchantError && e.code === c
const base = { title: "Career call", pricing_type: "fixed", fixed_amount: 50, fixed_currency: "usd", default_duration_minutes: 60 }

test("translations: keeps supported langs and trims", () => {
  assert.deepEqual(sanitizeTranslations({ fr: { title: " Appel ", short_description: "Court" }, ru: { title: "", short_description: "" } }), { fr: { title: "Appel", short_description: "Court" } })
  assert.deepEqual(sanitizeTranslations(undefined), {})
})

test("translations: rejects unknown langs and bad shapes", () => {
  assert.throws(() => sanitizeTranslations({ de: { title: "x" } }), code("TRANSLATION_LANG_UNSUPPORTED"))
  assert.throws(() => sanitizeTranslations({ en: { title: 5 } }), code("TRANSLATIONS_INVALID"))
  assert.throws(() => sanitizeTranslations([]), code("TRANSLATIONS_INVALID"))
})

test("service row: forces profile, drops foreign keys, defaults translations", () => {
  const row = buildSellerService({ ...base, expert_profile_id: "evil", id: "x", review_status: "approved" }, "p1", null)
  assert.equal(row.expert_profile_id, "p1")
  assert.equal(row.fixed_currency, "USD")
  assert.deepEqual(row.translations, {})
  assert.equal("id" in row, false)
  assert.equal("review_status" in row, false)
})

test("service row: invalid input becomes SERVICE_INVALID, patch merges existing", () => {
  assert.throws(() => buildSellerService({ title: "" }, "p1", null), code("SERVICE_INVALID"))
  const existing = { ...base, translations: { en: { title: "A", short_description: "" } }, meeting_instructions: "Zoom", fixed_currency: "USD", expert_profile_id: "p1" }
  const row = buildSellerService({ fixed_amount: 80 }, "p1", existing)
  assert.equal(row.fixed_amount, 80)
  assert.equal(row.title, "Career call")
  assert.deepEqual(row.translations, existing.translations)
  assert.equal(serviceContentChanged(row, existing), false)
  assert.equal(serviceContentChanged({ ...row, title: "Other" }, existing), true)
  assert.equal(serviceContentChanged({ ...row, translations: {} }, existing), true)
})

test("window: caps at 120 days and validates order/format", () => {
  assert.equal(validateWindow("2026-11-01", "2026-11-30").days, 30)
  assert.equal(validateWindow("2026-01-01", "2026-04-30").days, 120)
  assert.throws(() => validateWindow("2026-01-01", "2026-05-01"), code("WINDOW_TOO_LONG"))
  assert.throws(() => validateWindow("2026-02-01", "2026-01-01"), code("WINDOW_ORDER"))
  assert.throws(() => validateWindow("nope", "2026-01-01"), code("WINDOW_INVALID"))
})

test("range: limits and defaults", () => {
  const r = parseRange("2026-11-01T00:00:00Z", "2026-11-10T00:00:00Z", 60)
  assert.equal(r.to > r.from, true)
  assert.throws(() => parseRange("2026-01-01T00:00:00Z", "2026-06-01T00:00:00Z", 60), code("RANGE_TOO_LONG"))
  assert.throws(() => parseRange("2026-11-10T00:00:00Z", "2026-11-01T00:00:00Z", 60), code("RANGE_ORDER"))
  assert.throws(() => parseRange("garbage", "2026-11-01T00:00:00Z", 60), code("RANGE_INVALID"))
  assert.throws(() => parseRange(null, null, 60), code("RANGE_INVALID"))
  const d = parseRange(null, null, 60, "UTC", { from: new Date(0), to: new Date(1000) })
  assert.equal(d.to.getTime(), 1000)
})

test("range: date-only values resolve in the given timezone, end is inclusive", () => {
  const r = parseRange("2026-11-02", "2026-11-02", 5, "Europe/Moscow")
  assert.equal(r.from.toISOString(), "2026-11-01T21:00:00.000Z")
  assert.equal(r.to.toISOString(), "2026-11-02T20:59:59.999Z")
})

test("schedule body: validates timezone, duration and rules", () => {
  const ok = { timezone: "Europe/Paris", window_start_date: "2026-11-01", window_end_date: "2026-11-30", slot_duration_minutes: 45, weekly_rules: [{ day_of_week: 1, local_start_time: "09:00", local_end_time: "12:00" }] }
  const p = parseScheduleBody(ok)
  assert.equal(p.slotDur, 45)
  assert.equal(p.rules.length, 1)
  assert.throws(() => parseScheduleBody({ ...ok, timezone: "Mars/Base" }), code("TIMEZONE_INVALID"))
  assert.throws(() => parseScheduleBody({ ...ok, slot_duration_minutes: 0 }), code("SLOT_DURATION_INVALID"))
  assert.throws(() => parseScheduleBody({ ...ok, weekly_rules: [{ day_of_week: 9, local_start_time: "09:00", local_end_time: "10:00" }] }), code("DAY_OF_WEEK_INVALID"))
  assert.throws(() => parseScheduleBody({ ...ok, weekly_rules: [{ day_of_week: 1, local_start_time: "12:00", local_end_time: "09:00" }] }), code("RULE_TIME_ORDER"))
  assert.throws(() => parseScheduleBody({ ...ok, window_end_date: "2027-06-30" }), code("WINDOW_TOO_LONG"))
  assert.equal(parseScheduleBody({ ...ok, slot_duration_minutes: null }).slotDur, null)
})

test("preview: only the next 14 days, in order", () => {
  const now = new Date("2026-11-01T00:00:00Z")
  const out = previewSlots({
    windowStartDate: "2026-11-01",
    windowEndDate: "2026-12-31",
    timeZone: "UTC",
    durationMinutes: 60,
    weeklyRules: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day_of_week: d, local_start_time: "10:00", local_end_time: "12:00", sort_order: 0 })),
    now,
  })
  assert.equal(out.length, 28)
  assert.equal(out[0].start, "2026-11-01T10:00:00.000Z")
  assert.equal(out[0].end, "2026-11-01T11:00:00.000Z")
  assert.equal(out.every((s) => new Date(s.start) <= new Date("2026-11-15T00:00:00Z")), true)
})

test("preview: skips booked intervals", () => {
  const out = previewSlots({
    windowStartDate: "2026-11-02",
    windowEndDate: "2026-11-02",
    timeZone: "UTC",
    durationMinutes: 60,
    weeklyRules: [{ day_of_week: 1, local_start_time: "10:00", local_end_time: "12:00", sort_order: 0 }],
    bookedIntervals: [{ start: new Date("2026-11-02T10:00:00Z"), end: new Date("2026-11-02T11:00:00Z") }],
    now: new Date("2026-11-01T00:00:00Z"),
  })
  assert.deepEqual(out.map((s) => s.start), ["2026-11-02T11:00:00.000Z"])
})

test("slots: input validation and status values", () => {
  const now = new Date("2026-11-01T00:00:00Z")
  assert.equal(parseSlotInput({ slot_start: "2026-11-02T10:00:00Z", slot_end: "2026-11-02T11:00:00Z" }, now).end.toISOString(), "2026-11-02T11:00:00.000Z")
  assert.throws(() => parseSlotInput({ slot_start: "2026-11-02T11:00:00Z", slot_end: "2026-11-02T10:00:00Z" }, now), code("SLOT_ORDER"))
  assert.throws(() => parseSlotInput({ slot_start: "2026-10-01T10:00:00Z", slot_end: "2026-10-01T11:00:00Z" }, now), code("SLOT_IN_PAST"))
  assert.throws(() => parseSlotInput({}, now), code("SLOT_INVALID"))
  assert.equal(parseSlotStatus("Blocked"), "blocked")
  assert.throws(() => parseSlotStatus("booked"), code("SLOT_STATUS_INVALID"))
})

test("bookings: scope filter", () => {
  const now = new Date("2026-11-01T12:00:00Z")
  const future = { start: "2026-11-02T10:00:00Z", end: "2026-11-02T11:00:00Z" }
  const gone = { start: "2026-10-30T10:00:00Z", end: "2026-10-30T11:00:00Z" }
  assert.equal(bookingInScope({ status: "new", slot: future }, "requests", now), true)
  assert.equal(bookingInScope({ status: "accepted", slot: future }, "requests", now), false)
  assert.equal(bookingInScope({ status: "accepted", slot: future }, "upcoming", now), true)
  assert.equal(bookingInScope({ status: "accepted", slot: gone }, "upcoming", now), false)
  assert.equal(bookingInScope({ status: "accepted", slot: gone }, "past", now), true)
  assert.equal(bookingInScope({ status: "completed", slot: future }, "past", now), true)
  assert.equal(bookingInScope({ status: "new", slot: future }, "upcoming", now), false)
  assert.equal(bookingInScope({ status: "new", slot: null }, null, now), true)
})

test("meeting: https only, needs url or instructions", () => {
  assert.equal(parseMeeting({ meetingUrl: "https://meet.example.com/abc" }).url, "https://meet.example.com/abc")
  assert.equal(parseMeeting({ instructions: " Call me " }).instructions, "Call me")
  assert.throws(() => parseMeeting({ meetingUrl: "http://x.com" }), code("MEETING_URL_INVALID"))
  assert.throws(() => parseMeeting({ meetingUrl: "javascript:alert(1)" }), code("MEETING_URL_INVALID"))
  assert.throws(() => parseMeeting({ meetingUrl: "not a url" }), code("MEETING_URL_INVALID"))
  assert.throws(() => parseMeeting({}), code("MEETING_EMPTY"))
})
