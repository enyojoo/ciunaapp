import { addMonths, parseISO } from "date-fns"
import { createServerClient } from "@/lib/supabase"
import type { Transaction } from "@/types"
import {
  getReferralProgramSettingsServer,
  getUtcQuarterBoundsForDate,
  resolveTierPercent,
} from "@/lib/referral-program"
import { buildRateMap, convertWithRateMap } from "@/lib/referral-currency"
import { roundMoney } from "@/utils/currency"

export const REFERRAL_PAYOUT_PREFIX = "REFERRAL_PAYOUT:"

function policyToDisplayAmount(
  amountPolicy: number,
  policyCurrency: string,
  displayCurrency: string,
  rateMap: Map<string, number>,
): { amount: number; currency: string } {
  const converted = convertWithRateMap(amountPolicy, policyCurrency, displayCurrency, rateMap)
  if (converted > 0) return { amount: roundMoney(converted), currency: displayCurrency }
  return { amount: roundMoney(amountPolicy), currency: policyCurrency }
}

function transactionCompletedAtIso(tx: Transaction): string {
  const raw = tx.completed_at || tx.updated_at || tx.created_at
  return raw
}

type CompletedTxRow = {
  transaction_id: string
  send_amount: number | string
  send_currency: string
  receive_amount: number | string
  receive_currency: string
  exchange_rate: number | string
  completed_at?: string | null
  updated_at?: string | null
  created_at?: string | null
  reference?: string | null
}

/**
 * Principal in pay currency (`send_currency`) that referral rewards are computed from.
 *
 * Policy: referrer gets a % (or threshold sums) of the **completed principal** only.
 * Excluded: corridor fee (`fee_amount`), Hub marketplace fee (`hub_fee_amount` when
 * `transaction_source === "hub"`), and cash logistics (`logistics_fee_amount`). Those
 * sit in `total_amount` with principal but must not increase referrer payout.
 *
 * @see `web/app/send/page.tsx` — `totalToPay = sendAmount + fee + logisticsFee`
 * @see `web/lib/hub-checkout-server.ts` — `totalAmount = sendAmount + corridor + hubFee`
 */
function referralPrincipalInSendCurrency(row: Pick<Transaction, "send_amount"> | Pick<CompletedTxRow, "send_amount">): number {
  const n = Number(row.send_amount)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function resolveTransactionAmountInPolicyCurrency(
  transaction: Transaction,
  policyCurrency: string,
  rateMap: Map<string, number>,
): number {
  const sendAmount = referralPrincipalInSendCurrency(transaction)
  const sendCurrency = transaction.send_currency
  const receiveCurrency = transaction.receive_currency
  const exchangeRate = Number(transaction.exchange_rate)

  if (sendCurrency === policyCurrency) return sendAmount

  // Prefer the transaction's own stored FX when it already converts send -> policy.
  if (receiveCurrency === policyCurrency && Number.isFinite(exchangeRate) && exchangeRate > 0) {
    return sendAmount * exchangeRate
  }

  const converted = convertWithRateMap(sendAmount, sendCurrency, policyCurrency, rateMap)
  if (converted > 0) return converted

  return 0
}

async function minQualifyingCompletedAt(
  supabase: ReturnType<typeof createServerClient>,
  refereeUserId: string,
  fallbackIso: string,
): Promise<Date> {
  const rows = await listCompletedNonPayoutTransactions(supabase, refereeUserId)

  let minMs = Infinity
  for (const row of rows) {
    const ca = transactionCompletedAtIso(row as Transaction)
    if (!ca) continue
    const t = parseISO(ca).getTime()
    if (!Number.isNaN(t) && t < minMs) minMs = t
  }
  if (minMs === Infinity) return parseISO(fallbackIso)
  return new Date(minMs)
}

async function listCompletedNonPayoutTransactions(
  supabase: ReturnType<typeof createServerClient>,
  refereeUserId: string,
): Promise<CompletedTxRow[]> {
  const { data } = await supabase
    .from("transactions")
    .select(
      "transaction_id, send_amount, send_currency, receive_amount, receive_currency, exchange_rate, completed_at, updated_at, created_at, reference",
    )
    .eq("user_id", refereeUserId)
    .eq("status", "completed")

  return (data || []).filter((row) => {
    const ref = row.reference as string | undefined
    return !ref?.startsWith(REFERRAL_PAYOUT_PREFIX)
  }) as CompletedTxRow[]
}

async function recomputeReferralQualificationState(
  supabase: ReturnType<typeof createServerClient>,
  refereeUserId: string,
  durationMonths: number,
): Promise<void> {
  const rows = await listCompletedNonPayoutTransactions(supabase, refereeUserId)
  if (rows.length === 0) {
    const { error } = await supabase
      .from("users")
      .update({
        referral_first_qualifying_completed_at: null,
        referral_percent_window_ends_at: null,
      })
      .eq("id", refereeUserId)
    if (error) {
      console.error("recomputeReferralQualificationState clear:", error)
    }
    return
  }

  let minIso = transactionCompletedAtIso(rows[0] as Transaction)
  for (const row of rows.slice(1)) {
    const iso = transactionCompletedAtIso(row as Transaction)
    if (!iso) continue
    if (!minIso || parseISO(iso).getTime() < parseISO(minIso).getTime()) {
      minIso = iso
    }
  }
  if (!minIso) return

  const endsAt = addMonths(parseISO(minIso), durationMonths).toISOString()
  const { error } = await supabase
    .from("users")
    .update({
      referral_first_qualifying_completed_at: minIso,
      referral_percent_window_ends_at: endsAt,
    })
    .eq("id", refereeUserId)
  if (error) {
    console.error("recomputeReferralQualificationState set:", error)
  }
}

async function countQualifiedRefereesInQuarter(
  supabase: ReturnType<typeof createServerClient>,
  referrerId: string,
  quarterStartIso: string,
  quarterEndIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_user_id", referrerId)
    .gte("referral_first_qualifying_completed_at", quarterStartIso)
    .lte("referral_first_qualifying_completed_at", quarterEndIso)

  if (error) {
    console.error("countQualifiedRefereesInQuarter:", error)
    return 0
  }
  return count ?? 0
}

/**
 * Called when a normal send transaction reaches `completed`. Credits referrer per program rules.
 */
export async function processReferralRewardsOnCompletedSend(transaction: Transaction): Promise<void> {
  try {
    if (transaction.status !== "completed") return
    if (transaction.reference?.startsWith(REFERRAL_PAYOUT_PREFIX)) return

    const program = await getReferralProgramSettingsServer()
    if (!program.program_active) return

    const supabase = createServerClient()
    const { data: exchangeRates } = await supabase.from("exchange_rates").select("*").eq("status", "active")
    const rateMap = buildRateMap(exchangeRates || [])

    const { data: referee, error: refereeErr } = await supabase
      .from("users")
      .select("id, referred_by_user_id, referral_percent_window_ends_at, referral_first_qualifying_completed_at")
      .eq("id", transaction.user_id)
      .single()

    if (refereeErr || !referee?.referred_by_user_id) return
    const referrerId = referee.referred_by_user_id as string
    if (referrerId === transaction.user_id) return

    const { data: referrer } = await supabase.from("users").select("id, base_currency").eq("id", referrerId).single()

    if (!referrer) return
    const referrerBase = (referrer.base_currency as string) || "USD"
    const policy = program.policy_currency

    if (program.mode === "percent" || program.mode === "tier") {
      const completedAtIso = transactionCompletedAtIso(transaction)
      let windowEndsAtIso = referee.referral_percent_window_ends_at as string | null | undefined
      const firstQualMissing = !referee.referral_first_qualifying_completed_at

      const minAt = await minQualifyingCompletedAt(supabase, transaction.user_id, completedAtIso)
      const minIso = minAt.toISOString()

      if (firstQualMissing) {
        await supabase
          .from("users")
          .update({ referral_first_qualifying_completed_at: minIso })
          .eq("id", transaction.user_id)
          .is("referral_first_qualifying_completed_at", null)
      }

      if (!windowEndsAtIso) {
        const endsAt = addMonths(minAt, program.percent_reward_duration_months)
        windowEndsAtIso = endsAt.toISOString()
        await supabase
          .from("users")
          .update({ referral_percent_window_ends_at: windowEndsAtIso })
          .eq("id", transaction.user_id)
          .is("referral_percent_window_ends_at", null)
        const { data: refetchW } = await supabase
          .from("users")
          .select("referral_percent_window_ends_at")
          .eq("id", transaction.user_id)
          .maybeSingle()
        if (refetchW?.referral_percent_window_ends_at) {
          windowEndsAtIso = refetchW.referral_percent_window_ends_at as string
        }
      }

      const txTime = parseISO(completedAtIso)
      const endTime = parseISO(windowEndsAtIso)
      if (Number.isNaN(txTime.getTime()) || Number.isNaN(endTime.getTime())) return
      if (txTime > endTime) return

      const sendInPolicy = resolveTransactionAmountInPolicyCurrency(transaction, policy, rateMap)
      if (sendInPolicy <= 0) return

      let effectiveFraction = program.percent_of_send
      // Persist percent-based rewards under the existing DB enum/constraint value.
      // In tier mode the amount still reflects the active tier percentage.
      const rewardType: "percent_of_send" = "percent_of_send"

      if (program.mode === "tier") {
        const txDate = parseISO(completedAtIso)
        const { start, end } = getUtcQuarterBoundsForDate(txDate)
        const count = await countQualifiedRefereesInQuarter(
          supabase,
          referrerId,
          start.toISOString(),
          end.toISOString(),
        )
        effectiveFraction = resolveTierPercent(program.percent_tiers, count)
      }

      if (effectiveFraction <= 0) return
      const rewardPolicy = roundMoney(sendInPolicy * effectiveFraction)
      if (rewardPolicy <= 0) return

      const display = policyToDisplayAmount(rewardPolicy, policy, referrerBase, rateMap)

      const { error: insErr } = await supabase.from("referral_rewards").insert({
        referrer_user_id: referrerId,
        referee_user_id: transaction.user_id,
        source_transaction_id: transaction.transaction_id,
        reward_type: rewardType,
        amount_policy_currency: rewardPolicy,
        policy_currency: policy,
        amount_display: display.amount,
        display_currency: display.currency,
      })
      if (insErr && insErr.code !== "23505") {
        console.error("referral_rewards insert (percent/tier):", insErr)
      } else if (!insErr) {
        console.log("referral reward inserted", {
          transactionId: transaction.transaction_id,
          referrerId,
          refereeUserId: transaction.user_id,
          rewardType,
          policyCurrency: policy,
          amountPolicy: rewardPolicy,
        })
      }
      return
    }

    // threshold
    const { data: txs } = await supabase
      .from("transactions")
      .select("send_amount, send_currency, reference, status")
      .eq("user_id", transaction.user_id)
      .eq("status", "completed")

    let sumPolicy = 0
    for (const tx of txs || []) {
      const ref = tx.reference as string | undefined
      if (ref?.startsWith(REFERRAL_PAYOUT_PREFIX)) continue
      const principal = referralPrincipalInSendCurrency(tx as Pick<CompletedTxRow, "send_amount">)
      if (principal <= 0) continue
      sumPolicy += convertWithRateMap(principal, tx.send_currency as string, policy, rateMap)
    }

    if (sumPolicy < program.threshold_send_amount) return

    const { data: existingThreshold } = await supabase
      .from("referral_rewards")
      .select("id")
      .eq("referee_user_id", transaction.user_id)
      .eq("reward_type", "threshold_unlock")
      .maybeSingle()

    if (existingThreshold) return

    const rewardPolicy = roundMoney(program.reward_amount)
    const display = policyToDisplayAmount(rewardPolicy, policy, referrerBase, rateMap)

    const { error: insErr } = await supabase.from("referral_rewards").insert({
      referrer_user_id: referrerId,
      referee_user_id: transaction.user_id,
      source_transaction_id: null,
      reward_type: "threshold_unlock",
      amount_policy_currency: rewardPolicy,
      policy_currency: policy,
      amount_display: display.amount,
      display_currency: display.currency,
    })
    if (insErr && insErr.code !== "23505") {
      console.error("referral_rewards insert (threshold):", insErr)
    }
  } catch (e) {
    console.error("processReferralRewardsOnCompletedSend:", e)
  }
}

export async function rollbackReferralRewardsForTransaction(transaction: Transaction): Promise<void> {
  try {
    if (transaction.reference?.startsWith(REFERRAL_PAYOUT_PREFIX)) return

    const program = await getReferralProgramSettingsServer()
    const supabase = createServerClient()

    const { error: deletePercentErr } = await supabase
      .from("referral_rewards")
      .delete()
      .eq("source_transaction_id", transaction.transaction_id)
      .eq("reward_type", "percent_of_send")
    if (deletePercentErr) {
      console.error("rollback referral_rewards delete percent:", deletePercentErr)
    }

    if (program.mode === "percent" || program.mode === "tier") {
      await recomputeReferralQualificationState(
        supabase,
        transaction.user_id,
        program.percent_reward_duration_months,
      )
      return
    }

    const { data: exchangeRates } = await supabase.from("exchange_rates").select("*").eq("status", "active")
    const rateMap = buildRateMap(exchangeRates || [])
    const rows = await listCompletedNonPayoutTransactions(supabase, transaction.user_id)
    let sumPolicy = 0
    for (const row of rows) {
      sumPolicy += resolveTransactionAmountInPolicyCurrency(row as Transaction, program.policy_currency, rateMap)
    }
    if (sumPolicy >= program.threshold_send_amount) return

    const { error: deleteThresholdErr } = await supabase
      .from("referral_rewards")
      .delete()
      .eq("referee_user_id", transaction.user_id)
      .eq("reward_type", "threshold_unlock")
    if (deleteThresholdErr) {
      console.error("rollback referral_rewards delete threshold:", deleteThresholdErr)
    }
  } catch (e) {
    console.error("rollbackReferralRewardsForTransaction:", e)
  }
}
