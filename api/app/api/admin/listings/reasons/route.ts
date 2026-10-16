import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { loadReasons } from "@/lib/merchant/office-data"

/** Templated rejection reasons for listings (key, label, English text; `translations` when present). */
export const GET = adminRoute("listings.review", async () => ({ reasons: await loadReasons(createServerClient()) }))
