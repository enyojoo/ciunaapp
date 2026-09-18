import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/admin-auth-utils"
import { sumCompletedVolumeInBaseCurrency } from "@ciuna/shared"

/**
 * Admin: completed send+hub volume per user (each in that user's `base_currency`).
 * Uses full transaction history, not the trimmed lists used by Office client cache.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const server = createServerClient()

    const [{ data: users, error: usersErr }, { data: txs, error: txErr }, { data: rates, error: rateErr }] =
      await Promise.all([
        server.from("users").select("id, base_currency"),
        server
          .from("transactions")
          .select("user_id, status, send_amount, send_currency, total_amount, reference, transaction_source")
          .eq("status", "completed"),
        server.from("exchange_rates").select("from_currency, to_currency, rate, status").eq("status", "active"),
      ])

    if (usersErr) throw usersErr
    if (txErr) throw txErr
    if (rateErr) throw rateErr

    type TxRow = NonNullable<typeof txs>[number]
    const byUserId = new Map<string, TxRow[]>()
    for (const row of txs || []) {
      const uid = row.user_id as string
      if (!uid) continue
      if (!byUserId.has(uid)) byUserId.set(uid, [])
      byUserId.get(uid)!.push(row)
    }

    const volumes: Record<string, number> = {}
    for (const u of users || []) {
      const id = u.id as string
      const base = ((u.base_currency as string) || "NGN").trim() || "NGN"
      const list = byUserId.get(id) || []
      volumes[id] = sumCompletedVolumeInBaseCurrency(list, base, rates || [])
    }

    return NextResponse.json({ volumes })
  } catch (e) {
    console.error("admin users completed-volumes:", e)
    const message = e instanceof Error ? e.message : "Failed to compute volumes"
    const status = message === "Admin access required" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
