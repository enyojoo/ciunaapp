import type { SupabaseClient } from "@supabase/supabase-js"
import { BITBANKER_KYC_LINK_TTL_MS, parseBitbankerKycBridgeError } from "@ciuna/shared"
import { BitbankerApiError } from "./client"
import { getOrCreateClientRef } from "./db"
import { requestHostedKycSession } from "./kyc-bridge"

export type KycSessionDto = {
  sessionId: string
  kycUrl: string
  paymentUrl: string | null
  provider: string | null
  expiresAt: string
  reused: boolean
  status: "active" | "expired"
}

export async function getActiveKycSession(
  admin: SupabaseClient,
  userId: string,
): Promise<KycSessionDto | null> {
  const now = new Date().toISOString()
  const { data } = await admin
    .from("bitbanker_kyc_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("bridge_status", "active")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.kyc_url) return null
  return {
    sessionId: data.id,
    kycUrl: data.kyc_url,
    paymentUrl: data.payment_url ?? null,
    provider: data.provider ?? null,
    expiresAt: data.expires_at,
    reused: true,
    status: "active",
  }
}

export async function startHostedKycSession(
  admin: SupabaseClient,
  userId: string,
  email: string,
): Promise<KycSessionDto> {
  const existing = await getActiveKycSession(admin, userId)
  if (existing) return existing

  const ref = await getOrCreateClientRef(admin, userId)
  const trimmedEmail = email.trim()
  if (!trimmedEmail) {
    throw new Error("Email is required for verification")
  }

  let response
  try {
    response = await requestHostedKycSession({
      externalClientRef: ref.client_id,
      email: trimmedEmail,
    })
  } catch (e) {
    if (e instanceof BitbankerApiError) {
      const parsed = parseBitbankerKycBridgeError(e.body)
      const err = new Error(parsed.message)
      ;(err as Error & { code: string; status: number }).code = parsed.code
      ;(err as Error & { status: number }).status = e.status
      throw err
    }
    throw e
  }

  const kycUrl = String(response.kyc_url ?? "").trim()
  if (!kycUrl) {
    throw new Error("Bitbanker did not return a verification link")
  }

  const expiresAt = new Date(Date.now() + BITBANKER_KYC_LINK_TTL_MS).toISOString()
  const paymentUrl = response.payment_url ? String(response.payment_url).trim() : null
  const provider = response.provider ? String(response.provider).trim() : null

  await admin
    .from("bitbanker_kyc_sessions")
    .update({ bridge_status: "superseded", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("bridge_status", "active")

  const { data: row, error } = await admin
    .from("bitbanker_kyc_sessions")
    .insert({
      user_id: userId,
      client_ref_id: ref.id,
      external_client_ref: ref.client_id,
      kyc_url: kycUrl,
      payment_url: paymentUrl,
      provider,
      bridge_status: "active",
      expires_at: expiresAt,
      raw_response: response as Record<string, unknown>,
    })
    .select("id, expires_at")
    .single()

  if (error) throw error

  return {
    sessionId: row.id,
    kycUrl,
    paymentUrl,
    provider,
    expiresAt: row.expires_at,
    reused: false,
    status: "active",
  }
}

export async function expireStaleKycSessions(admin: SupabaseClient, userId: string): Promise<void> {
  const now = new Date().toISOString()
  await admin
    .from("bitbanker_kyc_sessions")
    .update({ bridge_status: "expired", updated_at: now })
    .eq("user_id", userId)
    .eq("bridge_status", "active")
    .lte("expires_at", now)
}
