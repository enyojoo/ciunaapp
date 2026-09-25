import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const uid = "11111111-1111-4111-8111-111111111111",
  pid = "22222222-2222-4222-8222-222222222222",
  mid = "33333333-3333-4333-8333-333333333333"
async function setup(stock = 1) {
  const db = new PGlite()
  await db.exec(fs.readFileSync(root + "supabase/tests/marketplace-baseline.sql", "utf8"))
  await db.exec(
    fs.readFileSync(root + "supabase/migrations/20260925090000_marketplace_lifecycle.sql", "utf8"),
  )
  await db.query("insert into users(id,email,first_name,last_name) values($1,$2,'Test','Customer')", [
    uid,
    "test@example.com",
  ])
  await db.query(
    "insert into hub_products(id,title,status,pricing_type,fixed_amount,fixed_currency,fulfillment_mode,stock_quantity,service_line_slug,category) values($1,'Digital purchase','live','fixed',100,'RUB','digital',$2,'mart','Other')",
    [pid, stock],
  )
  await db.query(
    "insert into payment_methods(id,currency,status,provider,name,type) values($1,'RUB','active','manual','Bank','bank_transfer')",
    [mid],
  )
  return db
}
async function create(db, key = "unique-key-1") {
  const pr = (await db.query("select *,updated_at::text as version from hub_products where id=$1", [pid]))
    .rows[0]
  const method = (
    await db.query("select to_jsonb(payment_methods) as value from payment_methods where id=$1", [mid])
  ).rows[0].value
  const snap = {
    source: { kind: "product", hubProductId: pid },
    title: "Digital purchase",
    line: "mart",
    fulfillmentMode: "digital",
    lines: [
      {
        id: pid,
        productId: pid,
        title: "Digital purchase",
        quantity: 1,
        unitPrice: 100,
        feePercent: 0,
        fields: [],
      },
    ],
    methods: [{ id: mid, rail: "manual", instructions: { name: "Bank" } }],
    totals: {
      subtotal: 100,
      convertedSubtotal: 100,
      payCurrency: "RUB",
      productCurrency: "RUB",
      exchangeRate: 1,
      corridorFee: 0,
      total: 100,
      marketplaceFee: 0,
      deliveryFee: 0,
    },
  }
  const payload = { snapshot: snap, productVersions: { [pid]: pr.version }, methodRows: { [mid]: method } }
  const q = (
    await db.query(
      "insert into marketplace_quotes(user_id,payload,expires_at) values($1,$2,now()+interval '5 minutes') returning id",
      [uid, payload],
    )
  ).rows[0].id
  const contact = { contactName: "Test", contactEmail: "test@example.com", contactPhone: null }
  return (
    await db.query("select marketplace_create_order($1,$2,$3,$4,$5,'manual',$6,'embedded',$7) as id", [
      uid,
      q,
      key,
      "hash-" + key,
      contact,
      mid,
      "TEST-" + key,
    ])
  ).rows[0].id
}
async function action(db, id, kind, data = {}) {
  return db.query("select marketplace_transition($1,$2,$3,$4)", [id, kind, uid, data])
}
async function order(db, id) {
  return (await db.query("select * from marketplace_orders where id=$1", [id])).rows[0]
}
async function attempt(db, id) {
  return (await db.query("select * from marketplace_attempts where order_id=$1", [id])).rows[0]
}

test("atomic order, direct line, idempotency, stock reservation and payment", async () => {
  const db = await setup()
  try {
    const id = await create(db)
    assert.equal(await create(db), id)
    await assert.rejects(create(db, "unique-key-2"), /OUT_OF_STOCK/)
    assert.equal((await db.query("select count(*)::int as n from transactions")).rows[0].n, 1)
    assert.equal((await db.query("select count(*)::int as n from hub_order_items")).rows[0].n, 1)
    const a = await attempt(db, id)
    await action(db, id, "paid", { attemptId: a.id })
    await action(db, id, "paid", { attemptId: a.id })
    assert.equal((await order(db, id)).fulfillment_state, "awaiting_acceptance")
    assert.equal((await db.query("select stock_quantity from hub_products")).rows[0].stock_quantity, 0)
    await action(db, id, "accept")
    await assert.rejects(action(db, id, "cancel"), /CONTACT_SUPPORT/)
    await assert.rejects(action(db, id, "fulfill", { note: "done" }), /DELIVERY_CONTENT_REQUIRED/)
    await action(db, id, "fulfill", { note: "Delivered", digitalContent: "Private code" })
    assert.equal((await order(db, id)).fulfillment_state, "fulfilled")
  } finally {
    await db.close()
  }
})
test("paid cancellation, exact refund, restock once, transaction guard", async () => {
  const db = await setup()
  try {
    const id = await create(db),
      a = await attempt(db, id)
    await action(db, id, "paid", { attemptId: a.id })
    await action(db, id, "cancel")
    await assert.rejects(action(db, id, "accept"), /INVALID_TRANSITION/)
    const refund = (await db.query("select * from marketplace_refunds")).rows[0]
    await assert.rejects(
      action(db, id, "refund", { refundId: refund.id, amount: 99, currency: "RUB", reference: "external" }),
      /REFUND_MISMATCH/,
    )
    await action(db, id, "refund", {
      refundId: refund.id,
      amount: 100,
      currency: "RUB",
      reference: "external",
    })
    assert.equal((await order(db, id)).payment_state, "refunded")
    await action(db, id, "restock")
    await action(db, id, "restock")
    assert.equal((await db.query("select stock_quantity from hub_products")).rows[0].stock_quantity, 1)
    await assert.rejects(db.exec("update transactions set status='pending'"), /USE_MARKETPLACE_ACTION/)
  } finally {
    await db.close()
  }
})
test("expired reservation accepts late payment as an exception", async () => {
  const db = await setup()
  try {
    const id = await create(db),
      a = await attempt(db, id)
    await db.query("update marketplace_orders set payment_deadline=now()-interval '1 minute' where id=$1", [
      id,
    ])
    await action(db, id, "expire")
    const other = await create(db, "another-order")
    await action(db, id, "paid", { attemptId: a.id })
    assert.equal((await order(db, id)).exception_reason, "LATE_PAYMENT")
    await assert.rejects(action(db, id, "accept"), /INVALID_TRANSITION/)
    await assert.rejects(action(db, id, "reacquire"), /OUT_OF_STOCK/)
    await action(db, other, "cancel")
    await action(db, id, "reacquire")
    await action(db, id, "accept")
  } finally {
    await db.close()
  }
})
test("jobs are leased, reclaimed and not claimed twice", async () => {
  const db = await setup()
  try {
    await create(db)
    const first = (await db.query("select * from marketplace_claim_jobs(20)")).rows
    assert.ok(first.length)
    assert.equal((await db.query("select * from marketplace_claim_jobs(20)")).rows.length, 0)
    await db.exec("update marketplace_jobs set lease_until=now()-interval '1 minute' where state='running'")
    const again = (await db.query("select * from marketplace_claim_jobs(20)")).rows
    assert.equal(again.length, first.length)
    assert.notEqual(again[0].lease_token, first[0].lease_token)
    await db.exec("set role authenticated")
    await assert.rejects(db.query("select * from marketplace_orders"), /permission denied/)
    await assert.rejects(db.query("select * from marketplace_claim_jobs(20)"), /permission denied/)
    await db.exec("reset role")
    const rls = (
      await db.query(
        `select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
         where n.nspname='public' and c.relkind='r'
           and c.relname like 'marketplace_%' and not c.relrowsecurity`,
      )
    ).rows
    assert.equal(rls.length, 0, `RLS disabled on: ${rls.map((r) => r.relname).join(", ")}`)
  } finally {
    await db.close()
  }
})

test("different request keys cannot reuse a quote; proof blocks switching; failures preserve deadline", async () => {
  const db = await setup(10)
  try {
    const id = await create(db),
      a = await attempt(db, id),
      o = await order(db, id)
    await assert.rejects(
      db.query(
        "select marketplace_create_order($1,$2,'different-key','different-hash','{}','manual',$3,'embedded','DIFFERENT')",
        [uid, o.quote_id, mid],
      ),
      /QUOTE_ALREADY_USED/,
    )
    await action(db, id, "proof", { attemptId: a.id, path: "private-proof.pdf" })
    await assert.rejects(
      db.query("select marketplace_new_attempt($1,$2,'yookassa',null,'embedded','{}')", [id, uid]),
      /PAYMENT_UNRESOLVED/,
    )
    await action(db, id, "failed", { attemptId: a.id })
    const next = (
      await db.query("select marketplace_new_attempt($1,$2,'yookassa',null,'embedded','{}') as id", [id, uid])
    ).rows[0].id
    assert.notEqual(next, a.id)
    assert.equal(String((await order(db, id)).payment_deadline), String(o.payment_deadline))
    await assert.rejects(
      db.query("select marketplace_new_attempt($1,$2,'manual',$3,'embedded','{}')", [id, uid, mid]),
      /PAYMENT_UNRESOLVED/,
    )
    await action(db, id, "unknown", { attemptId: next })
    await action(db, id, "pending", { attemptId: next })
    await action(db, id, "paid", { attemptId: next })
    await action(db, id, "failed", { attemptId: next })
    await action(db, id, "pending", { attemptId: next })
    assert.equal((await order(db, id)).payment_state, "paid")
  } finally {
    await db.close()
  }
})

test("exclusive Expert hold, release ownership, acceptance and session-end guard", async () => {
  const db = await setup()
  try {
    const profile = (
      await db.query(
        "insert into expert_profiles(display_name,is_published,capabilities) values('Expert',true,'[]') returning *",
      )
    ).rows[0]
    const service = (
      await db.query(
        "insert into expert_services(expert_profile_id,title,is_published,pricing_type,fixed_amount,fixed_currency) values($1,'Session',true,'fixed',100,'RUB') returning *",
        [profile.id],
      )
    ).rows[0]
    const slot = (
      await db.query(
        "insert into expert_service_slots(expert_service_id,slot_start,slot_end) values($1,now()+interval '3 hours',now()+interval '4 hours') returning *",
        [service.id],
      )
    ).rows[0]
    async function book(key) {
      const method = (
        await db.query("select to_jsonb(payment_methods) as value from payment_methods where id=$1", [mid])
      ).rows[0].value
      const snapshot = {
        source: { kind: "expert", expertServiceSlotId: slot.id },
        title: "Session",
        line: "experts",
        fulfillmentMode: "online_appointment",
        slotStart: slot.slot_start,
        slotEnd: slot.slot_end,
        lines: [{ id: service.id, title: "Session", quantity: 1, unitPrice: 100, feePercent: 0, fields: [] }],
        methods: [{ id: mid, rail: "manual", instructions: {} }],
        totals: {
          subtotal: 100,
          convertedSubtotal: 100,
          payCurrency: "RUB",
          productCurrency: "RUB",
          exchangeRate: 1,
          corridorFee: 0,
          total: 100,
          marketplaceFee: 0,
          deliveryFee: 0,
        },
      }
      const payload = {
        snapshot,
        methodRows: { [mid]: method },
        slotId: slot.id,
        profileId: profile.id,
        serviceVersion: service.updated_at,
        profileVersion: profile.updated_at,
        leadMinutes: 120,
        cutoffMinutes: 60,
        pricingType: "fixed",
      }
      const q = (
        await db.query(
          "insert into marketplace_quotes(user_id,payload,expires_at) values($1,$2,now()+interval '5 minutes') returning id",
          [uid, payload],
        )
      ).rows[0].id
      return (
        await db.query("select marketplace_create_order($1,$2,$3,$3,'{}','manual',$4,'embedded',$3) as id", [
          uid,
          q,
          key,
          mid,
        ])
      ).rows[0].id
    }
    const first = await book("booking-one")
    await assert.rejects(book("booking-two"), /SLOT_UNAVAILABLE/)
    const parallel = await Promise.allSettled([book("race-a"), book("race-b")])
    const parallelOk = parallel.filter((r) => r.status === "fulfilled")
    const parallelFail = parallel.filter((r) => r.status === "rejected")
    // After first booking already holds the slot, both parallel attempts must fail.
    assert.equal(parallelOk.length, 0)
    assert.equal(parallelFail.length, 2)
    await assert.rejects(
      db.query("update expert_service_slots set slot_start=slot_start+interval '1 hour' where id=$1", [
        slot.id,
      ]),
      /SLOT_RESERVED/,
    )
    await action(db, first, "cancel")
    const second = await book("booking-two")
    await action(db, first, "cancel")
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from marketplace_reservations where order_id=$1 and state='held'",
          [second],
        )
      ).rows[0].n,
      1,
    )
    const a = await attempt(db, second)
    await action(db, second, "paid", { attemptId: a.id })
    await action(db, second, "accept")
    assert.equal(
      (await db.query("select status from expert_bookings where transaction_id='booking-two'")).rows[0]
        .status,
      "confirmed",
    )
    await assert.rejects(action(db, second, "fulfill", { note: "done" }), /SESSION_NOT_ENDED/)
  } finally {
    await db.close()
  }
})

test("converted cart is frozen, reservations resist stock edits, overdue detection is repeatable", async () => {
  const db = await setup(2)
  try {
    const vendor = (
      await db.query(
        "insert into hub_vendors(name,slug,service_line_slug,is_published) values('Vendor','vendor','mart',true) returning id",
      )
    ).rows[0].id
    await db.query("update hub_products set vendor_id=$1 where id=$2", [vendor, pid])
    const cart = (
      await db.query(
        "insert into hub_carts(user_id,vendor_id,service_line_slug) values($1,$2,'mart') returning id",
        [uid, vendor],
      )
    ).rows[0].id
    await db.query("insert into hub_cart_items(cart_id,hub_product_id,quantity) values($1,$2,1)", [cart, pid])
    const seed = await create(db)
    const quote = (
      await db.query("select * from marketplace_quotes where id=$1", [(await order(db, seed)).quote_id])
    ).rows[0]
    const payload = {
      ...quote.payload,
      cartId: cart,
      cartItems: [{ id: pid, quantity: 1 }],
      snapshot: { ...quote.payload.snapshot, source: { kind: "cart", cartId: cart } },
    }
    const q = (
      await db.query(
        "insert into marketplace_quotes(user_id,payload,expires_at) values($1,$2,now()+interval '5 minutes') returning id",
        [uid, payload],
      )
    ).rows[0].id
    const id = (
      await db.query(
        "select marketplace_create_order($1,$2,'cart-request','cart-hash','{}','manual',$3,'embedded','CART-ORDER') as id",
        [uid, q, mid],
      )
    ).rows[0].id
    assert.equal(
      (await db.query("select status from hub_carts where id=$1", [cart])).rows[0].status,
      "converted",
    )
    await assert.rejects(
      db.query("update hub_cart_items set quantity=2 where cart_id=$1", [cart]),
      /CART_CONVERTED/,
    )
    await assert.rejects(
      db.query("update hub_products set stock_quantity=1 where id=$1", [pid]),
      /STOCK_RESERVED/,
    )
    const a = await attempt(db, id)
    await action(db, id, "paid", { attemptId: a.id })
    await db.query("update marketplace_orders set attention_due_at=now()-interval '1 minute' where id=$1", [
      id,
    ])
    await db.exec("select marketplace_detect_overdue(); select marketplace_detect_overdue()")
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from marketplace_events where order_id=$1 and kind='overdue'",
          [id],
        )
      ).rows[0].n,
      1,
    )
    await action(db, id, "accept")
    assert.equal((await order(db, id)).overdue_at, null)
  } finally {
    await db.close()
  }
})
