import { authedRoute } from "@/lib/merchant/http"
import { unreadForUser } from "@/lib/support"

export const dynamic = "force-dynamic"

export const GET = authedRoute(async (_req, user) => ({ count: await unreadForUser(user.id) }))
