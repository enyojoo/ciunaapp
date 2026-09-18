import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { EXPERT_CATALOG_JSON_CACHE_CONTROL } from "@/lib/expert-http-cache"
import { formatCurrencySymbolOnly } from "@/utils/currency"

const LIST_SELECT =
  "id, slug, display_name, headline, bio, is_published, category, image_url, service_area, created_at"

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const category = (searchParams.get("category") || "").trim()

  const server = createServerClient()
  let q = server.from("expert_profiles").select(LIST_SELECT).eq("is_published", true).order("display_name", { ascending: true })
  if (category) {
    q = q.eq("category", category)
  }
  const { data, error } = await q

  if (error) {
    console.error("expert profiles list", error)
    return createErrorResponse("Failed to load experts", 500)
  }

  const profiles = data || []
  const profileIds = profiles.map((p) => p.id).filter(Boolean)
  const pricingHints = new Map<string, string>()

  if (profileIds.length > 0) {
    const { data: svcRows, error: svcErr } = await server
      .from("expert_services")
      .select("expert_profile_id, pricing_type, hourly_rate, hourly_currency, fixed_amount, fixed_currency")
      .in("expert_profile_id", profileIds)
      .eq("is_published", true)

    if (!svcErr && svcRows) {
      for (const pid of profileIds) {
        const rows = svcRows.filter((r) => r.expert_profile_id === pid)
        let hourlyMin: { rate: number; cur: string } | null = null
        let fixedMin: { amt: number; cur: string } | null = null
        for (const r of rows) {
          if (r.pricing_type === "hourly" && r.hourly_rate != null && r.hourly_currency) {
            const rate = Number(r.hourly_rate)
            if (Number.isFinite(rate) && rate >= 0 && (!hourlyMin || rate < hourlyMin.rate)) {
              hourlyMin = { rate, cur: String(r.hourly_currency).toUpperCase() }
            }
          }
          if (r.pricing_type === "fixed" && r.fixed_amount != null && r.fixed_currency) {
            const amt = Number(r.fixed_amount)
            if (Number.isFinite(amt) && amt >= 0 && (!fixedMin || amt < fixedMin.amt)) {
              fixedMin = { amt, cur: String(r.fixed_currency).toUpperCase() }
            }
          }
        }
        if (hourlyMin)
          pricingHints.set(pid, `From ${formatCurrencySymbolOnly(hourlyMin.rate, hourlyMin.cur)}/hr`)
        else if (fixedMin) pricingHints.set(pid, `From ${formatCurrencySymbolOnly(fixedMin.amt, fixedMin.cur)}`)
        else if (rows.some((r) => r.pricing_type === "quote")) pricingHints.set(pid, "Custom quote")
      }
    } else if (svcErr) {
      console.error("expert profiles list pricing hints", svcErr)
    }
  }

  const enriched = profiles.map((p) => ({
    ...p,
    pricing_hint: pricingHints.get(p.id) ?? null,
  }))

  const res = NextResponse.json({ profiles: enriched })
  res.headers.set("Cache-Control", EXPERT_CATALOG_JSON_CACHE_CONTROL)
  return res
})
