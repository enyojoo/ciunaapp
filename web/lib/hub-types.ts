/** One dynamic checkout field (Office `form_schema` row). */
export interface HubFormFieldSchema {
  key: string
  label: string
  type: "text" | "textarea" | "number" | "url" | "select"
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

/** Stored on `transactions.hub_snapshot` after payment. */
export interface HubTransactionSnapshot {
  productTitle: string
  productPricingType: "fixed" | "user_input"
  fundedAmount: number
  fundedCurrency: string
  feePercent: number | null
  hubFeeAmount: number
  corridorFeeAmount: number
  billingContext?: "one_time" | "recurring" | null
  contactName: string
  contactPhone: string
  fulfillmentType?: "online" | "in_person" | "vendor"
  deliveryAddressLine?: string | null
  formAnswers: Record<string, unknown>
  /**
   * Cart checkouts (multiple line items) mirror `hub_order_items` here too, so a consumer that
   * only has `hub_snapshot` (e.g. an email template) can render a summary without an extra join.
   * `hub_order_items` is the source of truth; this is a convenience copy, frozen at checkout.
   */
  items?: { title: string; quantity: number; unitPrice: number; lineTotal: number }[]
  vendorName?: string | null
}

/** Vendor summary joined on public hub product APIs for storefront links. */
export interface HubProductVendorSummary {
  id: string
  name: string
  slug: string
  service_line_slug: string
  photo_url: string | null
  /** When true, show verified badge (requires `is_verified` on `hub_vendors`). */
  is_verified: boolean
}

export interface HubProductRow {
  long_description?: string | null
  fulfillment_mode?: "digital" | "delivery" | "pickup" | null
  require_phone?: boolean | null

  id: string
  /** When set, product belongs to a Food/Mart vendor storefront. */
  vendor_id?: string | null
  /** Joined on hub product API responses when `vendor_id` is set. */
  vendor?: HubProductVendorSummary
  title: string
  short_description: string | null
  category: string
  /** Marketplace line when category is Food or Mart (`food` | `mart`); null for other hub categories. */
  service_line_slug?: "food" | "mart" | null
  /** When omitted (e.g. older localStorage cache), treat as false. */
  is_featured?: boolean
  status: "draft" | "live" | "archived"
  pricing_type: "fixed" | "user_input"
  fulfillment_type?: "online" | "in_person" | "vendor"
  /** List price (required for fixed pricing in admin). Legacy rows may only have `fixed_amount`. */
  list_price?: number | null
  /** Optional promotional price; when unset, list price applies. */
  sale_price?: number | null
  /** Effective charge amount for checkout (mirrors sale ?? list for fixed products). */
  fixed_amount: number | null
  fixed_currency: string | null
  default_input_currency: string | null
  fee_percent: number | null
  funded_min: number | null
  funded_max: number | null
  sla_text: string | null
  image_url: string | null
  /** Null = unlimited stock. */
  stock_quantity?: number | null
  sold_out?: boolean
  created_at: string
  updated_at: string
}

/** One line in a cart, hydrated with live product data (price/availability may have moved since it was added). */
export interface HubCartItemRow {
  id: string
  cart_id: string
  hub_product_id: string
  quantity: number
  /** Joined live from `hub_products`; absent/null when the product was deleted. */
  product?: HubProductRow | null
  /** True when `product` is missing, archived, or `sold_out` — surfaced so the UI can flag it instead of silently changing the total. */
  unavailable?: boolean
  created_at: string
  updated_at: string
}

/** A single-vendor, server-synced cart (Food/Mart only). */
export interface HubCartRow {
  id: string
  user_id: string
  service_line_slug: "food" | "mart"
  vendor_id: string
  vendor?: HubProductVendorSummary
  status: "active" | "converted" | "abandoned"
  items: HubCartItemRow[]
  created_at: string
  updated_at: string
}

/** Frozen line item on a placed order (`transactions` row = order header). */
export interface HubOrderItemRow {
  id: string
  transaction_id: string
  hub_product_id: string | null
  title: string
  unit_price: number
  currency: string
  quantity: number
  line_total: number
  created_at: string
}

/** How a Hub/Expert transaction was paid. */
export type HubPaymentProvider = "manual" | "yookassa"
