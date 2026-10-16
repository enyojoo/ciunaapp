import { type NextRequest, NextResponse } from "next/server"
import { requireMerchant } from "@/lib/merchant/auth"
import { createServerClient } from "@/lib/supabase"
import { MerchantError } from "@/lib/merchant/errors"

const csv = (v: unknown) => {
  let s = String(v ?? "")
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}` // neutralise spreadsheet formulas
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Statement CSV. ?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive, UTC). */
export async function GET(request: NextRequest) {
  try {
    const { merchant } = await requireMerchant(request, "earnings")
    const sp = new URL(request.url).searchParams
    const from = sp.get("from"), to = sp.get("to")
    for (const d of [from, to]) if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new MerchantError("DATE_INVALID", 400)
    let q = createServerClient().from("merchant_earnings").select("currency,subtotal,delivery_fee,commission,net,status,fulfilled_at,released_at, marketplace_orders(public_id)").eq("merchant_id", merchant.id).order("fulfilled_at", { ascending: true }).limit(5000)
    if (from) q = q.gte("fulfilled_at", `${from}T00:00:00Z`)
    if (to) q = q.lt("fulfilled_at", new Date(new Date(`${to}T00:00:00Z`).getTime() + 86400000).toISOString())
    const { data, error } = await q
    if (error) throw new MerchantError("UNAVAILABLE", 503)
    const rows = [["order", "date", "currency", "items", "delivery", "ciuna_fee", "net", "status", "available_on"].join(",")]
    for (const r of data || []) rows.push([(r as any).marketplace_orders?.public_id, r.fulfilled_at, r.currency, r.subtotal, r.delivery_fee, r.commission, r.net, r.status, r.released_at ?? ""].map(csv).join(","))
    return new NextResponse(rows.join("\n") + "\n", { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ciuna-statement-${from || "all"}-${to || "now"}.csv"` } })
  } catch (e) {
    if (e instanceof MerchantError) return NextResponse.json({ error: e.code, errorCode: e.code }, { status: e.status })
    const message = e instanceof Error ? e.message : ""
    if (message === "Authentication required") return NextResponse.json({ error: message, errorCode: "UNAUTHENTICATED" }, { status: 401 })
    return NextResponse.json({ error: "UNAVAILABLE", errorCode: "UNAVAILABLE" }, { status: 503 })
  }
}
