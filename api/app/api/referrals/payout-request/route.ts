import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling } from "@/lib/auth-utils"
import { computeReferralBalances } from "@/lib/referral-balances"
import { buildRateMap, convertWithRateMap } from "@/lib/referral-currency"
import { EmailNotificationService } from "@/lib/email-notification-service"
import { generateTransactionId } from "@/lib/transaction-id"
import { REFERRAL_PAYOUT_PREFIX } from "@/lib/referral-reward-service"
import { dataCache, CACHE_KEYS } from "@/lib/cache"

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const body = await request.json()
  const recipientId = body?.recipientId as string | undefined
  const amount = Number(body?.amount)

  if (!recipientId || !(amount > 0)) {
    return NextResponse.json({ error: "recipientId and positive amount required" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: recipient } = await supabase
    .from("recipients")
    .select("id, currency")
    .eq("id", recipientId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
  }

  const { data: profile } = await supabase.from("users").select("base_currency").eq("id", user.id).single()
  const base = profile?.base_currency || "USD"

  const balances = await computeReferralBalances(supabase, user.id)

  const { data: exchangeRates } = await supabase.from("exchange_rates").select("*").eq("status", "active")
  const rateMap = buildRateMap(exchangeRates || [])

  const amountPolicy = convertWithRateMap(amount, base, balances.policyCurrency, rateMap)
  if (amountPolicy <= 0 || amountPolicy > balances.availablePolicy + 1e-6) {
    return NextResponse.json(
      {
        error:
          "That amount is more than your available referral balance. Enter a lower amount or check what you can withdraw above.",
      },
      { status: 400 },
    )
  }

  const payoutTransactionId = generateTransactionId()

  const { data: inserted, error } = await supabase
    .from("referral_payout_requests")
    .insert({
      user_id: user.id,
      recipient_id: recipientId,
      amount,
      currency: base,
      status: "pending",
      payout_transaction_id: payoutTransactionId,
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!inserted?.id) {
    return NextResponse.json({ error: "Failed to create payout request" }, { status: 400 })
  }

  const receiveCurrency = (recipient.currency as string) || base
  const receiveAmount =
    convertWithRateMap(amount, base, receiveCurrency, rateMap) || amount
  const exchangeRate = amount > 0 ? receiveAmount / amount : 1
  const reference = `${REFERRAL_PAYOUT_PREFIX}${inserted.id}`

  const { error: txErr } = await supabase.from("transactions").insert({
    transaction_id: payoutTransactionId,
    user_id: user.id,
    recipient_id: recipientId,
    send_amount: amount,
    send_currency: base,
    receive_amount: receiveAmount,
    receive_currency: receiveCurrency,
    exchange_rate: exchangeRate,
    fee_amount: 0,
    fee_type: "free",
    total_amount: amount,
    reference,
    status: "pending",
  })

  if (txErr) {
    await supabase.from("referral_payout_requests").delete().eq("id", inserted.id)
    return NextResponse.json({ error: txErr.message }, { status: 400 })
  }

  const { error: linkErr } = await supabase
    .from("referral_payout_requests")
    .update({ linked_transaction_id: payoutTransactionId })
    .eq("id", inserted.id)

  if (linkErr) {
    await supabase.from("transactions").delete().eq("transaction_id", payoutTransactionId)
    await supabase.from("referral_payout_requests").delete().eq("id", inserted.id)
    return NextResponse.json({ error: linkErr.message }, { status: 400 })
  }

  try {
    dataCache.invalidate(CACHE_KEYS.USER_TRANSACTIONS(user.id))
    dataCache.invalidate(CACHE_KEYS.TRANSACTION(payoutTransactionId))
  } catch {
    /* ignore */
  }

  void EmailNotificationService.sendReferralPayoutStatusEmail(inserted.id, "pending").catch(() => {})
  void EmailNotificationService.sendAdminTransactionNotification(payoutTransactionId, "pending").catch(() => {})

  return NextResponse.json({ success: true, id: inserted.id, payoutTransactionId })
})
