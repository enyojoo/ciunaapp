import type { RecipientRow } from "@/lib/types"
import { getAccountTypeConfigFromCurrency } from "@/lib/currency-account-types"

export type RecipientFormData = {
  name: string
  accountNumber: string
  bankName: string
  currency: string
  routingNumber: string
  sortCode: string
  iban: string
  swiftBic: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  transferType: "ACH" | "Wire" | ""
  checkingOrSavings: "checking" | "savings" | ""
}

export const EMPTY_RECIPIENT_FORM: RecipientFormData = {
  name: "",
  accountNumber: "",
  bankName: "",
  currency: "USD",
  routingNumber: "",
  sortCode: "",
  iban: "",
  swiftBic: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  transferType: "",
  checkingOrSavings: "",
}

export function recipientFormFromRow(r: RecipientRow): RecipientFormData {
  return {
    name: r.full_name || "",
    accountNumber: r.account_number || "",
    bankName: r.bank_name || "",
    currency: r.currency || "USD",
    routingNumber: r.routing_number || "",
    sortCode: r.sort_code || "",
    iban: r.iban || "",
    swiftBic: r.swift_bic || "",
    addressLine1: r.address_line1 || "",
    addressLine2: r.address_line2 || "",
    city: r.city || "",
    state: r.state || "",
    postalCode: r.postal_code || "",
    transferType: r.transfer_type || "",
    checkingOrSavings: r.checking_or_savings || "",
  }
}

function fieldToStateKey(field: string): keyof RecipientFormData {
  const map: Record<string, keyof RecipientFormData> = {
    account_name: "name",
    routing_number: "routingNumber",
    account_number: "accountNumber",
    bank_name: "bankName",
    sort_code: "sortCode",
    iban: "iban",
    swift_bic: "swiftBic",
    address_line1: "addressLine1",
    address_line2: "addressLine2",
    city: "city",
    state: "state",
    postal_code: "postalCode",
    checking_or_savings: "checkingOrSavings",
  }
  return map[field] ?? "name"
}

export function isRecipientFormValid(form: RecipientFormData, submitting: boolean): boolean {
  if (!form.name.trim() || !form.bankName.trim() || submitting) return false
  const accountConfig = getAccountTypeConfigFromCurrency(form.currency)
  if (accountConfig.accountType === "us" && (!form.transferType || !form.checkingOrSavings)) return false
  for (const field of accountConfig.requiredFields) {
    const key = fieldToStateKey(field)
    if (!form[key]?.trim()) return false
  }
  return true
}

export function recipientFormToApiBody(form: RecipientFormData) {
  return {
    fullName: form.name.trim(),
    accountNumber: form.accountNumber.trim(),
    bankName: form.bankName.trim(),
    currency: form.currency,
    routingNumber: form.routingNumber.trim() || undefined,
    sortCode: form.sortCode.trim() || undefined,
    iban: form.iban.trim() || undefined,
    swiftBic: form.swiftBic.trim() || undefined,
    addressLine1: form.addressLine1.trim() || undefined,
    addressLine2: form.addressLine2.trim() || undefined,
    city: form.city.trim() || undefined,
    state: form.state.trim() || undefined,
    postalCode: form.postalCode.trim() || undefined,
    transferType: form.transferType || undefined,
    checkingOrSavings: form.checkingOrSavings || undefined,
  }
}
