import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { pathBelongsTo, signedDocumentUrl, DOCUMENTS_BUCKET } from "@/lib/merchant/storage"
import { audit } from "@/lib/merchant/audit"

const db = () => createServerClient()

export const GET = merchantRoute("documents", async (_req, { merchant }) => {
  const { data, error } = await db().from("merchant_documents").select("id,kind,file_name,status,expires_at,reason,created_at").eq("merchant_id", merchant.id).order("created_at", { ascending: false })
  check(error)
  return { documents: data || [] }
})

/** Register a file already uploaded through /api/merchant/uploads (kind=document). */
export const POST = merchantRoute("documents", async (req, { user, merchant }) => {
  const body = await readJson(req)
  const kind = String(body.kind || "").trim().slice(0, 48)
  const path = String(body.path || "")
  assert(/^[a-z0-9_]+$/.test(kind), "KIND_INVALID")
  assert(pathBelongsTo(merchant.id, path), "PATH_INVALID", 400)
  const expires = body.expiresAt ? String(body.expiresAt) : null
  if (expires) assert(/^\d{4}-\d{2}-\d{2}$/.test(expires) && new Date(expires) > new Date(), "EXPIRY_INVALID")
  const { data, error } = await db()
    .from("merchant_documents")
    .insert({ merchant_id: merchant.id, kind, file_path: path, file_name: String(body.fileName || "").slice(0, 120) || null, expires_at: expires })
    .select("id,kind,file_name,status,expires_at,created_at")
    .single()
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "document.added", entityType: "merchant_document", entityId: data!.id, details: { kind } })
  return { document: data }
})
