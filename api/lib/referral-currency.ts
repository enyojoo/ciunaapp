/**
 * Convert amount using active exchange_rates rows (same idea as admin volume).
 */
export function buildRateMap(
  exchangeRates: { from_currency: string; to_currency: string; rate: number; status: string }[],
): Map<string, number> {
  const rateMap = new Map<string, number>()
  exchangeRates
    .filter((r) => r.status === "active")
    .forEach((r) => {
      rateMap.set(`${r.from_currency}_${r.to_currency}`, r.rate)
    })
  return rateMap
}

export function convertWithRateMap(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rateMap: Map<string, number>,
): number {
  if (fromCurrency === toCurrency) return amount
  const directKey = `${fromCurrency}_${toCurrency}`
  const directRate = rateMap.get(directKey)
  if (directRate) return amount * directRate
  const reverseKey = `${toCurrency}_${fromCurrency}`
  const reverseRate = rateMap.get(reverseKey)
  if (reverseRate && reverseRate > 0) return amount / reverseRate
  return 0
}
