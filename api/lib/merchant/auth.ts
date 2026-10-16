import type { NextRequest } from "next/server"
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils"
import { createServerClient } from "@/lib/supabase"
import { assert, check } from "./errors"
import { can, type MerchantPermission, type MerchantRole } from "./permissions"

export interface MerchantRow {
  id: string
  type: "store" | "expert"
  slug: string
  display_name: string
  legal_name: string | null
  country: string
  operating_country: string
  languages: string[]
  default_language: string
  default_currency: string
  status: string
  kyb_tier: number
  logo_url: string | null
  cover_url: string | null
  /** IANA zone (migration 20261017140000); absent until that SQL is applied. */
  time_zone?: string
  description: Record<string, string>
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  draft_answers: Record<string, any>
  rejection_reason: string | null
  submitted_at: string | null
  approved_at: string | null
  office_managed: boolean
  created_at: string
  updated_at: string
}

export interface MerchantContext {
  user: AuthenticatedUser
  merchant: MerchantRow
  role: MerchantRole
}

export const MERCHANT_HEADER = "x-merchant-id"

export async function listMyMerchants(userId: string): Promise<Array<{ merchant: MerchantRow; role: MerchantRole }>> {
  const { data, error } = await createServerClient()
    .from("merchant_members")
    .select("role, merchants(*)")
    .eq("user_id", userId)
  check(error)
  return (data || [])
    .filter((r: any) => r.merchants)
    .map((r: any) => ({ merchant: r.merchants as MerchantRow, role: r.role as MerchantRole }))
}

/**
 * Resolve the acting merchant for a request. The merchant is named by the `x-merchant-id` header (or `merchantId`
 * query param); membership is always checked server-side. A user with exactly one merchant needs no header.
 */
export async function requireMerchant(
  request: NextRequest,
  permission?: MerchantPermission,
  opts: { allowStatuses?: string[] } = {},
): Promise<MerchantContext> {
  const user = await requireAuth(request)
  const requested = request.headers.get(MERCHANT_HEADER) || new URL(request.url).searchParams.get("merchantId")
  const mine = await listMyMerchants(user.id)
  assert(mine.length > 0, "NO_MERCHANT", 403)
  let pick: { merchant: MerchantRow; role: MerchantRole } | undefined
  if (requested) {
    pick = mine.find((m) => m.merchant.id === requested)
    assert(pick, "NOT_A_MEMBER", 403)
  } else {
    assert(mine.length === 1, "MERCHANT_REQUIRED", 400)
    pick = mine[0]
  }
  if (permission) assert(can(pick.role, permission), "FORBIDDEN", 403, { permission })
  if (opts.allowStatuses) assert(opts.allowStatuses.includes(pick.merchant.status), "MERCHANT_STATUS_NOT_ALLOWED", 409, { status: pick.merchant.status })
  return { user, merchant: pick.merchant, role: pick.role }
}

/** Selling actions (catalog edits that go live, accepting orders) need an approved, live-or-paused merchant. */
export const OPERATING_STATUSES = ["live", "paused"]
