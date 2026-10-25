import { adminRoute } from "@/lib/merchant/http"
import { MerchantError } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/kyc/documents?path=identity/userId_filename.pdf
 * A short-lived signed URL for one KYC document. Office staff with `users.read` only; every open is audited.
 */
export const GET = adminRoute("users.read", async (req, admin) => {
  const filePath = req.nextUrl.searchParams.get("path") || ""
  if (!filePath || filePath.includes("..")) throw new MerchantError("INVALID_REQUEST", 400)
  const { data, error } = await createServerClient().storage.from("kyc-documents").createSignedUrl(filePath, 300)
  if (error || !data?.signedUrl) {
    if (String(error?.statusCode) === "404" || /not found/i.test(error?.message || "")) throw new MerchantError("NOT_FOUND", 404)
    throw new MerchantError("UNAVAILABLE", 503)
  }
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "document.viewed", entityType: "kyc_document", entityId: filePath })
  return { url: data.signedUrl }
})
