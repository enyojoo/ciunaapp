import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { buildSellerService, requireExpertProfile } from "@/lib/merchant/expert"
import { audit } from "@/lib/merchant/audit"

export const GET = merchantRoute("catalog", async (_req, { merchant }) => {
  const profile = await requireExpertProfile(merchant)
  const server = createServerClient()
  const { data, error } = await server.from("expert_services").select("*").eq("expert_profile_id", profile.id).order("sort_order", { ascending: true }).order("updated_at", { ascending: false })
  check(error)
  const services = data || []
  const counts: Record<string, number> = {}
  if (services.length) {
    const now = new Date()
    const { data: slots, error: se } = await server
      .from("expert_service_slots")
      .select("expert_service_id")
      .in("expert_service_id", services.map((s: any) => s.id))
      .eq("status", "available")
      .gt("slot_start", now.toISOString())
      .lt("slot_start", new Date(now.getTime() + 14 * 86_400_000).toISOString())
    check(se)
    for (const s of slots || []) counts[(s as any).expert_service_id] = (counts[(s as any).expert_service_id] || 0) + 1
  }
  return { services: services.map((s: any) => ({ ...s, upcoming_slots: counts[s.id] || 0 })) }
})

export const POST = merchantRoute("catalog", async (req, { user, merchant }) => {
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  const profile = await requireExpertProfile(merchant)
  const row: Record<string, any> = { ...buildSellerService(await readJson(req), profile.id, null), review_status: "pending" }
  if (row.is_published) assert(merchant.status === "live", "MERCHANT_NOT_LIVE", 409)
  const { data, error } = await createServerClient().from("expert_services").insert(row).select("*").single()
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "expert_service.created", entityType: "expert_service", entityId: data!.id, details: { published: row.is_published } })
  return { service: data }
})
