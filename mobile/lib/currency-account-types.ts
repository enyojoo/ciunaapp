/**
 * Currency Account Type Utilities
 *
 * Determines account type and required fields based on currency code.
 * Mirrors web/lib/currency-account-types.ts so the mobile recipient form
 * collects the same fields the payout rails actually need.
 */

export type AccountType = "us" | "uk" | "euro" | "generic"

export interface AccountTypeConfig {
  accountType: AccountType
  requiredFields: string[]
  optionalFields: string[]
  fieldLabels: Record<string, string>
  fieldPlaceholders: Record<string, string>
  fieldFormatters?: Record<string, (value: string) => string>
}

export function getAccountTypeFromCurrency(currencyCode: string): AccountType {
  const code = currencyCode.toUpperCase()
  if (code === "USD") return "us"
  if (code === "GBP") return "uk"
  if (code === "EUR") return "euro"
  return "generic"
}

export function getAccountTypeConfig(accountType: AccountType): AccountTypeConfig {
  switch (accountType) {
    case "us":
      return {
        accountType: "us",
        requiredFields: [
          "routing_number",
          "account_number",
          "account_name",
          "bank_name",
          "address_line1",
          "city",
          "state",
          "postal_code",
          "checking_or_savings",
        ],
        optionalFields: ["address_line2"],
        fieldLabels: {
          routing_number: "Routing Number",
          account_number: "Account Number",
          account_name: "Account Name",
          bank_name: "Bank Name",
          address_line1: "Address Line 1",
          address_line2: "Address Line 2",
          city: "City",
          state: "State",
          postal_code: "ZIP Code",
          checking_or_savings: "Account Type",
        },
        fieldPlaceholders: {
          routing_number: "e.g., 123456789",
          account_number: "e.g., 1234567890",
          account_name: "e.g., Company Name LLC",
          bank_name: "e.g., Bank of America",
          address_line1: "e.g., 123 Main Street",
          address_line2: "e.g., Apt 4B (optional)",
          city: "e.g., New York",
          state: "e.g., NY",
          postal_code: "e.g., 10001",
          checking_or_savings: "Select account type",
        },
        fieldFormatters: {
          routing_number: (value: string) => value.replace(/\D/g, ""),
        },
      }

    case "uk":
      return {
        accountType: "uk",
        requiredFields: ["sort_code", "account_number", "account_name", "bank_name"],
        optionalFields: ["iban", "swift_bic"],
        fieldLabels: {
          sort_code: "Sort Code",
          account_number: "Account Number",
          iban: "IBAN",
          swift_bic: "SWIFT/BIC",
          account_name: "Account Name",
          bank_name: "Bank Name",
        },
        fieldPlaceholders: {
          sort_code: "e.g., 123456",
          account_number: "e.g., 12345678",
          iban: "e.g., GB82 WEST 1234 5698 7654 32",
          swift_bic: "e.g., NWBKGB2L",
          account_name: "e.g., Company Name Ltd",
          bank_name: "e.g., Barclays Bank",
        },
        fieldFormatters: {
          sort_code: (value: string) => value.replace(/\D/g, ""),
          iban: (value: string) => value.replace(/(.{4})/g, "$1 ").trim(),
        },
      }

    case "euro":
      return {
        accountType: "euro",
        requiredFields: ["iban", "account_name", "bank_name"],
        optionalFields: ["swift_bic"],
        fieldLabels: {
          iban: "IBAN",
          swift_bic: "SWIFT/BIC",
          account_name: "Account Name",
          bank_name: "Bank Name",
        },
        fieldPlaceholders: {
          iban: "e.g., DE89 3704 0044 0532 0130 00",
          swift_bic: "e.g., COBADEFFXXX",
          account_name: "e.g., Company Name GmbH",
          bank_name: "e.g., Deutsche Bank",
        },
        fieldFormatters: {
          iban: (value: string) => value.replace(/(.{4})/g, "$1 ").trim(),
        },
      }

    case "generic":
    default:
      return {
        accountType: "generic",
        requiredFields: ["account_number", "account_name", "bank_name"],
        optionalFields: [],
        fieldLabels: {
          account_number: "Account Number",
          account_name: "Account Name",
          bank_name: "Bank Name",
        },
        fieldPlaceholders: {
          account_number: "e.g., 1234567890",
          account_name: "e.g., Company Name",
          bank_name: "e.g., Bank Name",
        },
      }
  }
}

export function getAccountTypeConfigFromCurrency(currencyCode: string): AccountTypeConfig {
  return getAccountTypeConfig(getAccountTypeFromCurrency(currencyCode))
}

export function formatFieldValue(accountType: AccountType, fieldName: string, value: string): string {
  if (!value) return ""
  const formatter = getAccountTypeConfig(accountType).fieldFormatters?.[fieldName]
  return formatter ? formatter(value) : value
}
