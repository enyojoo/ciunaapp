import type { SupabaseClient } from "@supabase/supabase-js"
import { getReferralProgramSettingsServer } from "@/lib/referral-program"
import { buildRateMap, convertWithRateMap } from "@/lib/referral-currency"
import { roundMoney } from "@/utils/currency"

export interface ReferralBalances {
  policyCurrency: string
  /** Total policy-currency credits */
  totalEarnedPolicy: number
  /** Completed + pending/processing payouts in policy currency */
  totalPaidOutPolicy: number
  totalReservedPolicy: number
  availablePolicy: number
}

export async function computeReferralBalances(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReferralBalances> {
  const program = await getReferralProgramSettingsServer()
  const policy = program.policy_currency

  const { data: exchangeRates } = await supabase.from("exchange_rates").select("*").eq("status", "active")
  const rateMap = buildRateMap(exchangeRates || [])

  const { data: rewards } = await supabase
    .from("referral_rewards")
    .select("amount_policy_currency")
    .eq("referrer_user_id", userId)

  const totalEarnedPolicy = (rewards || []).reduce((s, r) => s + Number(r.amount_policy_currency || 0), 0)

  const { data: payouts } = await supabase
    .from("referral_payout_requests")
    .select("amount, currency, status")
    .eq("user_id", userId)

  let totalPaidOutPolicy = 0
  let totalReservedPolicy = 0

  for (const p of payouts || []) {
    const amt = Number(p.amount)
    const cur = p.currency as string
    const inPolicy = convertWithRateMap(amt, cur, policy, rateMap)
    if (inPolicy <= 0) continue
    if (p.status === "completed") totalPaidOutPolicy += inPolicy
    else if (p.status === "pending" || p.status === "processing") totalReservedPolicy += inPolicy
  }

  const availablePolicy = Math.max(0, totalEarnedPolicy - totalPaidOutPolicy - totalReservedPolicy)

  return {
    policyCurrency: policy,
    totalEarnedPolicy: roundMoney(totalEarnedPolicy),
    totalPaidOutPolicy: roundMoney(totalPaidOutPolicy),
    totalReservedPolicy: roundMoney(totalReservedPolicy),
    availablePolicy: roundMoney(availablePolicy),
  }
}
