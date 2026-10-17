import assert from "node:assert/strict"
import { test } from "node:test"
import { buildMessages, chunk, deadTokens, isExpoPushToken } from "../../lib/push"
import { tEmail } from "../../lib/i18n/server"

test("only Expo push tokens are accepted", () => {
  assert.equal(isExpoPushToken("ExponentPushToken[abc123_DEF-456]"), true)
  assert.equal(isExpoPushToken("ExpoPushToken[abc123_DEF-456]"), true)
  for (const bad of ["", "abc", "ExponentPushToken[]", "ExponentPushToken[short]", "fcm:APA91b...", null, 42]) assert.equal(isExpoPushToken(bad), false)
})

test("one message per device, trimmed to what a lock screen shows", () => {
  const [m] = buildMessages(["ExponentPushToken[abc123_DEF-456]"], { title: "t".repeat(200), body: "b".repeat(500), data: { type: "support" } })
  assert.equal(m.title.length, 80)
  assert.equal(m.body.length, 240)
  assert.deepEqual(m.data, { type: "support" })
  assert.equal(buildMessages(["a", "b"], { title: "x", body: "y" }).length, 2)
})

test("only devices the service says are gone are dropped", () => {
  const tokens = ["t1", "t2", "t3", "t4"]
  const tickets = [{ status: "ok" }, { status: "error", details: { error: "DeviceNotRegistered" } }, { status: "error", details: { error: "MessageRateExceeded" } }, { status: "ok" }]
  assert.deepEqual(deadTokens(tokens, tickets), ["t2"])
  assert.deepEqual(deadTokens(tokens, []), [])
})

test("devices are sent in groups of 100", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  assert.equal(chunk(Array.from({ length: 250 }, (_, i) => i), 100).length, 3)
  assert.deepEqual(chunk([], 100), [])
})

test("the support reply notification exists in all six languages with the subject filled in", () => {
  for (const lng of ["en", "ru", "fr", "es", "zh", "pt"]) {
    const title = tEmail("push.supportReply.title", {}, lng)
    const body = tEmail("push.supportReply.body", { subject: "My payment" }, lng)
    assert.ok(title && !title.startsWith("push."), lng + " title")
    assert.ok(body.includes("My payment") && !body.includes("{{"), lng + " body")
  }
  assert.notEqual(tEmail("push.supportReply.title", {}, "ru"), tEmail("push.supportReply.title", {}, "en"))
})

import { wants } from "../../lib/push"
import { orderPushWanted, ORDER_PUSH_KINDS } from "../../lib/push-events"

test("everything is on until the customer switches it off", () => {
  assert.equal(wants(null, "orders"), true)
  assert.equal(wants({}, "messages"), true)
  assert.equal(wants({ orders: false }, "orders"), false)
  assert.equal(wants({ orders: false }, "messages"), true)
})

test("only real order changes that are recent get a notification", () => {
  const now = Date.parse("2026-10-19T12:00:00Z")
  assert.equal(orderPushWanted("fulfill", "2026-10-19T11:59:00Z", now), true)
  assert.equal(orderPushWanted("payment_method", "2026-10-19T11:59:00Z", now), false)
  assert.equal(orderPushWanted("paid", "2026-10-19T04:00:00Z", now), false)
})

test("every order notification and the chat title exist in all six languages", () => {
  for (const lng of ["en", "ru", "fr", "es", "zh", "pt"]) {
    for (const kind of ORDER_PUSH_KINDS) {
      const title = tEmail(`push.order.${kind}.title`, {}, lng)
      const body = tEmail(`push.order.${kind}.body`, { id: "CI-1234" }, lng)
      assert.ok(title && !title.startsWith("push."), `${lng} ${kind} title`)
      assert.ok(body.includes("CI-1234") && !body.includes("{{"), `${lng} ${kind} body`)
    }
    assert.ok(!tEmail("push.chat.title", {}, lng).startsWith("push."), lng + " chat")
  }
})

import { transferPushWanted } from "../../lib/push-events"

test("transfers notify only for the four statuses that matter and only when recent", () => {
  const now = Date.parse("2026-10-19T12:00:00Z")
  for (const s of ["processing", "completed", "deposited", "failed", "refunded"]) assert.equal(transferPushWanted(s, "2026-10-19T11:59:00Z", now), true, s)
  for (const s of ["pending", "cancelled", "converting"]) assert.equal(transferPushWanted(s, "2026-10-19T11:59:00Z", now), false, s)
  assert.equal(transferPushWanted("completed", "2026-10-19T04:00:00Z", now), false)
})

test("every transfer notification exists in all six languages with the amounts filled in", () => {
  for (const lng of ["en", "ru", "fr", "es", "zh", "pt"]) {
    for (const k of ["processing", "completed", "failed", "refunded"]) {
      const title = tEmail(`push.transfer.${k}.title`, {}, lng)
      const body = tEmail(`push.transfer.${k}.body`, { sent: "₽100", received: "$1", id: "CIU-1", to: " → Ada" }, lng)
      assert.ok(title && !title.startsWith("push."), `${lng} ${k} title`)
      assert.ok(!body.includes("{{") && !body.startsWith("push."), `${lng} ${k} body`)
    }
  }
})

import { reminderWindow, BOOKING_REMINDER_WINDOW_MS } from "../../lib/push-events"

test("the reminder window is the next 75 minutes", () => {
  const now = Date.parse("2026-10-19T12:00:00Z")
  const w = reminderWindow(now)
  assert.equal(w.from, "2026-10-19T12:00:00.000Z")
  assert.equal(Date.parse(w.to) - now, BOOKING_REMINDER_WINDOW_MS)
})

test("the booking reminder exists in all six languages with the expert's name", () => {
  for (const lng of ["en", "ru", "fr", "es", "zh", "pt"]) {
    const body = tEmail("push.booking.reminder.body", { name: "Ada" }, lng)
    assert.ok(body.includes("Ada") && !body.includes("{{"), lng)
    assert.ok(!tEmail("push.booking.reminder.title", {}, lng).startsWith("push."), lng + " title")
  }
})

test("a chat push carries its button set; other pushes do not", () => {
  const [chat] = buildMessages(["ExponentPushToken[abcdef123456]"], { title: "t", body: "b", categoryId: "chat" })
  assert.equal(chat.categoryId, "chat")
  const [plain] = buildMessages(["ExponentPushToken[abcdef123456]"], { title: "t", body: "b" })
  assert.equal("categoryId" in plain, false)
})

test("the expert-times notification exists in all six languages", () => {
  for (const lng of ["en", "ru", "fr", "es", "zh", "pt"]) {
    const body = tEmail("push.expert.slots.body", { name: "Ada" }, lng)
    assert.ok(body.includes("Ada") && !body.includes("{{"), lng)
  }
})
