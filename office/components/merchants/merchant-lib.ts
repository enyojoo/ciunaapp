import { officeFetch } from "@/lib/api-client"

export const ERROR_TEXT: Record<string, string> = {
  DOCUMENTS_NOT_APPROVED: "Approve every document before approving the merchant.",
  REASON_REQUIRED: "A reason is required.",
  MERCHANT_STATUS_NOT_ALLOWED: "This merchant is not in a state that allows that action.",
  NO_OPEN_APPLICATION: "There is no open application to decide on.",
  DOCUMENT_NOT_FOUND: "Document not found.",
  COUNTRY_INVALID: "Country must be * or a 2-letter code.",
  TYPE_INVALID: "Merchant type must be store, expert or *.",
  TIER_INVALID: "Tier must be 1 or 2.",
  REQUIREMENTS_INVALID: "Requirements are invalid.",
  NOTHING_TO_UPDATE: "Nothing to update.",
  DATABASE_ERROR: "Something went wrong on our side. Try again.",
  FORBIDDEN: "Your role can't do that.",
  CLAIMED_BY_OTHER: "Someone else already claimed this.",
  NOT_FOUND: "This item is no longer in the queue.",
  QUEUES_NOT_AVAILABLE: "Queues are not set up on this environment yet.",
  VIEWS_NOT_AVAILABLE: "Saved views are not set up on this environment yet.",
  TOO_MANY_VIEWS: "You have too many saved views here. Delete one first.",
  VIEW_NAME_INVALID: "Give the view a name of up to 60 characters.",
  VIEW_NOT_FOUND: "That view no longer exists.",
  LISTING_NOT_FOUND: "Listing not found.",
  LISTING_NOT_IN_REVIEW: "This listing is no longer in review.",
  REASON_TEMPLATE_REQUIRED: "Choose a reason.",
  SLA_INVALID: "That target is not valid.",
  UNAUTHORIZED: "Your session expired. Sign in again.",
  SUPPORT_NOT_FOUND: "This request no longer exists.",
  SUPPORT_CLOSED: "This request was resolved too long ago to reopen.",
  MESSAGE_EMPTY: "Write a reply first.",
  MESSAGE_TOO_LONG: "Replies are limited to 4000 characters.",
}

export function errorText(code?: string | null): string {
  if (!code) return "Something went wrong. Try again."
  return ERROR_TEXT[code] || `Request failed (${code}).`
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string; details?: Record<string, any> }

export async function api<T = any>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await officeFetch(path, init)
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const code: string | undefined = body?.errorCode || (res.status === 403 ? "FORBIDDEN" : res.status === 401 ? "UNAUTHORIZED" : undefined)
      return { ok: false, error: errorText(code), code, details: body?.details }
    }
    return { ok: true, data: body as T }
  } catch {
    return { ok: false, error: "Network error. Try again." }
  }
}

export function jsonBody(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "-"
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${date} • ${time}`
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export interface MerchantRow {
  id: string
  type: "store" | "expert"
  slug: string
  display_name: string
  legal_name?: string | null
  country: string
  operating_country: string
  languages?: string[]
  status: string
  kyb_tier: number
  contact_email?: string | null
  contact_phone?: string | null
  website?: string | null
  owner_team?: string
  rejection_reason?: string | null
  office_managed: boolean
  submitted_at: string | null
  approved_at: string | null
  created_at: string
  /** Owner of the open application (queue views). */
  owner?: { id: string; name: string | null; email: string | null; claimed_at: string | null; mine: boolean } | null
  sla?: { limit_hours: number; business?: boolean; waited_hours: number; over_by_hours: number | null; breached: boolean } | null
}

export const REJECTION_TEMPLATES = [
  "Documents are unreadable. Upload clear photos.",
  "Name on documents doesn't match the business name.",
  "We can't verify this business type yet.",
  "Missing required documents.",
]
