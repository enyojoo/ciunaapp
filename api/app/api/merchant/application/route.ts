import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { applicationChecklist } from "@/lib/merchant/service"
import { canSelfTransition } from "@/lib/merchant/status"
import { audit } from "@/lib/merchant/audit"

const db = () => createServerClient()

async function latestApplication(merchantId: string) {
  const { data, error } = await db().from("merchant_applications").select("*").eq("merchant_id", merchantId).order("submitted_at", { ascending: false }).limit(1).maybeSingle()
  check(error)
  return data
}

/** Latest application plus the checklist the seller sees on Home. */
export const GET = merchantRoute(null, async (_req, { merchant }) => {
  const application = await latestApplication(merchant.id)
  const answers = ["draft", "rejected"].includes(merchant.status) ? merchant.draft_answers : (application?.answers as Record<string, any>) || merchant.draft_answers
  const checklist = await applicationChecklist(merchant, answers)
  return {
    status: merchant.status,
    answers,
    application: application ? { id: application.id, status: application.status, submitted_at: application.submitted_at, decision_reason: application.decision_reason } : null,
    checklist: checklist.items,
    ready: checklist.complete,
    rejectionReason: merchant.rejection_reason,
  }
})

/** Save tier + KYB field answers while still a draft (or after a rejection). */
export const PUT = merchantRoute("documents", async (req, { user, merchant }) => {
  assert(["draft", "rejected"].includes(merchant.status), "MERCHANT_STATUS_NOT_ALLOWED", 409, { status: merchant.status })
  const body = await readJson(req)
  const tier = Number(body.tier)
  assert(tier === 1 || tier === 2, "TIER_INVALID")
  const raw = body.fields && typeof body.fields === "object" && !Array.isArray(body.fields) ? body.fields : {}
  const fields: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) if (/^[a-z0-9_]{1,40}$/.test(k)) fields[k] = String(v ?? "").slice(0, 200)
  const { error } = await db().from("merchants").update({ draft_answers: { tier, fields }, updated_at: new Date().toISOString() }).eq("id", merchant.id)
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "application.answers_saved", entityType: "merchant", entityId: merchant.id, details: { tier } })
  return { ok: true }
})

/** Submit for Office review. */
export const POST = merchantRoute("documents", async (_req, { user, merchant }) => {
  assert(canSelfTransition(merchant.status, "in_review"), "MERCHANT_STATUS_NOT_ALLOWED", 409, { status: merchant.status })
  const checklist = await applicationChecklist(merchant, merchant.draft_answers)
  assert(checklist.complete, "APPLICATION_INCOMPLETE", 422, { items: checklist.items.filter((i) => !i.done) })

  const now = new Date().toISOString()
  const ins = await db().from("merchant_applications").insert({ merchant_id: merchant.id, status: "submitted", answers: merchant.draft_answers, submitted_at: now })
  check(ins.error)
  const m = await db().from("merchants").update({ status: "in_review", submitted_at: now, rejection_reason: null, updated_at: now }).eq("id", merchant.id)
  check(m.error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "application.submitted", entityType: "merchant", entityId: merchant.id })
  return { status: "in_review" }
})
