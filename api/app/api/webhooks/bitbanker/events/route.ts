import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { isBitbankerConfigured } from "@/lib/bitbanker/config"
import { verifyBitbankerWebhook } from "@/lib/bitbanker/webhook-verify"
import { insertWebhookInbox, applyPartnerClientSnapshot } from "@/lib/bitbanker/db"
import { getPartnerClient } from "@/lib/bitbanker/partner-clients"

export async function POST(request: NextRequest) {
  if (!isBitbankerConfigured()) {
    return NextResponse.json({ ok: true })
  }

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: true })
  }

  if (!verifyBitbankerWebhook(payload)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
  }

  const admin = createServerClient()
  const { id: inboxId, duplicate } = await insertWebhookInbox(admin, "events", payload)

  if (duplicate) {
    return NextResponse.json({ ok: true })
  }

  try {
    const data =
      payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
        ? (payload.data as Record<string, unknown>)
        : null
    const eventType = String(
      payload.event_type ?? payload.event ?? payload.type ?? "",
    ).trim()
    const clientId = String(
      data?.client_id ??
        payload.client_id ??
        payload.partner_client_external_id ??
        payload.external_client_ref ??
        "",
    ).trim()

    if (clientId && (eventType.includes("permission") || eventType.includes("sbp_client"))) {
      const { data: ref } = await admin
        .from("bitbanker_client_refs")
        .select("user_id, client_id")
        .eq("client_id", clientId)
        .maybeSingle()

      let record = payload
      try {
        record = await getPartnerClient(clientId)
      } catch {
        // fall back to event payload fields
        if (typeof payload.is_verified_for_sbp === "boolean") {
          record = payload
        }
      }

      if (ref?.user_id) {
        await applyPartnerClientSnapshot(admin, ref.user_id, clientId, record)
      }
    }

    if (inboxId) {
      await admin
        .from("bitbanker_webhook_inbox")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", inboxId)
    }
  } catch (e) {
    console.error("bitbanker events webhook error", e)
    if (inboxId) {
      await admin
        .from("bitbanker_webhook_inbox")
        .update({ processing_error: String(e) })
        .eq("id", inboxId)
    }
  }

  return NextResponse.json({ ok: true })
}
