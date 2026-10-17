/** Shows only the last four characters of an account number or IBAN: "···· 4821". */
export function maskAccount(account: unknown): string {
  const compact = String(account ?? "").replace(/\s+/g, "")
  if (!compact) return ""
  return compact.length < 4 ? "····" : `···· ${compact.slice(-4)}`
}
