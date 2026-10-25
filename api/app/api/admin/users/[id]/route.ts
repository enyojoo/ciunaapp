import { adminRoute } from "@/lib/merchant/http"
import { MerchantError } from "@/lib/merchant/errors"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/** One customer's profile and KYC state (users.read). */
export const GET = adminRoute("users.read", async (_req, _admin, params) => {
  if (!params.id) throw new MerchantError("INVALID_REQUEST", 400)
  const { data, error } = await createServerClient()
    .from("users")
    .select("id, email, first_name, last_name, phone, kyc_status, kyc_rejection_reasons")
    .eq("id", params.id)
    .single()
  if (error || !data) throw new MerchantError("NOT_FOUND", 404)
  return data
})
