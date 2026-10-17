import { authedRoute, readJson } from "@/lib/merchant/http"
import { MerchantError, check } from "@/lib/merchant/errors"
import { createServerClient } from "@/lib/supabase"
import { wants } from "@/lib/push"
import { parseQuiet } from "@/lib/quiet-hours"

export const dynamic = "force-dynamic"

const KEYS = ["orders", "messages", "support", "transfers"] as const

export const GET = authedRoute(async (_req, user) => {
  const db = createServerClient()
  let { data, error } = await db.from("push_preferences").select("orders,messages,support,transfers,quiet_start,quiet_end").eq("user_id", user.id).maybeSingle()
  if (error) ({ data } = await db.from("push_preferences").select("orders,messages,support").eq("user_id", user.id).maybeSingle())
  const q = data as { quiet_start?: number | null; quiet_end?: number | null } | null
  const quiet = q?.quiet_start != null && q?.quiet_end != null ? { enabled: true, start: q.quiet_start, end: q.quiet_end } : { enabled: false, start: 22, end: 7 }
  return { ...Object.fromEntries(KEYS.map((k) => [k, wants(data as any, k)])), quiet }
})

/** Switch categories on or off: { orders?: boolean, messages?: boolean, support?: boolean }. */
export const PUT = authedRoute(async (req, user) => {
  const b = await readJson(req)
  const row: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() }
  for (const k of KEYS) if (typeof b[k] === "boolean") row[k] = b[k]
  if ("quiet" in b) {
    const quiet = parseQuiet(b.quiet)
    if (!quiet) throw new MerchantError("QUIET_HOURS_INVALID", 400)
    Object.assign(row, quiet)
  }
  check((await createServerClient().from("push_preferences").upsert(row, { onConflict: "user_id" })).error)
  return { ok: true }
})
