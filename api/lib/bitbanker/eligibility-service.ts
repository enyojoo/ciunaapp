import type { SupabaseClient } from "@supabase/supabase-js"
import { isBitbankerSendVerificationGateEnabled } from "@ciuna/shared"
import { isBitbankerConfigured } from "./config"
import { getPartnerClient } from "./partner-clients"
import { applyPartnerClientSnapshot, getOrCreateClientRef, isUserVerifiedForSbp } from "./db"

export type EligibilityStatus =
  | "unconfigured"
  | "not_started"
  | "checking"
  | "verified"
  | "not_verified"
  | "unavailable"

export async function getEligibilityForUser(
  admin: SupabaseClient,
  userId: string,
  options?: { refresh?: boolean },
): Promise<{
  status: EligibilityStatus
  isVerifiedForSbp: boolean
  clientId: string | null
}> {
  if (!isBitbankerConfigured()) {
    return { status: "unconfigured", isVerifiedForSbp: false, clientId: null }
  }

  const ref = await getOrCreateClientRef(admin, userId)

  if (options?.refresh) {
    try {
      const remote = await getPartnerClient(ref.client_id)
      await applyPartnerClientSnapshot(admin, userId, ref.client_id, remote)
    } catch {
      return {
        status: "unavailable",
        isVerifiedForSbp: ref.is_verified_for_sbp,
        clientId: ref.client_id,
      }
    }
  }

  const verified = options?.refresh
    ? await isUserVerifiedForSbp(admin, userId)
    : ref.is_verified_for_sbp

  if (verified) {
    return { status: "verified", isVerifiedForSbp: true, clientId: ref.client_id }
  }

  const { data: attempt } = await admin
    .from("bitbanker_verification_attempts")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (attempt?.status === "pending" || attempt?.status === "submitted") {
    return { status: "checking", isVerifiedForSbp: false, clientId: ref.client_id }
  }

  if (attempt?.status === "failed") {
    return { status: "not_verified", isVerifiedForSbp: false, clientId: ref.client_id }
  }

  return { status: "not_started", isVerifiedForSbp: false, clientId: ref.client_id }
}

export async function requireBitbankerEligible(admin: SupabaseClient, userId: string): Promise<void> {
  if (!isBitbankerSendVerificationGateEnabled()) return
  const { isVerifiedForSbp, status } = await getEligibilityForUser(admin, userId)
  if (!isVerifiedForSbp) {
    const err = new Error("Account verification required for send")
    ;(err as Error & { code: string; status: number }).code = "bitbanker_not_verified"
    ;(err as Error & { status: number }).status = 403
    ;(err as Error & { eligibilityStatus: string }).eligibilityStatus = status
    throw err
  }
}
