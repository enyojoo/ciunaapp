import { createServerClient } from "@/lib/supabase"
import { MerchantError, check } from "@/lib/merchant/errors"

export const DELETION_WAIT_DAYS = 30
const BAN_FOREVER = "876000h"

export interface Blockers { orders: number; transfers: number; refunds: number }

/** Turns what the database says into one API result: ok, or a DELETION_BLOCKED error that names what is in progress. */
export function interpretRequest(result: any): { purgeAfter: string } {
  if (result?.ok) return { purgeAfter: String(result.purge_after) }
  if (result?.blockers) throw new MerchantError("DELETION_BLOCKED", 409, { blockers: result.blockers })
  throw new MerchantError(result?.error || "DELETION_FAILED", 400)
}

export async function pendingDeletion(userId: string) {
  const { data } = await createServerClient().from("account_deletions").select("status,purge_after,requested_at").eq("user_id", userId).maybeSingle()
  return data && (data as any).status === "requested" ? (data as { status: string; purge_after: string; requested_at: string }) : null
}

export async function blockersFor(userId: string): Promise<Blockers> {
  const { data, error } = await createServerClient().rpc("account_deletion_blockers", { p_user: userId })
  check(error)
  return data as Blockers
}

/** Disable the account now (database flag and sign-in) and schedule the removal of personal data. */
export async function requestDeletion(userId: string, reason: string | null) {
  const db = createServerClient()
  const { data, error } = await db.rpc("account_request_deletion", { p_user: userId, p_reason: reason, p_days: DELETION_WAIT_DAYS })
  check(error)
  const out = interpretRequest(data)
  const ban = await db.auth.admin.updateUserById(userId, { ban_duration: BAN_FOREVER })
  if (ban.error) console.error("account deletion: could not block sign-in", ban.error.message)
  return out
}

export async function restoreDeletion(userId: string): Promise<boolean> {
  const db = createServerClient()
  const { data, error } = await db.rpc("account_restore", { p_user: userId })
  check(error)
  if (!data) return false
  const un = await db.auth.admin.updateUserById(userId, { ban_duration: "none" })
  if (un.error) console.error("account restore: could not unblock sign-in", un.error.message)
  return true
}

/** Remove personal data for accounts past their date, then the sign-in itself. */
export async function runPurge(limit = 20): Promise<{ purged: number }> {
  const db = createServerClient()
  const { data, error } = await db.rpc("account_purge_due", { p_limit: limit })
  check(error)
  const ids = (data as any[] | null) ?? []
  for (const row of ids) {
    const id = typeof row === "string" ? row : row?.account_purge_due
    if (!id) continue
    const del = await db.auth.admin.deleteUser(id)
    if (del.error) console.error("account purge: could not delete sign-in", del.error.message)
  }
  return { purged: ids.length }
}
