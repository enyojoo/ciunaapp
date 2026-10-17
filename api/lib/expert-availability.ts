export type ServicePrice = { pricing_type?: string | null; hourly_rate?: number | string | null; hourly_currency?: string | null; fixed_amount?: number | string | null; fixed_currency?: string | null }

export type FromPrice = { amount: number; currency: string; per: "hour" | null } | { quote: true }

/** The lowest price an expert's services start at: hourly first, then fixed, then "custom quote". */
export function fromPrice(rows: ServicePrice[]): FromPrice | null {
  let hourly: { amount: number; currency: string } | null = null
  let fixed: { amount: number; currency: string } | null = null
  for (const r of rows) {
    if (r.pricing_type === "hourly" && r.hourly_rate != null && r.hourly_currency) {
      const amount = Number(r.hourly_rate)
      if (Number.isFinite(amount) && amount >= 0 && (!hourly || amount < hourly.amount)) hourly = { amount, currency: String(r.hourly_currency).toUpperCase() }
    }
    if (r.pricing_type === "fixed" && r.fixed_amount != null && r.fixed_currency) {
      const amount = Number(r.fixed_amount)
      if (Number.isFinite(amount) && amount >= 0 && (!fixed || amount < fixed.amount)) fixed = { amount, currency: String(r.fixed_currency).toUpperCase() }
    }
  }
  if (hourly) return { ...hourly, per: "hour" }
  if (fixed) return { ...fixed, per: null }
  return rows.some((r) => r.pricing_type === "quote") ? { quote: true } : null
}

/**
 * The earliest bookable time per expert. A slot counts when it is available and starts after the service's own lead
 * time (default 2 hours), so the card never promises a time the booking screen would refuse.
 */
export function nextAvailable(
  slots: { expert_service_id: string; slot_start: string }[],
  services: { id: string; expert_profile_id: string; booking_lead_minutes?: number | null }[],
  now: number = Date.now(),
): Map<string, string> {
  const byService = new Map(services.map((s) => [s.id, s]))
  const best = new Map<string, number>()
  for (const sl of slots) {
    const svc = byService.get(sl.expert_service_id)
    if (!svc) continue
    const start = new Date(sl.slot_start).getTime()
    if (!Number.isFinite(start) || start <= now + Number(svc.booking_lead_minutes ?? 120) * 60_000) continue
    const cur = best.get(svc.expert_profile_id)
    if (cur === undefined || start < cur) best.set(svc.expert_profile_id, start)
  }
  return new Map([...best].map(([id, ms]) => [id, new Date(ms).toISOString()]))
}
