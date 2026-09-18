import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling } from "@/lib/auth-utils"
import { ensureUserReferralSlug } from "@/lib/referral-user"
import { computeReferralBalances } from "@/lib/referral-balances"
import {
  formatUtcQuarterLabel,
  getReferralProgramSettingsServer,
  getUtcQuarterBoundsForDate,
  resolveTierIndex,
} from "@/lib/referral-program"
import { buildRateMap, convertWithRateMap } from "@/lib/referral-currency"
import { REFERRAL_PAYOUT_PREFIX } from "@/lib/referral-reward-service"
import { APP_URLS } from "@ciuna/shared"
import { roundMoney } from "@/utils/currency"

function formatMoney(amount: number, currency: string) {
  const a = roundMoney(amount)
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
    }).format(a)
  } catch {
    return `${a.toFixed(2)} ${currency}`
  }
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  const supabase = createServerClient()

  const slug = await ensureUserReferralSlug(supabase, user.id)
  const shareUrl = `${APP_URLS.app}/${slug}`

  const program = await getReferralProgramSettingsServer()
  const balances = await computeReferralBalances(supabase, user.id)

  const { data: exchangeRates } = await supabase.from("exchange_rates").select("*").eq("status", "active")
  const rateMap = buildRateMap(exchangeRates || [])

  const { data: profile } = await supabase.from("users").select("base_currency").eq("id", user.id).single()
  const base = profile?.base_currency || "USD"
  const policy = balances.policyCurrency

  const availableDisplay = convertWithRateMap(balances.availablePolicy, policy, base, rateMap)
  const lifetimeDisplay = convertWithRateMap(balances.totalEarnedPolicy, policy, base, rateMap)

  const now = new Date()
  const { start: quarterStart, end: quarterEnd } = getUtcQuarterBoundsForDate(now)
  let qualifiedRefereesThisQuarter = 0
  if (program.program_active && program.mode === "tier") {
    const { count, error: tierCountErr } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("referred_by_user_id", user.id)
      .gte("referral_first_qualifying_completed_at", quarterStart.toISOString())
      .lte("referral_first_qualifying_completed_at", quarterEnd.toISOString())
    if (tierCountErr) {
      console.error("referrals/me: qualified referees this quarter", {
        message: tierCountErr.message,
        code: (tierCountErr as { code?: string }).code,
        details: (tierCountErr as { details?: string }).details,
        hint: (tierCountErr as { hint?: string }).hint,
      })
    } else {
      qualifiedRefereesThisQuarter = count ?? 0
    }
  }

  const tierCommission =
    program.program_active && program.mode === "tier"
      ? {
          quarterLabel: formatUtcQuarterLabel(now),
          qualifiedRefereesThisQuarter,
          currentTierIndex: resolveTierIndex(program.percent_tiers, qualifiedRefereesThisQuarter),
          tiers: program.percent_tiers.map((t) => ({
            configuredQualifiedRefereesInQuarter: t.min_qualified_referees_in_quarter,
            percentFraction: t.percent_of_send,
            percentDisplay: `${(t.percent_of_send * 100).toFixed(2)}%`,
          })),
        }
      : undefined

  const { data: referees } = await supabase
    .from("users")
    .select("id, first_name, last_name, referral_percent_window_ends_at")
    .eq("referred_by_user_id", user.id)

  const { data: rewardRows } = await supabase
    .from("referral_rewards")
    .select("referee_user_id, amount_policy_currency, amount_display, display_currency")
    .eq("referrer_user_id", user.id)

  const earnByReferee = new Map<string, number>()
  for (const r of rewardRows || []) {
    const id = r.referee_user_id as string
    earnByReferee.set(id, (earnByReferee.get(id) || 0) + Number(r.amount_policy_currency || 0))
  }

  const refereeIds = (referees || []).map((r) => String(r.id))
  const completedSendCountByReferee = new Map<string, number>()
  for (const id of refereeIds) completedSendCountByReferee.set(id, 0)

  if (refereeIds.length > 0) {
    const { data: completedTxs, error: completedTxErr } = await supabase
      .from("transactions")
      .select("user_id, reference")
      .in("user_id", refereeIds)
      .eq("status", "completed")
      // Default PostgREST max-rows is 1000; without this, counts truncate and per-referee completed counts under-report.
      .limit(50000)

    if (completedTxErr) {
      console.error("referrals/me: completed transactions for referees", completedTxErr)
    }

    for (const t of completedTxs || []) {
      const uid = String(t.user_id)
      const refStr = t.reference as string | undefined
      if (refStr?.startsWith(REFERRAL_PAYOUT_PREFIX)) continue
      completedSendCountByReferee.set(uid, (completedSendCountByReferee.get(uid) || 0) + 1)
    }
  }

  const referralsList = []
  for (const ref of referees || []) {
    const rid = String(ref.id)
    const txCount = completedSendCountByReferee.get(rid) ?? 0
    const earnedPolicy = earnByReferee.get(rid) || 0
    const earnedDisplay = convertWithRateMap(earnedPolicy, policy, base, rateMap)

    referralsList.push({
      id: rid,
      name: `${ref.first_name || ""} ${ref.last_name || ""}`.trim(),
      transactionCount: txCount,
      earningsDisplay: formatMoney(earnedDisplay > 0 ? earnedDisplay : earnedPolicy, base),
      ...((program.mode === "percent" || program.mode === "tier") && ref.referral_percent_window_ends_at
        ? { percentWindowEndsAt: ref.referral_percent_window_ends_at as string }
        : {}),
    })
  }

  const { data: pendingRows } = await supabase
    .from("referral_payout_requests")
    .select("id, amount, currency, status, created_at, payout_transaction_id, linked_transaction_id")
    .eq("user_id", user.id)
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })

  return NextResponse.json({
    slug,
    shareUrl,
    program,
    tierCommission,
    balances: {
      availablePolicy: balances.availablePolicy,
      totalEarnedPolicy: balances.totalEarnedPolicy,
      /** Numeric available in user base currency (for client payout validation) */
      availableAmountBase: roundMoney(availableDisplay > 0 ? availableDisplay : balances.availablePolicy),
      availableDisplay: formatMoney(availableDisplay > 0 ? availableDisplay : balances.availablePolicy, base),
      lifetimeDisplay: formatMoney(lifetimeDisplay > 0 ? lifetimeDisplay : balances.totalEarnedPolicy, base),
      displayCurrency: base,
    },
    referrals: referralsList,
    pendingPayouts: pendingRows || [],
  })
})
