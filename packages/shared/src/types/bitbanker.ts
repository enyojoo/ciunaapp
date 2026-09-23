export type BitbankerEligibilityStatus =
  | "verified"
  | "not_verified"
  | "checking"
  | "unavailable"
  | "unconfigured"

export interface BitbankerEligibility {
  status: BitbankerEligibilityStatus | string
  isVerifiedForSbp: boolean
  clientId: string | null
}

export interface BitbankerSbpPaymentSummary {
  amount: number | null
  link: string | null
  qrData: string | null
  invoiceId: string | null
}
