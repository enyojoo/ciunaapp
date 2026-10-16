#!/usr/bin/env node
// D0: captures the running Expo web app (current product) into design-system/reference/current-app/shots/.
// Demo data only: Supabase and hub API calls are answered by this script, so no real account or order is used.
// Needs the Expo web dev server (`npm run web -w mobile`, port 8082) and Playwright chromium.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const out = path.join(root, "design-system/reference/current-app/shots")
const BASE = process.env.APP_URL || "http://localhost:8082"
const REF = "seeqjiebmrnolcyydewj"
fs.mkdirSync(out, { recursive: true })

const now = new Date().toISOString()
const vendor = { id: "v1", name: "Mama T's Kitchen", slug: "mama-ts-kitchen", photo_url: null, service_line_slug: "food", is_verified: true, location: "Moscow, Tverskaya", pickup_location: "Tverskaya 12, counter by the entrance", pickup_hours: "Mon–Sat 10:00–20:00", hours_configured: true, is_open: true, closes_at: "21:00", opens_at: null, min_order_amount: 1500, min_order_currency: "RUB", verification_tier: 2, fulfillment_notes: "Call ahead for orders over 5 kg." }
const base = (id, title, sub, price, sale, cat, extra = {}) => ({
  id, title, short_description: sub, image_url: null, list_price: price, sale_price: sale, fixed_amount: sale ?? price,
  fixed_currency: "RUB", default_input_currency: "RUB", service_line_slug: "food", category: cat, vendor_id: "v1", vendor,
  status: "live", sold_out: false, stock_quantity: null, fulfillment_type: "in_person", fulfillment_mode: "delivery",
  pricing_type: "fixed", is_featured: false, updated_at: now, created_at: now, sla_text: "Ready in 30 min", ...extra,
})
const products = [
  base("p1", "Jollof rice with chicken", "Home cooking, made fresh daily", 500, 450, "Meals"),
  base("p2", "Egusi soup with pounded yam", "Slow-cooked with spinach", 700, null, "Meals"),
  base("p3", "Chin chin (200 g)", "Crunchy snack, packed", 250, null, "Snacks"),
  base("p4", "Zobo drink, 1 L", "Hibiscus, chilled", 180, 160, "Drinks", { sold_out: true }),
]
const profile = { id: "demo-user", email: "amara@example.com", first_name: "Amara", last_name: "Okafor", status: "active", preferred_language: "en", base_currency: "RUB", kyc_status: "approved", avatar_url: null }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url")
const exp = Math.floor(Date.now() / 1000) + 86400
const session = { access_token: [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: profile.id, aud: "authenticated", role: "authenticated", exp, email: profile.email }), "sig"].join("."), refresh_token: "demo", expires_at: exp, expires_in: 86400, token_type: "bearer", user: { id: profile.id, email: profile.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: { first_name: "Amara", last_name: "Okafor" }, created_at: now } }

const serviceLines = () => {
  const row = (i, slug, title, short, grid_kind, route_path = null) => ({ id: `sl-${slug}`, slug, title, short_description: short, sort_order: i, is_enabled: true, icon_url: null, icon_key: null, grid_kind, route_path, href: null, created_at: now, updated_at: now })
  return [
    row(1, "food", "Food", "Meals from home kitchens", "hub_category"),
    row(2, "mart", "Mart", "Groceries and spices", "hub_category"),
    row(3, "send", "Send", "Money to family abroad", "app_link", "/send"),
    row(4, "experts", "Experts", "Lawyers, tutors, translators", "hub_category"),
  ]
}
const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })
let filledCart = false
async function mock(page) {
  await page.route(/supabase\.co/, async (route) => {
    const req = route.request()
    if (req.resourceType() === "image") return route.continue()
    const u = req.url()
    if (u.includes("/auth/v1/user")) return json(route, session.user)
    if (u.includes("/rest/v1/users")) {
      const accept = route.request().headers()["accept"] || ""
      return json(route, accept.includes("object") ? profile : [profile])
    }
    return json(route, [])
  })
  await page.route(/localhost:3002|api\.ciuna\.com/, async (route) => {
    const u = new URL(route.request().url())
    const p = u.pathname
    const q = u.searchParams
    if (p === "/api/hub/products") return json(route, { products })
    if (p === "/api/hub/service-lines") return json(route, { serviceLines: serviceLines() })
    if (p === "/api/hub/vendors") return json(route, { vendors: [vendor] })
    if (p === `/api/hub/vendors/${vendor.slug}`) return json(route, { vendor })
    if (p === `/api/hub/vendors/${vendor.slug}/products`) return json(route, { products })
    const m = p.match(/^\/api\/hub\/products\/(.+)$/)
    if (m) { const pr = products.find((x) => x.id === m[1]); return pr ? json(route, { product: pr }) : json(route, { error: "Not found" }, 404) }
    if (p === "/api/hub/checkout/preview") {
      const future = new Date(Date.now() + 15 * 60000).toISOString()
      return json(route, { quote: { id: "q1", expiresAt: future, source: { kind: "cart", cartId: "c1" }, line: "food", title: "Mama T's Kitchen", lines: [{ id: "ci1", productId: "p1", quantity: 2, title: "Jollof rice with chicken", unitPrice: 450, feePercent: 0, fields: [] }, { id: "ci2", productId: "p3", quantity: 1, title: "Chin chin (200 g)", unitPrice: 250, feePercent: 0, fields: [] }], totals: { productCurrency: "RUB", payCurrency: "RUB", subtotal: 1150, marketplaceFee: 0, deliveryFee: 0, exchangeRate: 1, convertedSubtotal: 1150, corridorFee: 0, total: 1150 }, modes: ["delivery"], fulfillmentMode: "delivery", zones: [], requirePhone: false, methods: [], payCurrencies: ["RUB"], instructions: "", checkoutReady: true, snapshot: null } })
    }
    if (p === "/api/hub/cart") {
      if (!filledCart) return json(route, { cart: null, items: [] })
      const items = [
        { id: "ci1", cart_id: "c1", hub_product_id: "p1", quantity: 2, product: products[0] },
        { id: "ci2", cart_id: "c1", hub_product_id: "p3", quantity: 1, product: products[2] },
      ]
      return json(route, { cart: { id: "c1", user_id: profile.id, service_line_slug: "food", vendor_id: "v1", vendor, status: "active", items } })
    }
    if (p === "/api/hub/orders/o1/messages") {
      const now = Date.now()
      const messages = [
        { id: 1, senderKind: "customer", body: "Hi, is my order on the way?", language: "en", createdAt: new Date(now - 3600000).toISOString(), readAt: new Date(now - 3500000).toISOString() },
        { id: 2, senderKind: "merchant", body: "Yes, it is being packed. About 20 minutes.", language: "en", createdAt: new Date(now - 1800000).toISOString(), readAt: null },
        { id: 3, senderKind: "customer", body: "Thank you. Please add extra chilli.", language: "en", createdAt: new Date(now - 600000).toISOString(), readAt: new Date(now - 300000).toISOString() },
      ]
      return json(route, { messages, closed: false, available: true })
    }
    if (p === "/api/hub/orders/o1") {
      const totals = { productCurrency: "RUB", payCurrency: "RUB", subtotal: 1150, marketplaceFee: 0, deliveryFee: 0, exchangeRate: 1, convertedSubtotal: 1150, corridorFee: 0, total: 1150 }
      const lines = [{ id: "ci1", productId: "p1", quantity: 2, title: "Jollof rice with chicken", unitPrice: 450, feePercent: 0, fields: [] }, { id: "ci2", productId: "p3", quantity: 1, title: "Chin chin (200 g)", unitPrice: 250, feePercent: 0, fields: [] }]
      const snapshot = { id: "q1", expiresAt: new Date(Date.now() + 900000).toISOString(), source: { kind: "cart", cartId: "c1" }, line: "food", title: "Mama T's Kitchen", lines, totals, modes: ["delivery"], fulfillmentMode: "delivery", zones: [], requirePhone: false, methods: [], payCurrencies: ["RUB"], instructions: "", checkoutReady: true, snapshot: null, contactName: "Amara N.", contactPhone: "+7 900 000 00 00", contactEmail: "amara@example.com", deliveryAddressLine: "Tverskaya 1, apt 12", note: "" }
      const attempts = [{ id: "a1", rail: "yookassa", state: "succeeded", confirmation_mode: "embedded", instructions: {} }]
      return json(route, { order: { id: "o1", transaction_id: "t1", public_id: "CU-1042", line: "food", payment_state: "paid", fulfillment_state: "in_progress", fulfillment_mode: "delivery", payment_deadline: new Date(Date.now() + 900000).toISOString(), snapshot, owner_team: "marketplace", created_at: new Date(Date.now() - 7200000).toISOString(), attempts, events: [], canCancel: false, nextAction: "track", seller: { name: "Mama T's Kitchen" } } })
    }
    if (p === "/api/expert/profiles/ada-obi") return json(route, { profile: { id: "e1", slug: "ada-obi", display_name: "Ada Obi", headline: "Nutritionist for expats", bio: "I help people abroad eat well on a budget.", category: "Health", image_url: null, service_area: "Moscow and online", rating_avg: 4.8, rating_count: 12, languages: ["en", "ru", "fr"], time_zone: "Africa/Lagos", credentials: [{ title: "MSc Nutrition", issuer: "UCL", year: 2019 }], years_experience: 7, is_verified: true, verification_tier: 2 }, services: [] })
    if (p === "/api/expert/profiles/ada-obi/reviews" || p.startsWith("/api/expert/profiles/ada-obi/reviews")) return json(route, { summary: { avg: 4.8, count: 12, distribution: { "1": 0, "2": 0, "3": 1, "4": 2, "5": 9 } }, reviews: [], hasMore: false })
    if (p === "/api/hub/favorites") return json(route, { keys: [], vendors: [], experts: [], products: [] })
    if (p.startsWith("/api/referrals")) return json(route, { slug: "amara", balance: 0 })
    return route.continue()
  })
}

const SHOTS = [
  { name: "food-home", path: "/hub/food", wait: 2500, full: false },
  { name: "food-home-full", path: "/hub/food", wait: 2500, full: true },
  { name: "product-page", path: "/hub/food/p/p1", wait: 2500, full: true },
  { name: "store-page", path: "/hub/food/v/mama-ts-kitchen", wait: 2500, full: true },
  { name: "cart-empty", path: "/hub/food/cart", wait: 2000, full: true },
  { name: "cart-filled", path: "/hub/food/cart", wait: 2500, full: true, filled: true },
  { name: "checkout-page", path: "/hub/food/checkout", wait: 3000, full: true, filled: true },
  { name: "expert-profile", path: "/experts/ada-obi", wait: 2500, full: true },
  { name: "order-chat", path: "/orders/o1/chat", wait: 2500, full: true },
  { name: "order-detail", path: "/orders/o1", wait: 2500, full: true },
  { name: "more", path: "/more", wait: 2000, full: true },
  { name: "home", path: "/hub", wait: 2500, full: true },
]
const only = process.argv.slice(2)
const browser = await chromium.launch()
const [VW, VH] = (process.env.CAPTURE_VIEWPORT || "375x812").split("x").map(Number)
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "en-US" })
const page = await ctx.newPage()
if (process.env.CAPTURE_DEBUG) page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text().slice(0, 300)) })
if (process.env.CAPTURE_DEBUG) page.on("response", (r) => { if (r.status() >= 400) console.error("http", r.status(), r.url().slice(0, 140)) })
if (process.env.CAPTURE_DEBUG) page.on("pageerror", (e) => console.error("pageerror:", String(e).slice(0, 300)))
await mock(page)
// seed the session before the app boots
await page.addInitScript((s) => { try { localStorage.setItem(`sb-${s.ref}-auth-token`, JSON.stringify(s.session)) } catch {} }, { ref: REF, session })
const failed = []
for (const shot of SHOTS) {
  if (only.length && !only.includes(shot.name)) continue
  filledCart = Boolean(shot.filled)
  await page.goto(BASE + shot.path, { waitUntil: "load", timeout: 60000 }).catch((e) => failed.push(`${shot.name}: ${e.message}`))
  await page.waitForTimeout(shot.wait)
  const where = new URL(page.url()).pathname
  if (where.startsWith("/auth")) { failed.push(`${shot.name}: redirected to ${where} (no session)`); continue }
  const tag = process.env.CAPTURE_VIEWPORT ? `-${VW}x${VH}` : ""
  await page.screenshot({ path: path.join(out, `${shot.name}${tag}.png`), fullPage: shot.full })
  console.log(`captured ${shot.name} (${where})`)
}
await browser.close()
if (failed.length) { console.error(failed.join("\n")); process.exit(1) }
