import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { canSelfTransition } from "@/lib/merchant/status"
import { syncPublication } from "@/lib/merchant/service"
import { audit } from "@/lib/merchant/audit"

/** Pause / resume selling. Only live <-> paused is self-service; everything else is Office. */
export const POST = merchantRoute("profile", async (req, { user, merchant }) => {
  const body = await readJson(req)
  const to = String(body.status)
  assert(["live", "paused"].includes(to), "STATUS_INVALID")
  assert(canSelfTransition(merchant.status, to), "MERCHANT_STATUS_NOT_ALLOWED", 409, { status: merchant.status })
  const { data, error } = await createServerClient().from("merchants").update({ status: to, updated_at: new Date().toISOString() }).eq("id", merchant.id).select("*").single()
  check(error)
  await syncPublication(data)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: `merchant.${to === "paused" ? "paused" : "resumed"}`, entityType: "merchant", entityId: merchant.id })
  return { status: to }
})
