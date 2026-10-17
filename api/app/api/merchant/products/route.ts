import { merchantRoute, readJson } from "@/lib/merchant/http"
import { createServerClient } from "@/lib/supabase"
import { withProductMainCategoryFallback } from "@/lib/product-main-category"
import { assert, check } from "@/lib/merchant/errors"
import { buildSellerProduct, validateLive, vendorOf } from "@/lib/merchant/products"
import { audit } from "@/lib/merchant/audit"

export const GET = merchantRoute("catalog", async (req, { merchant }) => {
  const sp = new URL(req.url).searchParams
  let q = createServerClient().from("hub_products").select("*", { count: "exact" }).eq("merchant_id", merchant.id)
  const status = sp.get("status")
  if (status && ["draft", "live", "archived"].includes(status)) q = q.eq("status", status)
  const text = (sp.get("q") || "").trim().replace(/[%,()]/g, "")
  if (text) q = q.ilike("title", `%${text}%`)
  const limit = Math.min(Number(sp.get("limit")) || 50, 200)
  const offset = Math.max(Number(sp.get("offset")) || 0, 0)
  const { data, error, count } = await q.order("updated_at", { ascending: false }).range(offset, offset + limit - 1)
  check(error)
  return { products: data || [], total: count ?? 0 }
})

export const POST = merchantRoute("catalog", async (req, { user, merchant }) => {
  assert(merchant.type === "store", "STORE_ONLY", 409)
  assert(merchant.status !== "suspended", "MERCHANT_SUSPENDED", 403)
  const vendor = await vendorOf(merchant.id)
  const row = { ...buildSellerProduct(await readJson(req), merchant, vendor, null), review_status: "pending" }
  if (row.status === "live") {
    assert(merchant.status === "live", "MERCHANT_NOT_LIVE", 409)
    await validateLive(row)
  }
  const { data, error } = await withProductMainCategoryFallback(row, (r) => createServerClient().from("hub_products").insert(r).select("*").single())
  check(error)
  await audit({ actorKind: "merchant", actorId: user.id, merchantId: merchant.id, action: "product.created", entityType: "hub_product", entityId: data!.id, details: { status: row.status } })
  return { product: data }
})
