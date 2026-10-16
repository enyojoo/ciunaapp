import { authedRoute } from "@/lib/merchant/http"
import { threadForUser } from "@/lib/support"

export const dynamic = "force-dynamic"

export const GET = authedRoute(async (_req, user, params) => threadForUser(user.id, String(params.id)))
