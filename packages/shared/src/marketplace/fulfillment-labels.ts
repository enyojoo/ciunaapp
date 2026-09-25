/** Format Office SLA timer strings (`H:MM:SS` or free text) for customer surfaces. */
export function formatSlaDuration(slaText: string | null | undefined): string | null {
  const raw = String(slaText || "").trim()
  if (!raw) return null
  const m = /^(\d+):(\d{1,2}):(\d{1,2})$/.exec(raw)
  if (!m) return raw
  const hours = Number(m[1])
  const minutes = Number(m[2])
  const seconds = Number(m[3])
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 && hours === 0) parts.push(`${seconds}s`)
  return parts.length ? parts.join(" ") : "0m"
}

export type ProductFulfillmentMode = "digital" | "delivery" | "pickup" | string

export function fulfillmentModeI18nKey(mode: ProductFulfillmentMode | null | undefined): string | null {
  if (!mode) return null
  if (mode === "digital" || mode === "delivery" || mode === "pickup") return `marketplace.${mode}`
  if (mode === "online_appointment" || mode === "in_person_appointment") return `marketplace.${mode}`
  return null
}

/** Catalog/PDP cue: delivery/pickup only — never surface “digital” on cards. */
export function catalogFulfillmentCueKey(mode: ProductFulfillmentMode | null | undefined): string | null {
  if (mode === "delivery" || mode === "pickup") return `marketplace.${mode}`
  return null
}
