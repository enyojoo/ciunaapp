export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  flag: string
  flag_svg?: string
  status: string
  can_send?: boolean
  can_receive?: boolean
  receive_completion_timer_seconds?: number
  created_at: string
  updated_at: string
}

export interface ExchangeRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  fee_type: "free" | "fixed" | "percentage"
  fee_amount: number
  min_amount?: number
  max_amount?: number
  bank_receive_min?: number | null
  bank_receive_max?: number | null
  cash_receive_min?: number | null
  cash_receive_max?: number | null
  logistics_fee_type?: "free" | "fixed" | "percentage"
  logistics_fee_amount?: number
  status: string
  created_at: string
  updated_at: string
  from_currency_info?: Currency
  to_currency_info?: Currency
}

export interface DeliveryAddress {
  id: string
  user_id: string
  address_line: string
  phone: string
  created_at: string
  updated_at: string
}

export interface Recipient {
  id: string
  user_id: string
  full_name: string
  account_number: string
  bank_name: string
  phone_number?: string
  currency: string
  routing_number?: string
  sort_code?: string
  iban?: string
  swift_bic?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  transfer_type?: "ACH" | "Wire"
  checking_or_savings?: "checking" | "savings"
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  transaction_id: string
  user_id: string
  recipient_id: string | null
  send_amount: number
  send_currency: string
  receive_amount: number
  receive_currency: string
  exchange_rate: number
  fee_amount: number
  fee_type: string
  total_amount: number
  /** send (default) | hub — set for Hub marketplace checkouts */
  transaction_source?: "send" | "hub"
  hub_product_id?: string | null
  hub_snapshot?: Record<string, unknown> | null
  hub_fee_amount?: number
  fulfillment_type?: "bank_transfer" | "cash_hand"
  logistics_fee_amount?: number
  logistics_fee_type_snapshot?: string | null
  delivery_address_line?: string | null
  delivery_phone?: string | null
  delivery_address_id?: string | null
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  reference?: string
  receipt_url?: string
  receipt_filename?: string
  created_at: string
  updated_at: string
  completed_at?: string
  failure_reason?: string
  recipient?: Recipient
  user?: {
    first_name: string
    last_name: string
    email: string
  }
}

export type AccountType = "us" | "uk" | "euro" | "generic"

export interface PaymentMethod {
  id: string
  currency: string
  type: "bank_account" | "qr_code" | "stablecoin" | "mobile_money"
  name: string
  account_name?: string
  account_number?: string
  bank_name?: string
  routing_number?: string
  sort_code?: string
  iban?: string
  swift_bic?: string
  qr_code_data?: string
  crypto_asset?: string
  crypto_network?: string
  wallet_address?: string
  instructions?: string
  completion_timer_seconds?: number
  is_default: boolean
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  base_currency: string
  status: "active" | "inactive"
  // verification_status removed - use the provider-backed KYC status field
  created_at: string
  updated_at: string
}

export interface TransactionStatusHistory {
  id: string
  transaction_id: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  previous_status?: string
  failure_reason?: string
  created_at: string
  updated_at: string
}
