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
const vendor = { id: "v1", name: "Mama T's Kitchen", slug: "mama-ts-kitchen", photo_url: null, service_line_slug: "food", is_verified: true, location: "Moscow, Tverskaya" }
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
async function mock(page) {
  await page.route(/supabase\.co/, async (route) => {
    const u = route.request().url()
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
    if (p === "/api/hub/cart") return json(route, { cart: null, items: [] })
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
  { name: "more", path: "/more", wait: 2000, full: true },
  { name: "home", path: "/hub", wait: 2500, full: true },
]
const only = process.argv.slice(2)
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "en-US" })
const page = await ctx.newPage()
await mock(page)
// seed the session before the app boots
await page.addInitScript((s) => { try { localStorage.setItem(`sb-${s.ref}-auth-token`, JSON.stringify(s.session)) } catch {} }, { ref: REF, session })
const failed = []
for (const shot of SHOTS) {
  if (only.length && !only.includes(shot.name)) continue
  await page.goto(BASE + shot.path, { waitUntil: "load", timeout: 60000 }).catch((e) => failed.push(`${shot.name}: ${e.message}`))
  await page.waitForTimeout(shot.wait)
  const where = new URL(page.url()).pathname
  if (where.startsWith("/auth")) { failed.push(`${shot.name}: redirected to ${where} (no session)`); continue }
  await page.screenshot({ path: path.join(out, `${shot.name}.png`), fullPage: shot.full })
  console.log(`captured ${shot.name} (${where})`)
}
await browser.close()
if (failed.length) { console.error(failed.join("\n")); process.exit(1) }
