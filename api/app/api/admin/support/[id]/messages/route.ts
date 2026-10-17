import { adminRoute, readJson } from "@/lib/merchant/http"
import { audit } from "@/lib/merchant/audit"
import { sendReply, validateBody } from "@/lib/support"
import { notifySupportReply } from "@/lib/push-events"

/** An agent reply: the request now waits for the customer. */
export const POST = adminRoute("support.manage", async (req, admin, params) => {
  const id = String(params.id)
  const body = validateBody((await readJson(req))?.body)
  const messageId = await sendReply("agent", id, admin.id, body)
  await notifySupportReply(id) // best effort: a failed push never undoes the reply
  await audit({ actorKind: "admin", actorId: admin.id, actorRole: admin.role, action: "support.replied", entityType: "support_request", entityId: id })
  return { id: messageId }
})
