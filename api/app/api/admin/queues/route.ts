import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { normalizeAdminRole } from "@/lib/admin-roles"
import { loadSla, queueCounts } from "@/lib/merchant/office-data"

export const dynamic = "force-dynamic"

/**
 * Exact counts, oldest-item time and SLA breaches for each Office queue the caller's role can work
 * (merchants in review, open payouts, listings in review, KYC, transactions and support requests).
 * A queue whose table is not on the database yet comes back as `{ unavailable: true }`.
 */
export const GET = adminRoute("merchants.read", async (_req, admin) => {
  const db = createServerClient()
  const sla = await loadSla(db)
  const role = admin.role === "admin" ? "super_admin" : normalizeAdminRole(admin.role)
  return { queues: await queueCounts(db, role, admin.id, sla), sla }
})
