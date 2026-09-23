import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { bitbankerCredentials, isBitbankerConfigured } from "@/lib/bitbanker/config"
import { verifyFullSign } from "@/lib/bitbanker/signing"
import { insertWebhookInbox } from "@/lib/bitbanker/db"
import { getInvoice } from "@/lib/bitbanker/invoices"

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

  try {
    const { apiSecret } = bitbankerCredentials()
    if ("full_sign" in payload && !verifyFullSign(payload, apiSecret)) {
      console.warn("bitbanker payments webhook: invalid signature")
      return NextResponse.json({ error: "invalid signature" }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ ok: true })
  }

  const admin = createServerClient()
  const { duplicate } = await insertWebhookInbox(admin, "payments", payload)
  if (duplicate) {
    return NextResponse.json({ ok: true })
  }

  try {
    await reconcilePaymentWebhook(admin, payload)
    await admin
      .from("bitbanker_webhook_inbox")
      .update({ processed_at: new Date().toISOString() })
      .eq("payload_hash", hashPayload(payload))
      .eq("channel", "payments")
  } catch (e) {
    console.error("bitbanker payments webhook processing error", e)
    await admin
      .from("bitbanker_webhook_inbox")
      .update({ processing_error: String(e) })
      .eq("payload_hash", hashPayload(payload))
      .eq("channel", "payments")
  }

  return NextResponse.json({ ok: true })
}

function hashPayload(payload: Record<string, unknown>): string {
  const crypto = require("crypto") as typeof import("crypto")
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex")
}

async function reconcilePaymentWebhook(admin: ReturnType<typeof createServerClient>, payload: Record<string, unknown>) {
  const invoiceId = String(payload.id ?? payload.invoice_id ?? "").trim()
  if (!invoiceId) return

  let invoice: Record<string, unknown> = payload
  try {
    const fetched = await getInvoice({ id: invoiceId })
    if (fetched && !Array.isArray(fetched)) invoice = fetched as Record<string, unknown>
  } catch {
    // use webhook payload
  }

  const payed = Boolean(invoice.payed ?? payload.payed)
  const { data: tx } = await admin
    .from("transactions")
    .select("transaction_id, status, payment_provider")
    .eq("gateway_payment_id", invoiceId)
    .maybeSingle()

  if (!tx || tx.payment_provider !== "bitbanker") return

  const update: Record<string, unknown> = {
    bitbanker_conversion_snapshot: invoice,
    updated_at: new Date().toISOString(),
  }

  if (payed && tx.status === "pending") {
    update.status = "processing"
    update.gateway_status = "paid"
  }

  await admin.from("transactions").update(update).eq("gateway_payment_id", invoiceId)
}
