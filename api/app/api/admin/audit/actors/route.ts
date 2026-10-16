import { adminRoute } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { cleanSearch, displayName, isMissingSchema } from "@/lib/merchant/office"

export const dynamic = "force-dynamic"

/** Pickers for the audit filters: Office staff by name or email, merchants by name. ?q= (2+ characters). */
export const GET = adminRoute("audit.read", async (req) => {
  const q = cleanSearch(new URL(req.url).searchParams.get("q"))
  if (!q) return { actors: [], merchants: [] }
  const db = createServerClient()
  const like = `%${q}%`
  const [a, m] = await Promise.all([
    db.from("admin_users").select("id,name,email,role").or(`name.ilike.${like},email.ilike.${like}`).limit(8),
    db.from("merchants").select("id,display_name,type").ilike("display_name", like).limit(8),
  ])
  for (const r of [a, m]) if (r.error && !isMissingSchema(r.error)) console.error("audit picker failed", r.error.code, r.error.message)
  return {
    actors: (a.data || []).map((x: any) => ({ id: x.id, name: displayName(null, null, x.name), email: x.email, role: x.role })),
    merchants: (m.data || []).map((x: any) => ({ id: x.id, name: x.display_name, type: x.type })),
  }
})
