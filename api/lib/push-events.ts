import { createServerClient } from "@/lib/supabase"
import { tEmail } from "@/lib/i18n/server"
import { sendPushToUser } from "@/lib/push"

/** Tell the customer that support replied, in their language. Never throws. */
export async function notifySupportReply(requestId: string): Promise<void> {
  try {
    const db = createServerClient()
    const { data: req } = await db.from("support_requests").select("user_id,subject,public_id").eq("id", requestId).maybeSingle()
    if (!req) return
    const { data: user } = await db.from("users").select("preferred_language").eq("id", (req as any).user_id).maybeSingle()
    const lng = (user as any)?.preferred_language
    await sendPushToUser((req as any).user_id, {
      title: tEmail("push.supportReply.title", {}, lng),
      body: tEmail("push.supportReply.body", { subject: (req as any).subject }, lng),
      data: { type: "support", requestId },
    })
  } catch (e) {
    console.error("support push failed", (e as Error)?.message)
  }
}
