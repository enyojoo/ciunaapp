import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { generateTransactionId } from "@/lib/transaction-id"
import { buildRateMap, convertWithRateMap } from "@/lib/referral-currency"
import { REFERRAL_PAYOUT_PREFIX } from "@/lib/referral-reward-service"
import { EmailNotificationService } from "@/lib/email-notification-service"
import { dataCache, CACHE_KEYS } from "@/lib/cache"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await requireAdmin(request)
    const { id } = await Promise.resolve(params)
    const supabase = createServerClient()

    const { data: pay, error: loadErr } = await supabase
      .from("referral_payout_requests")
      .select(
        `
        *,
        recipient:recipients(*),
        user:users(id, first_name, last_name, email, base_currency)
      `,
      )
      .eq("id", id)
      .single()

    if (loadErr || !pay) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 })
    }

    // Idempotent: repeated "Transfer Complete" after success should not error.
    if (pay.status === "completed") {
      const tid =
        typeof pay.payout_transaction_id === "string" && pay.payout_transaction_id.trim()
          ? pay.payout_transaction_id.trim()
          : typeof pay.linked_transaction_id === "string" && pay.linked_transaction_id.trim()
            ? pay.linked_transaction_id.trim()
            : null
      if (!tid) {
        return NextResponse.json({ error: "Payout completed but transaction id missing" }, { status: 400 })
      }
      return NextResponse.json({ success: true, transactionId: tid, idempotent: true })
    }

    const { data: exchangeRates } = await supabase.from("exchange_rates").select("*").eq("status", "active")
    const rateMap = buildRateMap(exchangeRates || [])

    const sendAmount = Number(pay.amount)
    const sendCurrency = pay.currency as string
    const recipient = pay.recipient as {
      currency: string
      id: string
    }

    const receiveCurrency = recipient?.currency
    if (!receiveCurrency) {
      return NextResponse.json({ error: "Recipient currency is missing for this payout" }, { status: 400 })
    }
    const receiveAmount =
      convertWithRateMap(sendAmount, sendCurrency, receiveCurrency, rateMap) || sendAmount
    const exchangeRate = sendAmount > 0 ? receiveAmount / sendAmount : 1

    const transactionId =
      typeof pay.payout_transaction_id === "string" && pay.payout_transaction_id.trim()
        ? pay.payout_transaction_id.trim()
        : typeof pay.linked_transaction_id === "string" && pay.linked_transaction_id.trim()
          ? pay.linked_transaction_id.trim()
          : generateTransactionId()
    const reference = `${REFERRAL_PAYOUT_PREFIX}${pay.id}`
    const now = new Date().toISOString()

    // Use only columns present on all deployments: `completed_at` is optional (see docs/supabase/transactions_add_completed_at.sql).
    const { data: updatedRows, error: updErr } = await supabase
      .from("transactions")
      .update({
        status: "completed",
        updated_at: now,
      })
      .eq("transaction_id", transactionId)
      .in("status", ["pending", "processing", "failed", "cancelled"])
      .select("id")

    if (updErr) {
      console.error("referral payout update tx:", updErr)
      return NextResponse.json({ error: updErr.message }, { status: 400 })
    }

    const updatedExisting = updatedRows && updatedRows.length > 0

    if (!updatedExisting) {
      const { data: existingTx } = await supabase
        .from("transactions")
        .select("status")
        .eq("transaction_id", transactionId)
        .maybeSingle()

      if (existingTx?.status === "completed") {
        // Linked transaction already completed; sync payout request below.
      } else if (!existingTx) {
        const { error: insErr } = await supabase.from("transactions").insert({
          transaction_id: transactionId,
          user_id: pay.user_id,
          recipient_id: pay.recipient_id,
          send_amount: sendAmount,
          send_currency: sendCurrency,
          receive_amount: receiveAmount,
          receive_currency: receiveCurrency,
          exchange_rate: exchangeRate,
          fee_amount: 0,
          fee_type: "free",
          total_amount: sendAmount,
          reference,
          status: "completed",
          updated_at: now,
        })

        if (insErr) {
          console.error("referral payout insert tx:", insErr)
          return NextResponse.json({ error: insErr.message || "Insert failed" }, { status: 400 })
        }
      } else {
        const { error: forceErr } = await supabase
          .from("transactions")
          .update({
            status: "completed",
            updated_at: now,
          })
          .eq("transaction_id", transactionId)

        if (forceErr) {
          console.error("referral payout force-complete tx:", forceErr)
          return NextResponse.json({ error: forceErr.message || "Update failed" }, { status: 400 })
        }
      }
    }

    const { error: upErr } = await supabase
      .from("referral_payout_requests")
      .update({
        status: "completed",
        linked_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 })
    }

    try {
      dataCache.invalidate(CACHE_KEYS.USER_TRANSACTIONS(pay.user_id as string))
      dataCache.invalidate(CACHE_KEYS.TRANSACTION(transactionId))
    } catch {
      /* ignore */
    }

    // Referral-specific copy (referralPayoutCompleted template), not generic transfer completed.
    void EmailNotificationService.sendReferralPayoutStatusEmail(id, "completed", transactionId).catch(() => {})

    return NextResponse.json({ success: true, transactionId })
  } catch (e: any) {
    if (e?.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("complete referral payout:", e)
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}
