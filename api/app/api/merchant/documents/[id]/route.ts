import { merchantRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { DOCUMENTS_BUCKET } from "@/lib/merchant/storage"
import { audit } from "@/lib/merchant/audit"

/** A seller may remove a document only while it is pending or rejected; approved documents stay on record. */
export const DELETE = merchantRoute("documents", async (_req, { user, merchant }, params) => {
  const db = createServerClient()
  const { data, error } = await db.from("merchant_documents").select("id,file_path,status").eq("id", params.id).eq("merchant_id", merchant.id).maybeSingle()
  check(error)
  assert(data, "DOCUMENT_NOT_FOUND", 404)
  assert(data.status !== "approved", "DOCUMENT_LOCKED", 409)
  const del = await db.from("merchant_documents").delete().eq("id", data.id)
  check(del.error)
  await db.storage.from(DOCUMENTS_BUCKET).remove([data.file_path])
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "document.removed", entityType: "merchant_document", entityId: data.id })
  return { ok: true }
})
