import { providerWebhook } from "@/lib/marketplace/payments"
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { getYooKassaPayment, type YooKassaPaymentStatus } from "@/lib/yookassa"
import {
  processReferralRewardsOnCompletedSend,
  rollbackReferralRewardsForTransaction,
} from "@/lib/referral-reward-service"
import type { Transaction } from "@/types"

/**
 * YooKassa webhook. We never trust the notification body's status — YooKassa does not sign
 * webhook payloads by default, so anyone who finds this URL could POST a fake "succeeded" event.
 * Instead we take only the payment id from the body and re-fetch the payment from YooKassa's API
 * with our own credentials before acting on it; that re-fetch is the actual authorization check.
 */

function targetStatus(paymentStatus: YooKassaPaymentStatus): Transaction["status"] | null {
  if (paymentStatus === "succeeded") return "completed"
  if (paymentStatus === "waiting_for_capture") return "processing"
  if (paymentStatus === "canceled") return "failed"
  return null // "pending" — nothing to do yet
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "completed", "failed", "cancelled"],
  processing: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const paymentId = String(body?.object?.id || "").trim()
    if (!paymentId) {
      // Nothing we can verify without a payment id — ack so YooKassa doesn't keep retrying garbage.
      return NextResponse.json({ ok: true })
    }

    if (await providerWebhook(paymentId)) return NextResponse.json({ ok: true })

    const payment = await getYooKassaPayment(paymentId)
    const nextStatus = targetStatus(payment.status)
    if (!nextStatus) return NextResponse.json({ ok: true })

    const server = createServerClient()
    const { data: currentTransaction, error: fetchErr } = await server
      .from("transactions")
      .select("*, recipient:recipients(*), user:users(first_name, last_name, email)")
      .eq("gateway_payment_id", paymentId)
      .maybeSingle()

    if (fetchErr || !currentTransaction) {
      console.warn("yookassa webhook: no matching transaction", { paymentId })
      return NextResponse.json({ ok: true })
    }

    const previousStatus = String(currentTransaction.status)
    if (previousStatus === nextStatus) return NextResponse.json({ ok: true }) // already applied — idempotent

    const allowed = VALID_TRANSITIONS[previousStatus] || []
    if (!allowed.includes(nextStatus)) {
      console.warn("yookassa webhook: invalid transition ignored", { paymentId, previousStatus, nextStatus })
      return NextResponse.json({ ok: true })
    }

    const updateData: Record<string, unknown> = {
      status: nextStatus,
      gateway_status: payment.status,
      updated_at: new Date().toISOString(),
    }
    if (nextStatus === "completed") updateData.completed_at = new Date().toISOString()
    if (nextStatus === "failed" && payment.cancellation_details) {
      updateData.failure_reason = `${payment.cancellation_details.party}: ${payment.cancellation_details.reason}`
    }

    const { data: updatedTransaction, error: updErr } = await server
      .from("transactions")
      .update(updateData)
      .eq("id", currentTransaction.id)
      .select("*, recipient:recipients(*), user:users(first_name, last_name, email)")
      .maybeSingle()

    if (updErr || !updatedTransaction) {
      console.error("yookassa webhook: failed to update transaction", updErr)
      return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
    }

    if (previousStatus !== "completed" && nextStatus === "completed") {
      await processReferralRewardsOnCompletedSend(updatedTransaction as unknown as Transaction)
    } else if (previousStatus === "completed" && nextStatus !== "completed") {
      await rollbackReferralRewardsForTransaction(currentTransaction as unknown as Transaction)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("yookassa webhook error", error)
    // Acknowledge only committed processing; provider retry and the durable worker recover errors.
    return NextResponse.json({ error: "Payment reconciliation unavailable" }, { status: 503 })
  }
}
