/* Smoke-test and design-review mode. Loaded only when NEXT_PUBLIC_OFFICE_MOCK=1 (the production build refuses it).
   Fakes a signed-in super admin and answers every API and database read with an empty, well-formed result, so each
   Office page can be opened without a backend. Writes succeed locally and change nothing. */
(function () {
  var ref = document.documentElement.getAttribute("data-supabase-ref") || ""
  var key = "sb-" + ref + "-auth-token"
  var b64 = function (o) { return btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_") }
  var exp = Math.floor(Date.now() / 1000) + 86400
  var jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "a1", aud: "authenticated", role: "authenticated", exp: exp, email: "admin@example.com" }), "sig"].join(".")
  var session = { access_token: jwt, refresh_token: "r", expires_at: exp, expires_in: 86400, token_type: "bearer", user: { id: "a1", email: "admin@example.com", aud: "authenticated", app_metadata: {}, user_metadata: { isAdmin: true, role: "super_admin", name: "Mock Admin" } } }
  try { localStorage.setItem(key, JSON.stringify(session)) } catch (e) {}
  var ALL = ["merchants.read", "merchants.review", "merchants.manage", "listings.review", "orders.manage", "finance.manage", "fees.manage", "kyb.manage", "roles.manage", "audit.read", "support.read", "support.manage", "users.read", "users.manage", "rates.manage", "settings.manage", "transactions.manage", "catalog.manage", "experts.manage"]
  // Pages read fields the real API fills in. A missing field answers as an empty list so a page renders its empty state.
  function lenient(v) {
    if (v === null || typeof v !== "object") return v
    return new Proxy(v, {
      get: function (t, p) {
        if (p in t) { var x = t[p]; return typeof x === "function" ? x.bind(t) : lenient(x) }
        if (typeof p === "symbol" || p === "then" || p === "toJSON" || /^\d+$/.test(p)) return undefined
        return lenient([])
      },
    })
  }
  var json = function (body, status) {
    var res = new Response(JSON.stringify(body), { status: status || 200, headers: { "Content-Type": "application/json", "Content-Range": "0-0/0" } })
    res.json = function () { return Promise.resolve(lenient(JSON.parse(JSON.stringify(body)))) }
    return Promise.resolve(res)
  }
  var real = window.fetch.bind(window)
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input.url
    var method = ((init && init.method) || (typeof input !== "string" && input.method) || "GET").toUpperCase()
    var u
    try { u = new URL(url, location.href) } catch (e) { return real(input, init) }
    if (u.pathname === "/api/admin/me") return json({ id: "a1", email: "admin@example.com", name: "Mock Admin", role: "super_admin", legacyRole: false, permissions: ALL })
    if (/^\/api\/admin\/merchants\/[^/]+$/.test(u.pathname) && method === "GET") return json({ merchant: { id: "m1", type: "store", display_name: "Sample store", slug: "sample", status: "live", owner_team: "", country: "RU", default_currency: "RUB", contact_email: "store@example.com", created_at: new Date().toISOString() }, members: [], documents: [], kyb: null, application: null, audit: [], orders: [] })
    if (u.pathname.indexOf("/api/") === 0) return json(method === "GET" ? { items: [], data: [], rows: [], total: 0, count: 0 } : { ok: true, success: true })
    if (u.pathname.indexOf("/rest/v1/") === 0) {
      var wantsOne = init && init.headers && JSON.stringify(init.headers).indexOf("vnd.pgrst.object") >= 0
      if (method === "GET" || method === "HEAD") return wantsOne ? json({ message: "none" }, 406) : json([])
      return json([])
    }
    if (u.pathname.indexOf("/auth/v1/") === 0) {
      if (u.pathname.indexOf("/user") >= 0) return json(session.user)
      return json({ access_token: jwt, token_type: "bearer", expires_in: 86400, refresh_token: "r", user: session.user })
    }
    return real(input, init)
  }
})()
