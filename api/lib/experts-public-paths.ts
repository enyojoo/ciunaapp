/** User-facing expert catalog + profiles + booking (no `/hub/experts`). */

import { expertsPublicUrlSegment } from "@/lib/expert-public-segment"

export const EXPERTS_CATALOG_PATH = "/experts"

/** Full directory (“See all” from Featured), same cards as the Services grid. */
export const EXPERTS_BROWSE_PATH = "/experts/browse"

/** When set on `/experts/.../book/...`, the hero close falls back here if history cannot go back (e.g. cold open). */
export const EXPERTS_BOOK_FROM_QUERY = "from"
export const EXPERTS_BOOK_FROM_PROFILE = "profile"

/** Preserve entry context through in-flow navigations (profile vs catalog). */
export function appendExpertsBookEntryFrom(basePath: string, entryFromProfile: boolean): string {
  if (!entryFromProfile) return basePath
  const sep = basePath.includes("?") ? "&" : "?"
  return `${basePath}${sep}${EXPERTS_BOOK_FROM_QUERY}=${EXPERTS_BOOK_FROM_PROFILE}`
}

export function expertsProfilePath(profileOrSegment: string | { id: string; slug?: string | null }): string {
  const segment = typeof profileOrSegment === "string" ? profileOrSegment : expertsPublicUrlSegment(profileOrSegment)
  return `/experts/${encodeURIComponent(segment)}`
}

/** Canonical book URL for a specific published service (date/time + checkout live on this route). */
export function expertsBookServicePath(
  profileOrSegment: string | { id: string; slug?: string | null },
  serviceId: string,
  opts?: { slot?: string },
): string {
  const segment =
    typeof profileOrSegment === "string" ? profileOrSegment : expertsPublicUrlSegment(profileOrSegment)
  const sid = serviceId.trim()
  const base = `/experts/${encodeURIComponent(segment)}/book/${encodeURIComponent(sid)}`
  const slot = opts?.slot?.trim()
  return slot ? `${base}?slot=${encodeURIComponent(slot)}` : base
}

export function expertsBookPath(
  profileOrSegment: string | { id: string; slug?: string | null },
  slotQueryOrOpts?: string | { slot?: string; service?: string },
): string {
  const segment =
    typeof profileOrSegment === "string" ? profileOrSegment : expertsPublicUrlSegment(profileOrSegment)

  let slot: string | undefined
  let service: string | undefined
  if (typeof slotQueryOrOpts === "string") {
    slot = slotQueryOrOpts.trim() || undefined
  } else if (slotQueryOrOpts && typeof slotQueryOrOpts === "object") {
    slot = slotQueryOrOpts.slot?.trim() || undefined
    service = slotQueryOrOpts.service?.trim() || undefined
  }

  if (service) {
    return expertsBookServicePath(segment, service, slot ? { slot } : undefined)
  }

  const base = `/experts/${encodeURIComponent(segment)}/book`
  const params = new URLSearchParams()
  if (slot) params.set("slot", slot)
  const q = params.toString()
  return q ? `${base}?${q}` : base
}

/** Legacy bookmark URL (`/experts/checkout/[slotId]` redirects into `/experts/[slug]/book/[serviceId]?slot=`). */
export function expertsCheckoutPath(slotId: string, opts?: { service?: string }): string {
  const base = `/experts/checkout/${encodeURIComponent(slotId)}`
  const s = opts?.service?.trim()
  return s ? `${base}?service=${encodeURIComponent(s)}` : base
}

/** Header fallback: return to slot picker on the in-flow book route. */
export function expertsBookBackFromCheckout(
  profileOrSegment: string | { id: string; slug?: string | null },
  serviceId?: string | null,
): string {
  const sid = serviceId?.trim()
  return sid ? expertsBookServicePath(profileOrSegment, sid) : EXPERTS_CATALOG_PATH
}
