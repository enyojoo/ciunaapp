#!/usr/bin/env node
// Read-only RLS probe. Signs in as nobody (the public anon key) and tries to read every table PostgREST exposes.
// A table may answer 401/403/404 or an empty list; any row is a leak. It never writes.
// Usage: node scripts/rls-probe.mjs   (reads NEXT_PUBLIC_SUPABASE_URL and the anon key from api/.env or the environment)
//        PUBLIC_TABLES=hub_products,hub_vendors  to name tables that are meant to be public (rows allowed)
import fs from "node:fs"

const env = { ...process.env }
if (fs.existsSync("api/.env")) {
  for (const line of fs.readFileSync("api/.env", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and the anon key"); process.exit(2) }
const PUBLIC = new Set((env.PUBLIC_TABLES || "hub_products,hub_vendors,hub_service_lines,expert_profiles,expert_services,expert_service_slots,marketplace_zones,currencies,exchange_rates,hub_reviews,product_reviews,reviews,hub_product_images,expert_availability,settings,system_settings").split(","))
const headers = { apikey: key, Authorization: `Bearer ${key}` }

const spec = await fetch(`${url}/rest/v1/`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
// Newer Supabase projects close the schema listing to anon, so fall back to the tables named in the migrations.
const fromMigrations = () => {
  const dir = "supabase/migrations"
  const names = new Set()
  for (const f of fs.readdirSync(dir)) for (const m of fs.readFileSync(`${dir}/${f}`, "utf8").matchAll(/create table(?: if not exists)?\s+(?:public\.)?"?([a-z_0-9]+)"?/gi)) names.add(m[1])
  if (fs.existsSync("docs/marketplace/schema-baseline.json")) for (const t of Object.keys(JSON.parse(fs.readFileSync("docs/marketplace/schema-baseline.json", "utf8")))) names.add(t)
  return [...names]
}
const tables0 = spec?.definitions ? Object.keys(spec.definitions) : spec?.paths ? Object.keys(spec.paths).filter((p) => p !== "/" && !p.startsWith("/rpc/")).map((p) => p.slice(1)) : []
const tables = tables0.length ? tables0 : fromMigrations()

const leaks = []
let denied = 0, empty = 0, publicOk = 0
for (const t of tables) {
  const r = await fetch(`${url}/rest/v1/${encodeURIComponent(t)}?select=*&limit=1`, { headers }).catch(() => null)
  if (!r) continue
  if (!r.ok) { denied++; continue }
  const rows = await r.json().catch(() => [])
  if (!Array.isArray(rows) || rows.length === 0) { empty++; continue }
  if (PUBLIC.has(t)) { publicOk++; continue }
  leaks.push(t)
}
console.log(`${tables.length} tables probed: ${denied} denied, ${empty} empty, ${publicOk} public by design, ${leaks.length} readable by anon`)
for (const t of leaks) console.error(`LEAK: anon can read rows from ${t}`)
process.exit(leaks.length ? 1 : 0)
