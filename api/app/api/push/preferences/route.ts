import { authedRoute, readJson } from "@/lib/merchant/http"
import { check } from "@/lib/merchant/errors"
import { createServerClient } from "@/lib/supabase"
import { wants } from "@/lib/push"

export const dynamic = "force-dynamic"

const KEYS = ["orders", "messages", "support", "transfers"] as const

export const GET = authedRoute(async (_req, user) => {
  const db = createServerClient()
  let { data, error } = await db.from("push_preferences").select("orders,messages,support,transfers").eq("user_id", user.id).maybeSingle()
  if (error) ({ data } = await db.from("push_preferences").select("orders,messages,support").eq("user_id", user.id).maybeSingle())
  return Object.fromEntries(KEYS.map((k) => [k, wants(data as any, k)]))
})

/** Switch categories on or off: { orders?: boolean, messages?: boolean, support?: boolean }. */
export const PUT = authedRoute(async (req, user) => {
  const b = await readJson(req)
  const row: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() }
  for (const k of KEYS) if (typeof b[k] === "boolean") row[k] = b[k]
  check((await createServerClient().from("push_preferences").upsert(row, { onConflict: "user_id" })).error)
  return { ok: true }
})
