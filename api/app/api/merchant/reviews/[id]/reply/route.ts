import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert } from "@/lib/merchant/errors"
import { audit } from "@/lib/merchant/audit"
import { MAX_REPLY, cleanText, failFromDb, replyEditable } from "@/lib/merchant/reviews"

/** Post a public reply (once), or edit it within 24 hours. Body: { reply } */
export const POST = merchantRoute("orders", async (req, { user, merchant, role }, params) => {
  const body = await readJson(req)
  const raw = String(body.reply ?? "").trim()
  assert(raw.length > 0, "REPLY_REQUIRED", 422)
  assert(raw.length <= MAX_REPLY, "REPLY_TOO_LONG", 422)
  const reply = cleanText(raw, MAX_REPLY)
  const { error } = await createServerClient().rpc("review_reply", { p_review: params.id, p_merchant: merchant.id, p_user: user.id, p_reply: reply })
  failFromDb(error)
  const { data } = await createServerClient().from("reviews").select("reply,reply_at").eq("id", params.id).maybeSingle()
  await audit({ actorKind: "merchant", actorId: user.id, actorRole: role, merchantId: merchant.id, action: "review.replied", entityType: "review", entityId: params.id })
  return { reply: data?.reply ?? reply, reply_at: data?.reply_at ?? null, reply_editable: replyEditable(data?.reply_at) }
})
