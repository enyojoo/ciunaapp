import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createSignedUpload } from "@/lib/merchant/storage"
import { assert } from "@/lib/merchant/errors"

/** Returns a signed direct-to-storage upload. Images are public (listing media); documents are private. */
export const POST = merchantRoute(null, async (req, { merchant }) => {
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  const body = await readJson(req)
  assert(body.kind === "image" || body.kind === "document", "KIND_INVALID")
  return createSignedUpload(merchant.id, body.kind, String(body.mimeType || ""), String(body.folder || "misc"))
})
