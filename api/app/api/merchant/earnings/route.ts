import { merchantRoute } from "@/lib/merchant/http"
import { merchantBalances, setting } from "@/lib/merchant/money"

export const GET = merchantRoute("earnings", async (_req, { merchant }) => {
  const [balances, minPayout, holdDays] = await Promise.all([
    merchantBalances(merchant.id),
    setting<Record<string, number>>("min_payout", {}),
    setting<number>("payout_hold_days", 2),
  ])
  return { balances, minPayout, holdDays }
}, { allowStatuses: ["live", "paused", "suspended", "in_review", "rejected", "draft"] })
