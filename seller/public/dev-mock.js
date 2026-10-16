/* Design-review demo mode. Loaded only when NEXT_PUBLIC_SELLER_MOCK=1 (never in production env). Fakes a signed-in
   seller and canned API responses so every screen can be reviewed without a backend. Mutations succeed locally. */
(function () {
  var host = (document.documentElement.getAttribute("data-supabase-ref") || "")
  var key = Object.keys(localStorage).find(function (k) { return /^sb-.*-auth-token$/.test(k) }) || ("sb-" + host + "-auth-token")
  var b64 = function (o) { return btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_") }
  var exp = Math.floor(Date.now() / 1000) + 86400
  var jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u1", aud: "authenticated", role: "authenticated", exp: exp, email: "mama@example.com" }), "sig"].join(".")
  var type = new URLSearchParams(location.search).get("as") || localStorage.getItem("mock.type") || "store"
  localStorage.setItem("mock.type", type)
  window.__MOCK_KEY__ = key
  var now = Date.now()
  var merchant = { id: "m1", type: type, slug: "s-demo", display_name: type === "store" ? "Mama T's Kitchen" : "Dr. Amina Yusuf, immigration lawyer", status: new URLSearchParams(location.search).get("status") || "live", country: "NG", operating_country: "RU", languages: ["en", "ru"], default_language: "en", default_currency: "RUB", logo_url: null, cover_url: null, description: { en: "Nigerian home cooking delivered across Moscow." }, contact_email: "mama@example.com", contact_phone: "+79991234567", website: null, role: "owner", permissions: ["profile", "catalog", "orders", "availability", "messages", "earnings", "payouts", "team", "documents"], rejection_reason: null, kyb_tier: 1, service_line: type === "store" ? "food" : null }
  function order(i, status, min, mode) {
    return { id: "o" + i, publicId: "CIU-100" + i, line: type === "store" ? "food" : "experts", status: status, paymentState: "paid", fulfillmentMode: mode || "delivery", createdAt: new Date(now - min * 60000).toISOString(), dueAt: new Date(now + (status === "new" ? 8 : -5) * 60000).toISOString(), overdue: status !== "new", title: "Mama T · 2", items: [{ id: "a", title: "Jollof rice", quantity: 2, unitPrice: 450 }, { id: "b", title: "Fried plantain", quantity: 1, unitPrice: 200 }], totals: { currency: "RUB", subtotal: 1100, deliveryFee: 150 }, customer: { name: "Amara Okafor", phone: "+79161234567", email: "amara@example.com" }, delivery: { address: "Moscow, Tverskaya 12, apt 5", pickupLocation: null, pickupHours: null }, note: "No pepper please", slot: null, digitalContent: null, actions: status === "new" ? ["accept", "reject"] : ["start", "fulfill"], exception: null }
  }
  var products = [
    { id: "p1", title: "Jollof rice", status: "live", list_price: 500, sale_price: 450, fixed_currency: "RUB", stock_quantity: 12, sold_out: false, image_url: null, review_status: "approved", category: "Meals", fulfillment_mode: "delivery", gallery: [], translations: {}, service_line_slug: "food" },
    { id: "p2", title: "Egusi soup with pounded yam", status: "draft", list_price: 700, sale_price: null, fixed_currency: "RUB", stock_quantity: null, sold_out: false, image_url: null, review_status: "pending", category: "Meals", fulfillment_mode: "pickup", gallery: [], translations: {}, service_line_slug: "food" },
    { id: "p3", title: "Chin chin (200 g)", status: "live", list_price: 250, sale_price: null, fixed_currency: "RUB", stock_quantity: 0, sold_out: true, image_url: null, review_status: "rejected", review_note: "Photo is unclear.", category: "Snacks", fulfillment_mode: "delivery", gallery: [], translations: {}, service_line_slug: "food" }
  ]
  var services = [{ id: "s1", title: "Residence permit consultation", is_published: true, pricing_type: "hourly", hourly_rate: 3000, hourly_currency: "RUB", default_duration_minutes: 60, fulfillment_type: "online", upcoming_slots: 14, review_status: "approved", meeting_instructions: "Zoom link sent after booking", timezone: "Europe/Moscow", translations: {} }, { id: "s2", title: "Document check", is_published: false, pricing_type: "fixed", fixed_amount: 5000, fixed_currency: "RUB", default_duration_minutes: 30, fulfillment_type: "both", upcoming_slots: 0, review_status: "pending", meeting_instructions: "", timezone: "Europe/Moscow", translations: {} }]
  var routes = {
    "/api/merchant/me": function () { return { user: { id: "u1", email: "mama@example.com", name: "Mama T" }, merchants: [merchant], invites: [] } },
    "/api/merchant/orders": function () { return { orders: [order(1, "new", 3), order(2, "new", 11), order(3, "accepted", 40)], total: 3, counts: { new: 2, active: 1 } } },
    "/api/merchant/products": function () { return { products: products, total: products.length } },
    "/api/merchant/application": function () { return { status: merchant.status, answers: { tier: 1, fields: {} }, application: null, checklist: [{ key: "profile", done: true }, { key: "logo", done: false }, { key: "tier", done: true }, { key: "kyb_fields", done: false }, { key: "kyb_documents", done: false }, { key: "first_listing", done: true }], ready: false, rejectionReason: null } },
    "/api/merchant/kyb": function () { return { tiers: [{ tier: 1, label: "Individual (any country)", requirements: { fields: [{ key: "full_name", label: "Full name", required: true }], documents: [{ kind: "passport", label: "Passport or national ID", required: true, expires: true }] } }, { tier: 2, label: "Registered business (any country)", requirements: { fields: [{ key: "registration_number", label: "Registration number", required: true }], documents: [{ kind: "registration_certificate", label: "Registration certificate", required: true, expires: false }] } }] } },
    "/api/merchant/documents": function () { return { documents: [{ id: "d1", kind: "passport", file_name: "passport.pdf", status: "pending", reason: null, expires_at: null }] } },
    "/api/merchant/fulfillment": function () { return { pickup: { location: "Moscow, Tverskaya 12", hours: "Mon–Sat 10:00–20:00" }, notes: null, zones: [{ id: "z1", city: "Moscow", district: "Center", fee: 150, currency: "RUB", active: true }] } },
    "/api/merchant/team": function () { return { members: [{ user_id: "u1", role: "owner", users: { email: "mama@example.com", first_name: "Mama", last_name: "T" } }], invites: [] } },
    "/api/merchant/expert/services": function () { return { services: services } },
    "/api/merchant/expert/bookings": function () { return { bookings: [], total: 0 } },
    "/api/merchant/earnings": function () { return { balances: [{ currency: "RUB", pending: 3420, available: 18250.5, inPayout: 5000, paidOut: 42000, lifetimeNet: 68670.5 }], minPayout: { RUB: 1000 }, holdDays: 2 } },
    "/api/merchant/earnings/items": function () { return { items: [{ id: "e1", order_id: "o1", currency: "RUB", subtotal: 1100, delivery_fee: 150, commission: 88, net: 1162, status: "available", fulfilled_at: new Date(now - 86400000).toISOString(), release_at: new Date(now - 3600000).toISOString(), released_at: null, marketplace_orders: { public_id: "CIU-1001", line: "food" } }, { id: "e2", order_id: "o2", currency: "RUB", subtotal: 900, delivery_fee: 0, commission: 72, net: 828, status: "pending", fulfilled_at: new Date(now - 3600000).toISOString(), release_at: new Date(now + 86400000).toISOString(), released_at: null, marketplace_orders: { public_id: "CIU-1002", line: "food" } }], total: 2 } },
    "/api/merchant/payout-methods": function () { return { methods: [{ id: "pm1", kind: "sbp", currency: "RUB", label: "SBP · Sber", last4: "4567", verified: true, is_default: true }, { id: "pm2", kind: "bank", currency: "USD", label: "USD account", last4: "9012", verified: false, is_default: false }] } },
    "/api/merchant/payouts": function () { return { payouts: [{ id: "po1", currency: "RUB", amount: 5000, fee: 0, net: 5000, status: "requested", reference: null, reason: null, method_snapshot: { kind: "sbp", label: "SBP · Sber", last4: "4567" }, requested_at: new Date(now - 7200000).toISOString(), decided_at: null, paid_at: null }, { id: "po0", currency: "RUB", amount: 42000, fee: 0, net: 42000, status: "paid", reference: "SBP-889", reason: null, method_snapshot: { kind: "sbp", label: "SBP · Sber", last4: "4567" }, requested_at: new Date(now - 864000000).toISOString(), decided_at: null, paid_at: new Date(now - 800000000).toISOString() }] } }
  }
  var real = window.fetch.bind(window)
  window.fetch = function (url, init) {
    var u = String(url)
    var m = u.match(/\/api\/merchant\/[a-z0-9\/-]+?(?=\?|$)/)
    var path = m && m[0]
    var method = ((init && init.method) || "GET").toUpperCase()
    if (path && /^\/api\/merchant\//.test(path)) {
      var one = path.match(/^\/api\/merchant\/(orders|products)\/([^/]+)$/)
      if (method === "GET" && one) {
        var list = one[1] === "orders" ? [order(1, "new", 3), order(2, "new", 11), order(3, "accepted", 40)] : products
        var hit = list.find(function (x) { return x.id === one[2] }) || list[0]
        return Promise.resolve(new Response(JSON.stringify(one[1] === "orders" ? { order: hit, events: [{ id: "ev1", kind: "paid", created_at: new Date(now - 600000).toISOString(), message: "Payment received." }] } : { product: hit }), { status: 200, headers: { "Content-Type": "application/json" } }))
      }
      if (method === "GET" && routes[path]) return Promise.resolve(new Response(JSON.stringify(routes[path]()), { status: 200, headers: { "Content-Type": "application/json" } }))
      if (method !== "GET") return Promise.resolve(new Response(JSON.stringify({ ok: true, order: order(1, "accepted", 3), product: products[0], fee: 0, net: 0 }), { status: 200, headers: { "Content-Type": "application/json" } }))
    }
    return real(url, init)
  }
  var sessionKey = Object.keys(localStorage).find(function (k) { return /^sb-.*-auth-token$/.test(k) })
  document.addEventListener("DOMContentLoaded", function () {})
  window.__MOCK_SESSION__ = { access_token: jwt, refresh_token: "r", expires_at: exp, expires_in: 86400, token_type: "bearer", user: { id: "u1", email: "mama@example.com", aud: "authenticated", app_metadata: {}, user_metadata: {} } }
  var ref = (document.querySelector('meta[name="supabase-ref"]') || {}).content
  var storageKey = key
  try { localStorage.setItem(storageKey, JSON.stringify(window.__MOCK_SESSION__)) } catch (e) {}
})()
