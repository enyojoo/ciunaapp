/** ISO 3166-1 alpha-2 for {@link FlagIcon} / nucleo-flags when currency has a primary flag country. */
export const CURRENCY_FLAG_COUNTRY: Record<string, string> = {
  USD: "US",
  GBP: "GB",
  RUB: "RU",
  NGN: "NG",
  KES: "KE",
  GHS: "GH",
  ZAR: "ZA",
  INR: "IN",
  PKR: "PK",
  BDT: "BD",
  PHP: "PH",
  IDR: "ID",
  MYR: "MY",
  SGD: "SG",
  THB: "TH",
  VND: "VN",
  CNY: "CN",
  JPY: "JP",
  KRW: "KR",
  BRL: "BR",
  MXN: "MX",
  ARS: "AR",
  COP: "CO",
  PEN: "PE",
  CAD: "CA",
  AUD: "AU",
  NZD: "NZ",
  CHF: "CH",
  TRY: "TR",
  UAH: "UA",
  PLN: "PL",
  CZK: "CZ",
  SEK: "SE",
  NOK: "NO",
  DKK: "DK",
  AED: "AE",
  SAR: "SA",
  EGP: "EG",
  MAD: "MA",
  TZS: "TZ",
  UGX: "UG",
  RWF: "RW",
  XOF: "SN",
  XAF: "CM",
}

export function flagCountryForCurrency(code: string | null | undefined): string | null {
  const c = String(code || "")
    .trim()
    .toUpperCase()
  if (!c) return null
  return CURRENCY_FLAG_COUNTRY[c] ?? null
}
