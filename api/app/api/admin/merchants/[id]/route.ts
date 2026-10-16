import { adminRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { getMerchant, resolveKybProfile } from "@/lib/merchant/service"
import { signedDocumentUrl } from "@/lib/merchant/storage"
import { audit } from "@/lib/merchant/audit"

export const GET = adminRoute("merchants.review", async (_req, _admin, params) => {
  const merchant = await getMerchant(params.id)
  const db = createServerClient()
  const [members, applications, documents, audits] = await Promise.all([
    db.from("merchant_members").select("user_id, role, users(email, first_name, last_name)").eq("merchant_id", merchant.id),
    db.from("merchant_applications").select("*").eq("merchant_id", merchant.id).order("submitted_at", { ascending: false }),
    db.from("merchant_documents").select("*").eq("merchant_id", merchant.id).order("created_at", { ascending: false }),
    db.from("audit_log").select("id,actor_kind,actor_id,actor_role,action,details,created_at").eq("merchant_id", merchant.id).order("created_at", { ascending: false }).limit(50),
  ])
  check(members.error); check(applications.error); check(documents.error); check(audits.error)
  const latest = applications.data?.[0]
  const tier = Number(latest?.answers?.tier) || 0
  const kyb = tier ? await resolveKybProfile(merchant.country, merchant.type, tier) : null
  const docs = await Promise.all((documents.data || []).map(async (d: any) => ({ ...d, url: await signedDocumentUrl(d.file_path) })))
  return { merchant, members: members.data || [], applications: applications.data || [], documents: docs, kyb, audit: audits.data || [] }
})

/** Office edits to commercial fields only (owner team, office-managed flag). Content stays with the seller. */
export const PATCH = adminRoute("merchants.manage", async (req, admin, params) => {
  const body = await readJson(req)
  const patch: Record<string, any> = {}
  if (typeof body.owner_team === "string") patch.owner_team = body.owner_team.trim().slice(0, 40) || "operations"
  assert(Object.keys(patch).length > 0, "NOTHING_TO_UPDATE")
  const { error } = await createServerClient().from("merchants").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", params.id)
  check(error)
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, merchantId: params.id, action: "merchant.updated", entityType: "merchant", entityId: params.id, details: patch })
  return { ok: true }
})
