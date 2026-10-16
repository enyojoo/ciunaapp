import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createSignedUpload } from "@/lib/merchant/storage"
import { assert, MerchantError } from "@/lib/merchant/errors"
import { rateLimit, LIMITS } from "@/lib/rate-limit"

/** Returns a signed direct-to-storage upload. Images are public (listing media); documents are private. */
export const POST = merchantRoute(null, async (req, { merchant }) => {
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  if (!(await rateLimit(`upload:merchant:${merchant.id}`, LIMITS.upload.limit, LIMITS.upload.windowSeconds))) throw new MerchantError("RATE_LIMITED", 429)
  const body = await readJson(req)
  assert(body.kind === "image" || body.kind === "document", "KIND_INVALID")
  return createSignedUpload(merchant.id, body.kind, String(body.mimeType || ""), String(body.folder || "misc"))
})
