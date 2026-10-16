import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { cleanSearch, isMissingSchema, isUuid, searchKinds, SEARCH_LIMIT, type SearchKind } from "@/lib/merchant/office"

export const dynamic = "force-dynamic"

interface Hit { kind: SearchKind; id: string; title: string; subtitle: string; href: string }

/**
 * Cmd-K search across merchants, orders and payouts by id or name. Needs 2+ characters; at most 6 hits per kind;
 * a kind the caller's role may not read is left out (not an error). Unavailable tables are skipped.
 */
export const GET = adminRoute("merchants.read", async (req, admin) => {
  const q = cleanSearch(new URL(req.url).searchParams.get("q"))
  if (!q) return { results: [] as Hit[], min: 2 }
  const kinds = searchKinds(admin.role)
  const db = createServerClient()
  const uuid = isUuid(q)
  const like = `%${q}%`
  const keep = (error: any) => { if (error && !isMissingSchema(error)) console.error("search failed", error.code, error.message); return !error }

  const run: Record<SearchKind, () => Promise<Hit[]>> = {
    async merchant() {
      let b = db.from("merchants").select("id,type,status,display_name,slug").limit(SEARCH_LIMIT)
      b = uuid ? b.eq("id", q) : b.or(`display_name.ilike.${like},slug.ilike.${like}`)
      const { data, error } = await b
      return keep(error) ? (data || []).map((m: any) => ({ kind: "merchant" as const, id: m.id, title: m.display_name, subtitle: `${m.type} · ${String(m.status).replace("_", " ")}`, href: `/merchants/${m.id}` })) : []
    },
    async order() {
      let b = db.from("marketplace_orders").select("id,public_id,line,payment_state,fulfillment_state").limit(SEARCH_LIMIT)
      b = uuid ? b.eq("id", q) : b.ilike("public_id", like)
      const { data, error } = await b.order("created_at", { ascending: false })
      return keep(error) ? (data || []).map((o: any) => ({ kind: "order" as const, id: o.id, title: `Order ${o.public_id}`, subtitle: `${o.line} · ${String(o.fulfillment_state).replace(/_/g, " ")}`, href: `/marketplace?order=${o.id}` })) : []
    },
    async payout() {
      let ids: string[] = []
      if (!uuid) {
        const m = await db.from("merchants").select("id").ilike("display_name", like).limit(20)
        if (!keep(m.error)) return []
        ids = (m.data || []).map((r: any) => r.id)
        if (ids.length === 0) return []
      }
      let b = db.from("payouts").select("id,status,amount,currency,requested_at,merchants(display_name)").limit(SEARCH_LIMIT)
      b = uuid ? b.eq("id", q) : b.in("merchant_id", ids)
      const { data, error } = await b.order("requested_at", { ascending: false })
      return keep(error) ? (data || []).map((p: any) => ({ kind: "payout" as const, id: p.id, title: `Payout ${p.amount} ${p.currency}`, subtitle: `${p.merchants?.display_name ?? "Merchant"} · ${p.status}`, href: `/finance/payouts?id=${p.id}` })) : []
    },
  }
  const lists = await Promise.all(kinds.map((k) => run[k]().catch((e) => { console.error("search failed", k, e?.message); return [] as Hit[] })))
  return { results: lists.flat(), min: 2 }
})
