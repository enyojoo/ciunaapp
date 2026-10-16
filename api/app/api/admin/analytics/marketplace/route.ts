import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert } from "@/lib/merchant/errors"
import { MerchantError } from "@/lib/merchant/errors"

/** ?from=YYYY-MM-DD&to=YYYY-MM-DD (UTC, `to` inclusive). Default: last 30 days. */
export const GET = adminRoute("audit.read", async (req) => {
  const sp = new URL(req.url).searchParams
  const day = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
  const toDay = day(sp.get("to"))
  const fromDay = day(sp.get("from"))
  const to = toDay ? new Date(new Date(`${toDay}T00:00:00Z`).getTime() + 86400000) : new Date()
  const from = fromDay ? new Date(`${fromDay}T00:00:00Z`) : new Date(to.getTime() - 30 * 86400000)
  assert(!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to > from, "RANGE_INVALID")
  const { data, error } = await createServerClient().rpc("marketplace_analytics", { p_from: from.toISOString(), p_to: to.toISOString() })
  if (error) throw new MerchantError(String(error.message).includes("RANGE_INVALID") ? "RANGE_INVALID" : "UNAVAILABLE", String(error.message).includes("RANGE_INVALID") ? 400 : 503)
  return data
})
