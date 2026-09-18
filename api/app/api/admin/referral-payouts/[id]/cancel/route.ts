import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { EmailNotificationService } from "@/lib/email-notification-service"
import { dataCache, CACHE_KEYS } from "@/lib/cache"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await requireAdmin(request)
    const { id } = await Promise.resolve(params)
    const supabase = createServerClient()

    const { data: pay } = await supabase
      .from("referral_payout_requests")
      .select("id, status, user_id, payout_transaction_id, linked_transaction_id")
      .eq("id", id)
      .single()

    if (!pay) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    // Allow cancelling a completed payout (admin mistake). Only block if already cancelled.
    if (pay.status === "cancelled") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 })
    }

    const etid =
      typeof pay.linked_transaction_id === "string" && pay.linked_transaction_id.trim()
        ? pay.linked_transaction_id.trim()
        : typeof pay.payout_transaction_id === "string" && pay.payout_transaction_id.trim()
          ? pay.payout_transaction_id.trim()
          : null

    const now = new Date().toISOString()

    if (etid) {
      const { error: txErr } = await supabase
        .from("transactions")
        .update({ status: "cancelled", updated_at: now })
        .eq("transaction_id", etid)
        .in("status", ["pending", "processing", "completed", "failed"])

      if (txErr) {
        return NextResponse.json({ error: txErr.message }, { status: 400 })
      }
    }

    const { error } = await supabase
      .from("referral_payout_requests")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    try {
      dataCache.invalidate(CACHE_KEYS.USER_TRANSACTIONS(pay.user_id as string))
      if (etid) dataCache.invalidate(CACHE_KEYS.TRANSACTION(etid))
    } catch {
      /* ignore */
    }

    // Always use referral payout template (referralPayoutCancelled); linked tx may or may not exist.
    void EmailNotificationService.sendReferralPayoutStatusEmail(id, "cancelled").catch(() => {})

    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e?.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}
