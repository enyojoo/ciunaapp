import { authedRoute } from "@/lib/merchant/http"
import { loadLimitState } from "@/lib/limits"

export const dynamic = "force-dynamic"

/** The signed-in customer's level, every level's limit, and this month's usage. Amounts exist only if compliance set them. */
export const GET = authedRoute(async (_req, user) => loadLimitState(user.id))
