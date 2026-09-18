import { hubProductEffectivePrice } from "@/lib/hub-product-price"
import type { HubProductRow } from "@/lib/hub-types"

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Resolves list / sale / effective for admin create & update.
 * Accepts `list_price` + optional `sale_price`, or legacy `fixed_amount` as list when `list_price` is absent.
 */
export function resolveAdminHubFixedPricing(
  pricingType: string,
  body: Record<string, unknown>,
  existing: Pick<HubProductRow, "list_price" | "sale_price" | "fixed_amount"> | null,
): { list_price: number | null; sale_price: number | null; fixed_amount: number | null; error?: string } {
  if (pricingType !== "fixed") {
    return { list_price: null, sale_price: null, fixed_amount: null }
  }

  let list = num(body.list_price)
  if (list == null || list <= 0) {
    list = num(body.fixed_amount)
  }
  if (list == null || list <= 0) {
    const exL = existing?.list_price != null ? Number(existing.list_price) : NaN
    const exF = existing?.fixed_amount != null ? Number(existing.fixed_amount) : NaN
    if (Number.isFinite(exL) && exL > 0) list = exL
    else if (Number.isFinite(exF) && exF > 0) list = exF
  }

  if (list == null || list <= 0) {
    return { list_price: null, sale_price: null, fixed_amount: null, error: "List price is required for fixed pricing" }
  }

  let sale = num(body.sale_price)
  if (sale != null && sale <= 0) sale = null

  if (sale == null && body.sale_price === undefined && existing) {
    const exS = existing.sale_price != null ? Number(existing.sale_price) : NaN
    if (Number.isFinite(exS) && exS > 0) sale = exS
  }

  const synthetic: HubProductRow = {
    id: "",
    title: "",
    short_description: null,
    category: "",
    status: "draft",
    pricing_type: "fixed",
    list_price: list,
    sale_price: sale,
    fixed_amount: list,
    fixed_currency: null,
    default_input_currency: null,
    fee_percent: null,
    funded_min: null,
    funded_max: null,
    sla_text: null,
    image_url: null,
    created_at: "",
    updated_at: "",
  }
  const effective = hubProductEffectivePrice(synthetic)

  return {
    list_price: list,
    sale_price: sale,
    fixed_amount: effective,
  }
}
