import { createServerClient } from "@/lib/supabase"
import { assert, check, MerchantError } from "./errors"
import { SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from "./status"
import { CATEGORIES, validateProduct } from "@/lib/marketplace/catalog"
import { MarketplaceError } from "@/lib/marketplace/service"
import { resolveAdminHubFixedPricing } from "@/lib/hub-product-pricing-server"
import { hubProductImageUrlPaymentQrBucketError } from "@/lib/hub-product-image-url"
import type { MerchantRow } from "./auth"
import { readProductMainCategory } from "@/lib/product-main-category"

const MODE_TO_TYPE = { delivery: "in_person", pickup: "vendor", digital: "online" } as const
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)

export const SELLER_PRODUCT_FIELDS = [
  "title", "short_description", "long_description", "category", "list_price", "sale_price", "fixed_currency",
  "stock_quantity", "sold_out", "fulfillment_mode", "sla_text", "image_url", "gallery", "translations", "status",
] as const

/** Build the DB row from seller input, merged over `existing` for partial updates. */
export function buildSellerProduct(body: Record<string, any>, merchant: MerchantRow, vendor: { id: string; service_line_slug: string }, existing: Record<string, any> | null) {
  const line = vendor.service_line_slug as "food" | "mart"
  const pick = <T,>(key: string, fallback: T): any => (key in body ? body[key] : existing?.[key] ?? fallback)

  const title = str(pick("title", ""), 120)
  assert(title.length >= 2, "TITLE_REQUIRED")
  const category = String(pick("category", CATEGORIES[line][0]))
  assert((CATEGORIES[line] as readonly string[]).includes(category), "CATEGORY_OUTSIDE_LINE")
  const mode = String(pick("fulfillment_mode", "delivery")) as keyof typeof MODE_TO_TYPE
  assert(mode in MODE_TO_TYPE, "FULFILLMENT_REQUIRED")
  const currency = String(pick("fixed_currency", merchant.default_currency)).toUpperCase()
  assert((SUPPORTED_CURRENCIES as readonly string[]).includes(currency), "CURRENCY_INVALID")

  const pricing = resolveAdminHubFixedPricing("fixed", { list_price: pick("list_price", null), sale_price: "sale_price" in body ? body.sale_price : existing?.sale_price }, existing as any)
  if (pricing.error) throw new MerchantError("PRICE_REQUIRED", 400)
  assert(pricing.sale_price == null || pricing.sale_price < (pricing.list_price as number), "SALE_PRICE_TOO_HIGH")

  const stockRaw = pick("stock_quantity", null)
  const stock = stockRaw === null || stockRaw === "" ? null : Number(stockRaw)
  assert(stock === null || (Number.isInteger(stock) && stock >= 0 && stock < 1_000_000), "INVALID_STOCK")

  const image = pick("image_url", null) ? String(pick("image_url", null)) : null
  if (image) {
    assert(/^https:\/\//.test(image), "URL_INVALID")
    assert(!hubProductImageUrlPaymentQrBucketError(image), "URL_INVALID")
  }
  const gallery: string[] = Array.isArray(pick("gallery", [])) ? pick("gallery", []) : []
  assert(gallery.length <= 8 && gallery.every((u) => typeof u === "string" && /^https:\/\//.test(u)), "GALLERY_INVALID")

  const tr = pick("translations", {}) as Record<string, any>
  assert(tr && typeof tr === "object" && !Array.isArray(tr), "TRANSLATIONS_INVALID")
  const translations: Record<string, Record<string, string>> = {}
  for (const [lang, v] of Object.entries(tr)) {
    if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(lang) || !v || typeof v !== "object") continue
    translations[lang] = { title: str(v.title, 120), short_description: str(v.short_description, 300), long_description: str(v.long_description, 4000) }
  }

  const status = String(pick("status", "draft"))
  assert(["draft", "live", "archived"].includes(status), "STATUS_INVALID")

  // Where the product appears in the apps (meal type or aisle). Kept as is when the body leaves it out.
  const mainCategory = readProductMainCategory(line, body)
  assert(mainCategory !== "invalid", "MAIN_CATEGORY_OUTSIDE_LINE")

  return {
    title,
    short_description: str(pick("short_description", ""), 300) || null,
    long_description: str(pick("long_description", ""), 4000) || null,
    category,
    status,
    pricing_type: "fixed",
    list_price: pricing.list_price,
    sale_price: pricing.sale_price,
    fixed_amount: pricing.sale_price ?? pricing.list_price,
    fixed_currency: currency,
    default_input_currency: "USD",
    stock_quantity: stock,
    sold_out: Boolean(pick("sold_out", false)),
    fulfillment_mode: mode,
    fulfillment_type: MODE_TO_TYPE[mode],
    sla_text: str(pick("sla_text", ""), 120) || null,
    image_url: image,
    gallery,
    translations,
    form_schema: existing?.form_schema ?? [],
    owner_team: existing?.owner_team ?? "operations",
    require_phone: existing?.require_phone ?? null,
    fee_percent: existing?.fee_percent ?? null,
    vendor_id: vendor.id,
    merchant_id: merchant.id,
    service_line_slug: line,
    ...(mainCategory !== undefined ? { main_category: mainCategory } : {}),
    updated_at: new Date().toISOString(),
  }
}

/** Fields whose change re-enters Office post-moderation. Price, stock and availability changes are instant. */
export const CONTENT_FIELDS = ["title", "short_description", "long_description", "image_url", "gallery", "category", "translations"]

export async function validateLive(row: Record<string, any>) {
  try {
    await validateProduct(row)
  } catch (e) {
    if (e instanceof MarketplaceError) throw new MerchantError(e.code, 422)
    throw e
  }
}

export async function vendorOf(merchantId: string) {
  const { data, error } = await createServerClient().from("hub_vendors").select("id,service_line_slug").eq("merchant_id", merchantId).maybeSingle()
  check(error)
  assert(data, "STORE_ONLY", 409)
  return data as { id: string; service_line_slug: string }
}

