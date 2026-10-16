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
  var ROLES = { owner: ["profile", "catalog", "orders", "availability", "messages", "earnings", "payouts", "team", "documents"], manager: ["profile", "catalog", "orders", "availability", "messages", "earnings", "documents"], staff: ["catalog", "orders", "availability", "messages"], finance: ["orders", "earnings", "payouts"] }
  var roleName = new URLSearchParams(location.search).get("role") || localStorage.getItem("mock.role") || "owner"
  if (!ROLES[roleName]) roleName = "owner"
  localStorage.setItem("mock.role", roleName)
  var merchant = { id: "m1", type: type, slug: "s-demo", display_name: type === "store" ? "Mama T's Kitchen" : "Dr. Amina Yusuf, immigration lawyer", status: new URLSearchParams(location.search).get("status") || "live", country: "NG", operating_country: "RU", languages: ["en", "ru"], default_language: "en", default_currency: "RUB", logo_url: null, cover_url: null, description: { en: "Nigerian home cooking delivered across Moscow." }, contact_email: "mama@example.com", contact_phone: "+79991234567", website: null, role: roleName, permissions: ROLES[roleName], rejection_reason: null, kyb_tier: 1, service_line: type === "store" ? "food" : null }
  function order(i, status, min, mode, dueMin) {
    var live = status === "new" || status === "accepted" || status === "preparing"
    var due = dueMin !== undefined ? dueMin : (status === "new" ? 8 : 30)
    var booking = mode === "online_appointment" || mode === "in_person_appointment"
    return { id: "o" + i, publicId: "CIU-100" + i, line: booking ? "experts" : type === "store" ? "food" : "experts", status: status, paymentState: "paid", fulfillmentMode: mode || "delivery", createdAt: new Date(now - min * 60000).toISOString(), dueAt: live ? new Date(now + due * 60000).toISOString() : null, overdue: live && due < 0, title: "Mama T · 2", items: booking ? [{ id: "a", title: "Residence permit consultation", quantity: 1, unitPrice: 3000 }] : [{ id: "a", title: "Jollof rice", quantity: 2, unitPrice: 450 }, { id: "b", title: "Fried plantain", quantity: 1, unitPrice: 200 }], totals: { currency: "RUB", subtotal: booking ? 3000 : 1100, deliveryFee: booking ? 0 : 150 }, customer: { name: i % 2 ? "Amara Okafor" : "Ivan Petrov", phone: "+79161234567", email: "amara@example.com" }, delivery: { address: "Moscow, Tverskaya 12, apt 5", pickupLocation: null, pickupHours: null }, note: "No pepper please", slot: booking ? { start: new Date(now + 2 * 86400000).toISOString(), end: new Date(now + 2 * 86400000 + 3600000).toISOString(), timezone: "Europe/Moscow" } : null, digitalContent: null, actions: status === "new" ? ["accept", "reject"] : status === "accepted" ? ["start", "fulfill"] : status === "preparing" ? ["fulfill"] : [], exception: null, rejectReason: status === "cancelled" ? "Out of stock today." : null }
  }
  function allOrders() { return [order(1, "new", 3, "delivery", 3), order(2, "new", 11, "delivery", -6), order(4, "new", 20, type === "expert" ? "online_appointment" : "pickup", 40), order(3, "accepted", 40), order(5, "preparing", 70), order(6, "completed", 600), order(7, "cancelled", 900)] }
  function byTab(tab) { var all = allOrders(); return tab === "new" ? all.filter(function (o) { return o.status === "new" }) : tab === "active" ? all.filter(function (o) { return o.status === "accepted" || o.status === "preparing" }) : tab === "done" ? all.filter(function (o) { return o.status === "completed" }) : tab === "cancelled" ? all.filter(function (o) { return o.status === "cancelled" }) : all }
  var products = [
    { id: "p1", title: "Jollof rice", status: "live", list_price: 500, sale_price: 450, fixed_currency: "RUB", stock_quantity: 12, sold_out: false, image_url: null, review_status: "approved", category: "Meals", fulfillment_mode: "delivery", gallery: [], translations: {}, service_line_slug: "food" },
    { id: "p2", title: "Egusi soup with pounded yam", status: "draft", list_price: 700, sale_price: null, fixed_currency: "RUB", stock_quantity: null, sold_out: false, image_url: null, review_status: "pending", category: "Meals", fulfillment_mode: "pickup", gallery: [], translations: {}, service_line_slug: "food" },
    { id: "p3", title: "Chin chin (200 g)", status: "live", list_price: 250, sale_price: null, fixed_currency: "RUB", stock_quantity: 0, sold_out: true, image_url: null, review_status: "rejected", review_note: "Photo is unclear.", category: "Snacks", fulfillment_mode: "delivery", gallery: [], translations: {}, service_line_slug: "food" }
  ]
  var services = [{ id: "s1", title: "Residence permit consultation", is_published: true, pricing_type: "hourly", hourly_rate: 3000, hourly_currency: "RUB", default_duration_minutes: 60, fulfillment_type: "online", upcoming_slots: 14, review_status: "approved", meeting_instructions: "Zoom link sent after booking", timezone: "Europe/Moscow", translations: {} }, { id: "s2", title: "Document check", is_published: false, pricing_type: "fixed", fixed_amount: 5000, fixed_currency: "RUB", default_duration_minutes: 30, fulfillment_type: "both", upcoming_slots: 0, review_status: "pending", meeting_instructions: "", timezone: "Europe/Moscow", translations: {} }]
  var routes = {
    "/api/merchant/me": function () { return { user: { id: "u1", email: "mama@example.com", name: "Mama T" }, merchants: [merchant], invites: [] } },
    "/api/merchant/orders": function (u) { var tab = new URLSearchParams((u.split("?")[1] || "")).get("status") || "new"; var l = byTab(tab); return { orders: l, total: l.length, counts: { new: byTab("new").length, active: byTab("active").length } } },
    "/api/merchant/products": function () { return { products: products, total: products.length } },
    "/api/merchant/application": function () { return { status: merchant.status, answers: { tier: 1, fields: {} }, application: null, checklist: [{ key: "profile", done: true }, { key: "logo", done: false }, { key: "tier", done: true }, { key: "kyb_fields", done: false }, { key: "kyb_documents", done: false }, { key: "first_listing", done: true }], ready: false, rejectionReason: null } },
    "/api/merchant/kyb": function () { return { tiers: [{ tier: 1, label: "Individual (any country)", requirements: { fields: [{ key: "full_name", label: "Full name", required: true }], documents: [{ kind: "passport", label: "Passport or national ID", required: true, expires: true }] } }, { tier: 2, label: "Registered business (any country)", requirements: { fields: [{ key: "registration_number", label: "Registration number", required: true }], documents: [{ kind: "registration_certificate", label: "Registration certificate", required: true, expires: false }] } }] } },
    "/api/merchant/documents": function () { return { documents: [{ id: "d1", kind: "passport", file_name: "passport.pdf", status: "pending", reason: null, expires_at: null }] } },
    "/api/merchant/fulfillment": function () { return { pickup: { location: "Moscow, Tverskaya 12", hours: "Mon–Sat 10:00–20:00" }, notes: null, zones: [{ id: "z1", city: "Moscow", district: "Center", fee: 150, currency: "RUB", active: true }] } },
    "/api/merchant/team": function () { return { members: [{ user_id: "u1", role: "owner", users: { email: "mama@example.com", first_name: "Mama", last_name: "T" } }], invites: [] } },
    "/api/merchant/expert/services": function () { return { services: services } },
    "/api/merchant/expert/bookings": function () { return { bookings: [], total: 0 } },
    "/api/merchant/earnings": function () { return { balances: [{ currency: "RUB", pending: 3420, available: 18250.5, inPayout: 5000, paidOut: 42000, lifetimeNet: 68670.5 }], minPayout: { RUB: 1000 }, holdDays: 2 } },
    "/api/merchant/earnings/items": function () { return { items: [{ id: "e1", order_id: "o1", currency: "RUB", subtotal: 1100, delivery_fee: 150, commission: 88, net: 1162, fee_rule: { line: "food", source: "service_line", percent: 8, fixed: null, currency: "RUB" }, status: "available", fulfilled_at: new Date(now - 86400000).toISOString(), release_at: new Date(now - 3600000).toISOString(), released_at: null, marketplace_orders: { public_id: "CIU-1001", line: "food" } }, { id: "e2", order_id: "o2", currency: "RUB", subtotal: 900, delivery_fee: 0, commission: 72, net: 828, fee_rule: { line: "food", source: "service_line", percent: 8, fixed: null, currency: "RUB" }, status: "pending", fulfilled_at: new Date(now - 3600000).toISOString(), release_at: new Date(now + 86400000).toISOString(), released_at: null, marketplace_orders: { public_id: "CIU-1002", line: "food" } }, { id: "e3", order_id: "o9", currency: "RUB", subtotal: 700, delivery_fee: 0, commission: 56, net: 644, fee_rule: { line: "food", source: "service_line", percent: 8, fixed: null, currency: "RUB" }, status: "reversed", reversed_reason: "Order refunded to the customer.", fulfilled_at: new Date(now - 3 * 86400000).toISOString(), release_at: null, released_at: null, marketplace_orders: { public_id: "CIU-0998", line: "food" } }], total: 3 } },
    "/api/merchant/payout-methods": function () { return { methods: [{ id: "pm1", kind: "sbp", currency: "RUB", label: "SBP · Sber", last4: "4567", verified: true, is_default: true }, { id: "pm2", kind: "bank", currency: "USD", label: "USD account", last4: "9012", verified: false, is_default: false }] } },
    "/api/merchant/payouts": function () { return { payouts: [{ id: "po1", currency: "RUB", amount: 5000, fee: 0, net: 5000, status: "requested", reference: null, reason: null, method_snapshot: { kind: "sbp", label: "SBP · Sber", last4: "4567" }, requested_at: new Date(now - 7200000).toISOString(), decided_at: null, paid_at: null }, { id: "po0", currency: "RUB", amount: 42000, fee: 0, net: 42000, status: "paid", reference: "SBP-889", reason: null, method_snapshot: { kind: "sbp", label: "SBP · Sber", last4: "4567" }, requested_at: new Date(now - 864000000).toISOString(), decided_at: null, paid_at: new Date(now - 800000000).toISOString() }] } }
  }
  var qs = new URLSearchParams(location.search)
  var paused = merchant.status === "paused"
  Object.assign(routes, {
    "/api/merchant/notifications": function () { return { prefs: { email: true, telegram: false, muted_kinds: [] }, telegram: { linked: false, username: null, botConfigured: false }, kinds: ["order_new", "booking_new", "message_new", "payout_update", "merchant_status", "listing_review"] } },
    "/api/merchant/reviews": function (u) {
      var needs = new URLSearchParams((u.split("?")[1] || "")).get("status") === "needs_reply"
      var all = [
        { id: "r1", rating: 5, body: "Best jollof in Moscow. Arrived hot and on time.", language: "en", created_at: new Date(now - 2 * 86400000).toISOString(), customer_first_name: "Amara", reply: null, reply_at: null, reply_editable: false, reply_editable_until: null },
        { id: "r2", rating: 4, body: "Tasty, a little late.", language: "en", created_at: new Date(now - 3 * 86400000).toISOString(), customer_first_name: "Ivan", reply: "Thank you Ivan, we are working on delivery times.", reply_at: new Date(now - 5 * 3600000).toISOString(), reply_editable: true, reply_editable_until: new Date(now + 19 * 3600000).toISOString() },
        { id: "r3", rating: 5, body: "", language: "en", created_at: new Date(now - 9 * 86400000).toISOString(), customer_first_name: null, reply: "Thanks!", reply_at: new Date(now - 8 * 86400000).toISOString(), reply_editable: false, reply_editable_until: new Date(now - 7 * 86400000).toISOString() }
      ]
      var list = needs ? all.filter(function (r) { return !r.reply }) : all
      return { summary: { avg: 4.7, count: 3, distribution: { "1": 0, "2": 0, "3": 0, "4": 1, "5": 2 } }, reviews: list, total: list.length, needs_reply: 1 }
    },
    "/api/merchant/messages": function () { return { threads: [{ orderId: "o1", publicId: "CIU-1001", customerName: "Amara Okafor", lastMessage: "Hi! Can you make it less spicy please?", lastFrom: "customer", lastAt: new Date(now - 600000).toISOString(), unread: 2, status: "new", closed: false }, { orderId: "o3", publicId: "CIU-1003", customerName: "Ivan Petrov", lastMessage: "Thank you, see you soon", lastFrom: "merchant", lastAt: new Date(now - 7200000).toISOString(), unread: 0, status: "accepted", closed: false }], unread: 2 } }
  })
  // Mirrors GET /api/merchant/home: sections appear only when the role may see them.
  routes["/api/merchant/home"] = function () {
    var r = { timeZone: "Europe/Moscow" }
    if (merchant.permissions.indexOf("earnings") > -1) r.today = { orders: 2, gross: 2150, fee: 160, net: 1990, currency: "RUB" }
    if (merchant.permissions.indexOf("catalog") > -1 && type === "store") r.lowStock = [{ id: "p1", title: "Egusi soup", stock: 2 }]
    if (merchant.permissions.indexOf("documents") > -1) r.documentsExpiring = [{ id: "d1", kind: "food_safety_certificate", expiresAt: new Date(now + 12 * 86400000).toISOString().slice(0, 10) }]
    if (merchant.permissions.indexOf("orders") > -1) { r.ordersToday = 5; r.delta = { orders: { direction: "up", amount: 2 } } }
    return r
  }
  var real = window.fetch.bind(window)
  window.fetch = function (url, init) {
    var u = String(url)
    var m = u.match(/\/api\/merchant\/[a-z0-9\/-]+?(?=\?|$)/)
    var path = m && m[0]
    var method = ((init && init.method) || "GET").toUpperCase()
    if (path && /^\/api\/merchant\//.test(path)) {
      var th = path.match(/^\/api\/merchant\/messages\/([^/]+)$/)
      if (th && method === "GET") return Promise.resolve(new Response(JSON.stringify({ closed: false, available: true, order: { id: th[1], publicId: "CIU-100" + th[1].slice(1), customerName: "Amara", status: "new" }, messages: [{ id: 1, senderKind: "customer", body: "Hi! Can you make it less spicy please?", language: "en", createdAt: new Date(now - 86400000).toISOString(), readAt: null }, { id: 2, senderKind: "merchant", body: "Of course, no problem.", language: "en", createdAt: new Date(now - 3600000).toISOString(), readAt: new Date(now - 3000000).toISOString() }, { id: 3, senderKind: "customer", body: "Thank you!", language: "en", createdAt: new Date(now - 600000).toISOString(), readAt: null }] }), { status: 200, headers: { "Content-Type": "application/json" } }))
      if (th && method === "POST") return Promise.resolve(new Response(JSON.stringify({ message: { id: Date.now(), senderKind: "merchant", body: JSON.parse((init && init.body) || "{}").body || "", language: "en", createdAt: new Date().toISOString(), readAt: null } }), { status: 200, headers: { "Content-Type": "application/json" } }))
      var sv = path.match(/^\/api\/merchant\/expert\/services\/([^/]+)(\/schedule|\/slots)?$/)
      if (sv && method === "GET") {
        var body
        if (sv[2] === "/schedule") body = { schedule: { timezone: "Europe/Moscow", window_start_date: new Date(now).toISOString().slice(0, 10), window_end_date: new Date(now + 60 * 86400000).toISOString().slice(0, 10), slot_duration_minutes: 60 }, weekly_rules: [1, 2, 3, 4, 5].map(function (d) { return { day_of_week: d, local_start_time: "10:00", local_end_time: "18:00", sort_order: 0 } }), preview: [0, 1, 2].map(function (i) { return { start: new Date(now + (i + 1) * 86400000).toISOString(), end: new Date(now + (i + 1) * 86400000 + 3600000).toISOString() } }) }
        else if (sv[2] === "/slots") body = { slots: [0, 1, 2, 3].map(function (i) { return { id: "sl" + i, expert_service_id: sv[1], slot_start: new Date(now + (i + 1) * 86400000).toISOString(), slot_end: new Date(now + (i + 1) * 86400000 + 3600000).toISOString(), status: i === 2 ? "booked" : "available", source: "rule" } }) }
        else body = { service: services.find(function (x) { return x.id === sv[1] }) || services[0] }
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }))
      }
      var one = path.match(/^\/api\/merchant\/(orders|products)\/([^/]+)$/)
      if (method === "GET" && one) {
        var list = one[1] === "orders" ? allOrders() : products
        var hit = list.find(function (x) { return x.id === one[2] }) || list[0]
        return Promise.resolve(new Response(JSON.stringify(one[1] === "orders" ? { order: hit, events: [{ id: "ev1", kind: "paid", created_at: new Date(now - 600000).toISOString(), message: "Payment received." }] } : { product: hit }), { status: 200, headers: { "Content-Type": "application/json" } }))
      }
      if (method === "GET" && routes[path]) return Promise.resolve(new Response(JSON.stringify(routes[path](u)), { status: 200, headers: { "Content-Type": "application/json" } }))
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
