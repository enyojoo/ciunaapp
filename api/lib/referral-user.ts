import type { SupabaseClient } from "@supabase/supabase-js"
import { generateReferralSlug } from "@/lib/referral-slug"

export async function ensureUserReferralSlug(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: row } = await supabase.from("users").select("referral_slug").eq("id", userId).maybeSingle()
  if (row?.referral_slug) return row.referral_slug

  for (let i = 0; i < 12; i++) {
    const slug = generateReferralSlug()
    const { error } = await supabase.from("users").update({ referral_slug: slug }).eq("id", userId).is("referral_slug", null)
    if (!error) {
      const { data: fresh } = await supabase.from("users").select("referral_slug").eq("id", userId).single()
      if (fresh?.referral_slug) return fresh.referral_slug
    }
    const { data: other } = await supabase.from("users").select("referral_slug").eq("id", userId).maybeSingle()
    if (other?.referral_slug) return other.referral_slug
  }

  throw new Error("Could not assign referral slug")
}
