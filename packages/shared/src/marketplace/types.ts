export type MarketplaceLine = "food" | "mart" | "experts"
export type FulfillmentMode =
  "delivery" | "pickup" | "digital" | "online_appointment" | "in_person_appointment"
export type PurchaseSource =
  | { kind: "cart"; cartId: string }
  | { kind: "product"; hubProductId: string; fundedAmount?: number }
  | { kind: "expert"; expertServiceSlotId: string }
export type MarketplacePaymentState =
  "awaiting_payment" | "processing" | "paid" | "expired" | "refund_pending" | "refunded"
export type MarketplaceFulfillmentState =
  "awaiting_payment" | "awaiting_acceptance" | "accepted" | "in_progress" | "fulfilled" | "cancelled"
export interface MarketplaceField {
  key: string
  label: string
  type: "text" | "textarea" | "number" | "url" | "select"
  required?: boolean
  options?: { value: string; label: string }[]
}
export interface MarketplaceMethod {
  id: string
  rail: "manual" | "yookassa"
  name: string
  currency: string
  instructions: Record<string, unknown>
}
export interface MarketplaceZone {
  id: string
  city: string
  district: string
  fee: number
  currency: string
}
export interface MarketplaceLineItem {
  id: string
  productId?: string
  title: string
  quantity: number
  unitPrice: number
  feePercent: number
  fields: MarketplaceField[]
}
export interface MarketplaceTotals {
  productCurrency: string
  payCurrency: string
  subtotal: number
  marketplaceFee: number
  deliveryFee: number
  exchangeRate: number
  convertedSubtotal: number
  corridorFee: number
  total: number
}
export interface MarketplacePreviewInput {
  source: PurchaseSource
  payCurrency?: string
  fulfillmentMode?: FulfillmentMode
  deliveryZoneId?: string
}
export interface MarketplaceQuote {
  id: string
  expiresAt: string
  source: PurchaseSource
  line: MarketplaceLine
  title: string
  lines: MarketplaceLineItem[]
  totals: MarketplaceTotals
  modes: FulfillmentMode[]
  fulfillmentMode: FulfillmentMode
  zones: MarketplaceZone[]
  deliveryZoneId?: string
  requirePhone: boolean
  methods: MarketplaceMethod[]
  payCurrencies: string[]
  instructions: string
  slotStart?: string
  slotEnd?: string
  timezone?: string
  checkoutReady: boolean
  fulfillmentMinutes?: number
}
export interface MarketplaceSubmit {
  quoteId: string
  idempotencyKey: string
  rail: "manual" | "yookassa"
  paymentMethodId?: string
  contactName: string
  contactPhone?: string
  deliveryAddressLine?: string
  deliveryAddressId?: string
  note?: string
  lineFormAnswers?: Record<string, Record<string, unknown>>
  gatewayMode?: "embedded" | "native"
}
export interface MarketplaceAttempt {
  id: string
  rail: "manual" | "yookassa"
  state: string
  confirmation_mode: "embedded" | "native"
  confirmation_token?: string | null
  confirmation_url?: string | null
  native_payment_type?: string | null
  instructions: Record<string, unknown>
  proof_path?: string | null
}
export interface MarketplaceOrder {
  id: string
  transaction_id: string
  public_id: string
  line: MarketplaceLine
  payment_state: MarketplacePaymentState
  fulfillment_state: MarketplaceFulfillmentState
  fulfillment_mode: FulfillmentMode
  payment_deadline: string
  snapshot: MarketplaceQuote & {
    contactName: string
    contactPhone?: string
    contactEmail: string
    deliveryAddressLine?: string
    note?: string
  }
  exception_reason?: string | null
  digital_content?: string | null
  assigned_to?: string | null
  owner_team: string
  created_at: string
  attempts: MarketplaceAttempt[]
  events: { id: string; kind: string; created_at: string; message: string }[]
  canCancel: boolean
  nextAction: "pay" | "checking" | "review" | "track" | "refund" | "none"
}
