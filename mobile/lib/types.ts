export type HubProduct = {
  id: string
  title: string
  short_description?: string | null
  category?: string | null
  service_line_slug?: "food" | "mart" | null
  image_url?: string | null
  list_price?: number | null
  sale_price?: number | null
  fixed_amount?: number | null
  fixed_currency?: string | null
  default_input_currency?: string | null
  pricing_type?: "fixed" | "user_input"
  fulfillment_type?: string | null
  sla_text?: string | null
  vendor_id?: string | null
  funded_min?: number | null
  funded_max?: number | null
  fee_percent?: number | null
  stock_quantity?: number | null
  sold_out?: boolean | null
  is_featured?: boolean | null
  updated_at?: string
  vendor?: {
    id: string
    name: string
    slug: string
    service_line_slug?: string
    photo_url?: string | null
    is_verified?: boolean
  } | null
}

export type HubCartItem = {
  id: string
  cart_id: string
  hub_product_id: string
  quantity: number
  product?: HubProduct | null
  unavailable?: boolean
}

export type HubCart = {
  id: string
  user_id: string
  service_line_slug: "food" | "mart"
  vendor_id: string
  vendor?: HubProduct["vendor"]
  status: "active" | "converted" | "abandoned"
  items: HubCartItem[]
}

export type HubOrderItem = {
  id: string
  transaction_id: string
  hub_product_id: string | null
  title: string
  unit_price: number
  currency: string
  quantity: number
  line_total: number
}

export type HubVendor = {
  id: string
  name: string
  slug: string
  photo_url?: string | null
  short_bio?: string | null
  location?: string | null
  is_verified?: boolean
  service_line_slug?: string
}

export type CombinedTransaction = {
  id?: string
  transaction_id: string
  type?: string | null
  status?: string | null
  created_at?: string
  reference?: string | null
  transaction_source?: string | null
  hub_snapshot?: Record<string, unknown> | null
  hub_product_category?: string | null
  hub_order_items?: HubOrderItem[]
  payment_provider?: "manual" | "yookassa" | null
  send_amount?: number
  send_currency?: string
  receive_amount?: number
  receive_currency?: string
  total_amount?: number
  fee_amount?: number
  exchange_rate?: number
  fulfillment_type?: string | null
  delivery_address_line?: string | null
  contact_name?: string | null
  contact_phone?: string | null
  recipient?: {
    full_name?: string
    account_number?: string
    bank_name?: string
  } | null
}

export type CurrencyRow = {
  code: string
  name?: string
  symbol?: string
  can_send?: boolean
  can_receive?: boolean
}

export type RecipientRow = {
  id: string
  full_name: string
  account_number?: string
  bank_name?: string
  currency?: string
  phone_number?: string
}

export type ExpertProfile = {
  id: string
  slug: string | null
  display_name: string
  headline?: string | null
  bio?: string | null
  category?: string | null
  image_url?: string | null
  pricing_hint?: string | null
  service_area?: string | null
  meeting_hint?: string | null
  created_at?: string
}

export type ExpertCatalogService = {
  id: string
  title: string
  short_description?: string | null
  fulfillment_type?: string | null
  pricing_type?: string
  hourly_rate?: number | null
  hourly_currency?: string | null
  fixed_amount?: number | null
  fixed_currency?: string | null
  package_label?: string | null
  default_duration_minutes?: number | null
  expert: {
    id: string
    slug?: string | null
    display_name: string
    image_url?: string | null
    category?: string | null
    is_verified?: boolean
  }
}

export type ExpertService = {
  id: string
  title: string
  short_description?: string | null
  fulfillment_type?: string | null
  pricing_type?: string
  hourly_rate?: number | null
  hourly_currency?: string | null
  fixed_amount?: number | null
  fixed_currency?: string | null
  package_label?: string | null
  default_duration_minutes?: number | null
}

export type ExpertSlot = {
  id: string
  slot_start: string
  slot_end: string
  status?: string
}
