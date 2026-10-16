import { createServerClient } from "@/lib/supabase"
import { assert, check, MerchantError } from "./errors"
import { slugify, withSuffix } from "./slug"
import { MERCHANT_EDITABLE_FIELDS, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from "./status"
import type { MerchantRow } from "./auth"

const db = () => createServerClient()

export async function getMerchant(id: string): Promise<MerchantRow> {
  const { data, error } = await db().from("merchants").select("*").eq("id", id).maybeSingle()
  check(error)
  assert(data, "MERCHANT_NOT_FOUND", 404)
  return data as MerchantRow
}

/** Create a draft merchant plus its (unpublished) storefront / profile row, and make the user its owner. */
export async function createMerchant(
  userId: string,
  input: { type: "store" | "expert"; displayName: string; country: string; operatingCountry?: string; languages?: string[]; line?: string; email?: string },
) {
  const type = input.type
  assert(type === "store" || type === "expert", "INVALID_TYPE")
  const displayName = String(input.displayName || "").trim()
  assert(displayName.length >= 2 && displayName.length <= 80, "DISPLAY_NAME_INVALID")
  const country = String(input.country || "").toUpperCase()
  assert(/^[A-Z]{2}$/.test(country), "COUNTRY_INVALID")
  const operating = String(input.operatingCountry || "RU").toUpperCase()
  assert(/^[A-Z]{2}$/.test(operating), "COUNTRY_INVALID")
  const languages = Array.from(new Set((input.languages?.length ? input.languages : ["en"]).filter((l) => (SUPPORTED_LANGUAGES as readonly string[]).includes(l))))
  assert(languages.length > 0, "LANGUAGE_INVALID")
  const line = input.line
  if (type === "store") assert(line === "food" || line === "mart", "SERVICE_LINE_REQUIRED")

  const { count } = await db().from("merchant_members").select("merchant_id", { count: "exact", head: true }).eq("user_id", userId).eq("role", "owner")
  assert((count ?? 0) < 5, "MERCHANT_LIMIT_REACHED", 409)

  const base = slugify(displayName)
  let merchant: MerchantRow | null = null
  for (let i = 0; i < 5 && !merchant; i++) {
    const slug = `${type === "store" ? "s" : "x"}-${withSuffix(base, i)}`
    const { data, error } = await db()
      .from("merchants")
      .insert({
        type, slug, display_name: displayName, country, operating_country: operating, languages,
        default_language: languages[0], contact_email: input.email || null, created_by: userId,
      })
      .select("*")
      .single()
    if (error?.code === "23505") continue
    check(error)
    merchant = data as MerchantRow
  }
  assert(merchant, "SLUG_UNAVAILABLE", 409)

  const owner = await db().from("merchant_members").insert({ merchant_id: merchant.id, user_id: userId, role: "owner" })
  check(owner.error)

  // storefront / profile (unpublished until Office approves)
  if (type === "store") {
    for (let i = 0; i < 5; i++) {
      const { error } = await db().from("hub_vendors").insert({
        service_line_slug: line, name: displayName, slug: withSuffix(base, i), merchant_id: merchant.id,
        is_published: false, is_verified: false,
      })
      if (error?.code === "23505") continue
      check(error)
      break
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const { error } = await db().from("expert_profiles").insert({
        display_name: displayName, slug: withSuffix(base, i), merchant_id: merchant.id, is_published: false,
      })
      if (error?.code === "23505") continue
      check(error)
      break
    }
  }
  return merchant
}

export function pickEditable(body: Record<string, any>, merchant: MerchantRow) {
  const patch: Record<string, any> = {}
  for (const key of MERCHANT_EDITABLE_FIELDS) {
    if (!(key in body)) continue
    let v = body[key]
    if (key === "languages") {
      assert(Array.isArray(v) && v.length > 0 && v.every((l) => (SUPPORTED_LANGUAGES as readonly string[]).includes(l)), "LANGUAGE_INVALID")
      v = Array.from(new Set(v))
    } else if (key === "default_language") {
      assert((SUPPORTED_LANGUAGES as readonly string[]).includes(v), "LANGUAGE_INVALID")
    } else if (key === "default_currency") {
      assert((SUPPORTED_CURRENCIES as readonly string[]).includes(String(v).toUpperCase()), "CURRENCY_INVALID")
      v = String(v).toUpperCase()
    } else if (key === "country" || key === "operating_country") {
      assert(/^[A-Za-z]{2}$/.test(String(v)), "COUNTRY_INVALID")
      v = String(v).toUpperCase()
    } else if (key === "description") {
      assert(v && typeof v === "object" && !Array.isArray(v), "DESCRIPTION_INVALID")
      const clean: Record<string, string> = {}
      for (const [lang, text] of Object.entries(v)) {
        if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) clean[lang] = String(text || "").slice(0, 2000)
      }
      v = clean
    } else if (typeof v === "string") {
      v = v.trim() || null
      if (key === "display_name") assert(v && v.length >= 2 && v.length <= 80, "DISPLAY_NAME_INVALID")
      if (key === "contact_email" && v) assert(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "EMAIL_INVALID")
      if ((key === "logo_url" || key === "cover_url" || key === "website") && v) assert(/^https:\/\//.test(v), "URL_INVALID")
    }
    patch[key] = v
  }
  const languages = patch.languages ?? merchant.languages
  const def = patch.default_language ?? merchant.default_language
  assert(languages.includes(def), "DEFAULT_LANGUAGE_NOT_IN_LANGUAGES")
  return patch
}

/** Keep the customer-facing storefront in step with the merchant's status. */
export async function syncPublication(merchant: Pick<MerchantRow, "id" | "type" | "status" | "kyb_tier" | "display_name" | "logo_url">) {
  const published = merchant.status === "live"
  if (merchant.type === "store") {
    const { error } = await db()
      .from("hub_vendors")
      .update({ is_published: published, is_verified: published && merchant.kyb_tier >= 1, updated_at: new Date().toISOString() })
      .eq("merchant_id", merchant.id)
    check(error)
  } else {
    const { error } = await db().from("expert_profiles").update({ is_published: published, updated_at: new Date().toISOString() }).eq("merchant_id", merchant.id)
    check(error)
  }
}

/** Mirror seller-edited profile fields onto the customer-facing row. */
export async function syncStorefrontFields(merchant: MerchantRow) {
  const desc = merchant.description?.[merchant.default_language] || null
  if (merchant.type === "store") {
    const { error } = await db()
      .from("hub_vendors")
      .update({ name: merchant.display_name, photo_url: merchant.logo_url, short_bio: desc, translations: { description: merchant.description || {} }, updated_at: new Date().toISOString() })
      .eq("merchant_id", merchant.id)
    check(error)
  } else {
    const { error } = await db()
      .from("expert_profiles")
      .update({ display_name: merchant.display_name, image_url: merchant.logo_url, bio: desc, translations: { description: merchant.description || {} }, updated_at: new Date().toISOString() })
      .eq("merchant_id", merchant.id)
    check(error)
  }
}

export async function resolveKybProfile(country: string, type: string, tier: number) {
  const { data, error } = await db().from("kyb_profiles").select("*").eq("tier", tier).eq("active", true).in("country", [country, "*"]).in("merchant_type", [type, "*"])
  check(error)
  const rows = data || []
  // most specific wins: country+type, country+*, *+type, *+*
  const score = (r: any) => (r.country === country ? 2 : 0) + (r.merchant_type === type ? 1 : 0)
  return rows.sort((a: any, b: any) => score(b) - score(a))[0] || null
}

export async function applicationChecklist(merchant: MerchantRow, answers: Record<string, any> | null) {
  const items: Array<{ key: string; done: boolean; detail?: string }> = []
  const desc = merchant.description?.[merchant.default_language]
  items.push({ key: "profile", done: Boolean(merchant.display_name && desc && desc.trim().length >= 20 && (merchant.contact_email || merchant.contact_phone)) })
  items.push({ key: "logo", done: Boolean(merchant.logo_url) })

  const tier = Number(answers?.tier) || 0
  const profile = tier ? await resolveKybProfile(merchant.country, merchant.type, tier) : null
  items.push({ key: "tier", done: Boolean(profile) })
  const docs = (await db().from("merchant_documents").select("kind,status").eq("merchant_id", merchant.id)).data || []
  if (profile) {
    const fields: any[] = profile.requirements?.fields || []
    const missing = fields.filter((f) => f.required && !String(answers?.fields?.[f.key] ?? "").trim()).map((f) => f.key)
    items.push({ key: "kyb_fields", done: missing.length === 0, detail: missing.join(",") })
    const need: any[] = (profile.requirements?.documents || []).filter((d: any) => d.required)
    const lacking = need.filter((d) => !docs.some((x: any) => x.kind === d.kind && x.status !== "rejected")).map((d) => d.kind)
    items.push({ key: "kyb_documents", done: lacking.length === 0, detail: lacking.join(",") })
  } else {
    items.push({ key: "kyb_fields", done: false }, { key: "kyb_documents", done: false })
  }

  let listings = 0
  if (merchant.type === "store") {
    const r = await db().from("hub_products").select("id", { count: "exact", head: true }).eq("merchant_id", merchant.id)
    listings = r.count ?? 0
  } else {
    const p = await db().from("expert_profiles").select("id").eq("merchant_id", merchant.id).maybeSingle()
    if (p.data) {
      const r = await db().from("expert_services").select("id", { count: "exact", head: true }).eq("expert_profile_id", p.data.id)
      listings = r.count ?? 0
    }
  }
  items.push({ key: "first_listing", done: listings > 0 })
  return { items, complete: items.every((i) => i.done), profile }
}

export { MerchantError }
