/** Formatters for recipient bank-account fields. Mirrors web/lib/formatters.ts. */

export function formatRoutingNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9)
}

export function formatSortCode(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 6)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`
}

export function formatIBAN(value: string): string {
  const cleaned = value.replace(/\s/g, "").toUpperCase()
  return cleaned.replace(/(.{4})/g, "$1 ").trim()
}

export function formatAccountNumber(value: string): string {
  const digits = value.replace(/\D/g, "")
  return digits.replace(/(.{4})/g, "$1 ").trim()
}
