import { db, assert, check, methods } from "./service"
export const CATEGORIES = {
  food: ["Meals", "Snacks", "Drinks", "Other"],
  mart: ["Groceries", "Household", "Electronics", "Other"],
} as const
export async function validateProduct(row: Record<string, any>) {
  const line = row.service_line_slug
  if (line !== "food" && line !== "mart") return
  assert(
    (CATEGORIES[line as keyof typeof CATEGORIES] as readonly string[]).includes(row.category),
    "CATEGORY_OUTSIDE_LINE",
    400,
  )
  assert(["delivery", "pickup", "digital"].includes(row.fulfillment_mode), "FULFILLMENT_REQUIRED", 400)
  assert(
    row.stock_quantity == null || (Number.isInteger(row.stock_quantity) && row.stock_quantity >= 0),
    "INVALID_STOCK",
    400,
  )
  assert(
    Number.isFinite(Number(row.fee_percent || 0)) &&
      Number(row.fee_percent || 0) >= 0 &&
      Number(row.fee_percent || 0) <= 100,
    "INVALID_FEE",
    400,
  )
  assert(Array.isArray(row.form_schema) && row.form_schema.length <= 20, "INVALID_FORM", 400)
  const keys = new Set<string>()
  for (const f of row.form_schema) {
    assert(
      f &&
        /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(f.key) &&
        !["__proto__", "constructor", "prototype"].includes(f.key) &&
        !keys.has(f.key) &&
        typeof f.label === "string" &&
        f.label.length > 0 &&
        ["text", "textarea", "number", "url", "select"].includes(f.type),
      "INVALID_FORM",
      400,
    )
    keys.add(f.key)
    if (f.type === "select")
      assert(
        Array.isArray(f.options) &&
          f.options.length > 0 &&
          f.options.every((o: any) => typeof o.value === "string" && typeof o.label === "string"),
        "INVALID_FORM",
        400,
      )
  }
  if (row.status !== "live") return
  if (row.pricing_type === "fixed")
    assert(Number.isFinite(Number(row.fixed_amount)) && Number(row.fixed_amount) > 0, "PRICE_REQUIRED", 400)
  else
    assert(
      row.funded_min == null || (Number.isFinite(Number(row.funded_min)) && Number(row.funded_min) >= 0),
      "INVALID_AMOUNT",
      400,
    )
  assert(
    row.funded_max == null ||
      (Number.isFinite(Number(row.funded_max)) &&
        Number(row.funded_max) > 0 &&
        Number(row.funded_max) >= Number(row.funded_min || 0)),
    "INVALID_AMOUNT",
    400,
  )
  assert(row.title && row.owner_team, "OWNERSHIP_REQUIRED", 400)
  const currency = row.pricing_type === "fixed" ? row.fixed_currency : row.default_input_currency
  assert(currency && /^[A-Z]{3}$/.test(currency), "CURRENCY_REQUIRED", 400)
  assert(row.fulfillment_mode === "digital" || row.vendor_id, "VENDOR_REQUIRED", 400)
  if (row.vendor_id) {
    const { data: v, error } = await db()
      .from("hub_vendors")
      .select("*")
      .eq("id", row.vendor_id)
      .maybeSingle()
    check(error)
    assert(v?.is_published && v.service_line_slug === line, "VENDOR_UNAVAILABLE", 400)
    if (row.fulfillment_mode === "pickup")
      assert(v.pickup_location && v.pickup_hours, "PICKUP_CONFIGURATION_REQUIRED", 400)
    if (row.fulfillment_mode === "delivery") {
      const { data: z, error } = await db()
        .from("marketplace_zones")
        .select("id")
        .eq("vendor_id", v.id)
        .eq("active", true)
        .eq("currency", currency)
      check(error)
      assert(z?.length, "DELIVERY_ZONE_REQUIRED", 400)
    }
  }
  const available = await methods(currency)
  assert(available.options.length, "PAYMENT_METHOD_REQUIRED", 400)
}
export function productExtras(body: any) {
  return {
    long_description: body.long_description || null,
    form_schema: body.form_schema || [],
    fulfillment_mode:
      body.fulfillment_mode ||
      ({ online: "digital", in_person: "delivery" } as any)[body.fulfillment_type] ||
      null,
    require_phone: typeof body.require_phone === "boolean" ? body.require_phone : null,
    owner_team: String(body.owner_team || "operations"),
  }
}
