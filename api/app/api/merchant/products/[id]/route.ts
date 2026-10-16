import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "@/lib/merchant/errors"
import { buildSellerProduct, validateLive, vendorOf, CONTENT_FIELDS } from "@/lib/merchant/products"
import { audit } from "@/lib/merchant/audit"

async function owned(merchantId: string, id: string) {
  const { data, error } = await createServerClient().from("hub_products").select("*").eq("id", id).eq("merchant_id", merchantId).maybeSingle()
  check(error)
  assert(data, "PRODUCT_NOT_FOUND", 404)
  return data
}

export const GET = merchantRoute("catalog", async (_req, { merchant }, params) => ({ product: await owned(merchant.id, params.id) }))

export const PATCH = merchantRoute("catalog", async (req, { user, merchant }, params) => {
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  const existing = await owned(merchant.id, params.id)
  const body = await readJson(req)
  const vendor = await vendorOf(merchant.id)
  const row: Record<string, any> = buildSellerProduct(body, merchant, vendor, existing)
  const contentChanged = CONTENT_FIELDS.some((f) => JSON.stringify(row[f] ?? null) !== JSON.stringify(existing[f] ?? null))
  if (contentChanged) row.review_status = "pending"
  if (row.status === "live") {
    assert(merchant.status === "live", "MERCHANT_NOT_LIVE", 409)
    assert(existing.review_status !== "rejected" || contentChanged, "LISTING_REJECTED", 409)
    await validateLive(row)
  }
  const { data, error } = await createServerClient().from("hub_products").update(row).eq("id", existing.id).select("*").single()
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "product.updated", entityType: "hub_product", entityId: existing.id, details: { status: row.status, contentChanged } })
  return { product: data }
})

/** Delete = archive. Past orders keep their own snapshot; the row stays for references. */
export const DELETE = merchantRoute("catalog", async (_req, { user, merchant }, params) => {
  const existing = await owned(merchant.id, params.id)
  const { error } = await createServerClient().from("hub_products").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", existing.id)
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "product.archived", entityType: "hub_product", entityId: existing.id })
  return { ok: true }
})
