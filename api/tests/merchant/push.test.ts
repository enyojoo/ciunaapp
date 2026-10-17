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
