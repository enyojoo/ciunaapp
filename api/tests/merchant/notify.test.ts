import assert from "node:assert/strict"
import { test } from "node:test"
import { renderAlert, ALERT_LANGS } from "../../lib/merchant/notify-messages"

const opts = (lang: string) => ({ lang, merchantName: "Mama T", portalUrl: "https://seller.ciuna.com/" })

test("new order alert has id, amount, link to the order, in every language", () => {
  for (const l of ALERT_LANGS) {
    const m = renderAlert("order_new", { orderId: "abc", publicId: "CIU-1", amount: "1100", currency: "RUB", title: "Jollof" }, opts(l))
    assert.ok(m.title.includes("CIU-1"), l)
    assert.ok(m.body.includes("₽1,100.00"), l)
    assert.equal(m.url, "https://seller.ciuna.com/orders/abc")
    assert.ok(!/\{\w+\}/.test(m.text), `${l} has unfilled placeholder`)
  }
})

test("booking, payout and status alerts render without leftovers and escape HTML", () => {
  const b = renderAlert("booking_new", { orderId: "o", publicId: "CIU-2", title: "<b>Consult</b>", slotStart: "2026-10-20T09:00:00Z" }, opts("ru"))
  assert.ok(b.body.includes("20 Oct 12:00 MSK"))
  const lagos = renderAlert("booking_new", { orderId: "o", publicId: "CIU-2", title: "x", slotStart: "2026-10-20T09:00:00Z" }, { ...opts("en"), timeZone: "Africa/Lagos" })
  assert.ok(lagos.body.includes("20 Oct 10:00 WAT"))
  assert.ok(b.html.includes("<img"))
  assert.ok(b.html.includes("&lt;b&gt;Consult&lt;/b&gt;"))
  assert.equal(b.url, "https://seller.ciuna.com/bookings/o")
  const p = renderAlert("payout_update", { status: "paid", net: "2970", currency: "RUB", reference: "REF-1" }, opts("fr"))
  assert.ok(p.body.includes("₽2,970.00") && p.body.includes("REF-1"))
  const r = renderAlert("payout_update", { status: "rejected", amount: "500", currency: "RUB", reason: "Details do not match" }, opts("es"))
  assert.ok(r.body.includes("Details do not match"))
  const live = renderAlert("merchant_status", { status: "live", name: "Mama T" }, opts("zh"))
  assert.equal(live.url, "https://seller.ciuna.com/")
  const rej = renderAlert("merchant_status", { status: "rejected", reason: "Unreadable passport" }, opts("pt"))
  assert.equal(rej.url, "https://seller.ciuna.com/setup")
})

test("unknown language falls back to English", () => {
  assert.equal(renderAlert("order_new", { orderId: "x", publicId: "CIU-9", amount: 10, currency: "USD" }, opts("de")).title, "New order CIU-9")
})

test("message alert shows the order and a preview, links to the thread, in every language", () => {
  for (const l of ALERT_LANGS) {
    const m = renderAlert("message_new", { orderId: "ord1", publicId: "CIU-7", preview: "Where is my order?" }, opts(l))
    assert.ok(m.title.includes("CIU-7"), l)
    assert.ok(m.body.includes("Where is my order?"), l)
    assert.equal(m.url, "https://seller.ciuna.com/messages/ord1")
    assert.ok(!/\{\w+\}/.test(m.text), `${l} has unfilled placeholder`)
  }
})
