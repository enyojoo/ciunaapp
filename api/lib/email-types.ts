// Email notification types and interfaces

export type EmailLocale = "en" | "ru" | "fr" | "es"

export interface EmailTemplate {
  subject: string | ((data: any) => string)
  html: (data: any) => string
  text: (data: any) => string
}

export interface EmailData {
  to: string
  template: string
  data: any
}

export interface TransactionEmailData {
  transactionId: string
  recipientName: string
  sendAmount: number
  sendCurrency: string
  receiveAmount: number
  receiveCurrency: string
  exchangeRate: number
  fee: number
  /** Corridor / transfer fee is separate from logistics (cash fulfillment). */
  logisticsFee?: number
  totalAmount?: number
  fulfillmentType?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  failureReason?: string
  createdAt: string
  updatedAt: string
  /** User's preferred language for email content. Defaults to 'en'. */
  locale?: EmailLocale
}

export interface HubTransactionEmailData {
  transactionId: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  // money
  sendAmount: number
  sendCurrency: string
  fundedAmount: number
  fundedCurrency: string
  exchangeRate: number
  corridorFee: number
  hubFee: number
  totalAmount: number
  // product
  productTitle: string
  pricingType: "fixed" | "user_input"
  // fulfillment / contact
  fulfillmentType: "online" | "in_person"
  contactName: string
  contactPhone: string
  deliveryAddressLine?: string | null
  // misc
  failureReason?: string
  createdAt: string
  updatedAt: string
  /** User's preferred language for email content. Defaults to 'en'. */
  locale?: EmailLocale
}

export interface WelcomeEmailData {
  firstName: string
  lastName: string
  email: string
  baseCurrency: string
  dashboardUrl: string
  locale?: EmailLocale
}

/** Referral balance withdrawal / payout request lifecycle (mirrors send: pending → completed/cancelled) */
export interface ReferralPayoutEmailData {
  firstName: string
  amount: number
  currency: string
  recipientName: string
  /** pending = user just submitted; completed / cancelled = Office action */
  status: "pending" | "completed" | "cancelled"
  payoutRequestId?: string
  /** ETID reserved at request time (matches completed send row). */
  payoutTransactionId?: string
  linkedTransactionId?: string
  dashboardUrl: string
  locale?: EmailLocale
}

export interface EmailServiceConfig {
  fromEmail: string
  fromName: string
  replyTo?: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

/** @deprecated Use EmailSendResult */
export type SendGridResponse = EmailSendResult
