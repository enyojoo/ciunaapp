import type { SupabaseClient } from "@supabase/supabase-js"
import { bitbankerEnvironment } from "./config"
import { readVerifiedForSbp, type PartnerClientRecord } from "./partner-clients"

export async function getOrCreateClientRef(
  admin: SupabaseClient,
  userId: string,
): Promise<{ id: string; client_id: string; is_verified_for_sbp: boolean }> {
  const environment = bitbankerEnvironment()
  const { data: existing } = await admin
    .from("bitbanker_client_refs")
    .select("id, client_id, is_verified_for_sbp")
    .eq("user_id", userId)
    .eq("environment", environment)
    .maybeSingle()

  if (existing) return existing

  const client_id = `ciuna_${userId.replace(/-/g, "").slice(0, 24)}_${environment.slice(0, 4)}`
  const { data, error } = await admin
    .from("bitbanker_client_refs")
    .insert({
      user_id: userId,
      environment,
      client_id,
      is_verified_for_sbp: false,
    })
    .select("id, client_id, is_verified_for_sbp")
    .single()

  if (error) throw error
  return data
}

export async function applyPartnerClientSnapshot(
  admin: SupabaseClient,
  userId: string,
  clientId: string,
  record: PartnerClientRecord,
): Promise<void> {
  const environment = bitbankerEnvironment()
  const verified = readVerifiedForSbp(record)
  await admin
    .from("bitbanker_client_refs")
    .upsert(
      {
        user_id: userId,
        environment,
        client_id: clientId,
        is_verified_for_sbp: verified,
        last_checked_at: new Date().toISOString(),
        provider_snapshot: record,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,environment" },
    )
}

export async function isUserVerifiedForSbp(admin: SupabaseClient, userId: string): Promise<boolean> {
  const environment = bitbankerEnvironment()
  const { data } = await admin
    .from("bitbanker_client_refs")
    .select("is_verified_for_sbp")
    .eq("user_id", userId)
    .eq("environment", environment)
    .maybeSingle()
  return Boolean(data?.is_verified_for_sbp)
}

export async function insertWebhookInbox(
  admin: SupabaseClient,
  channel: "payments" | "events",
  payload: Record<string, unknown>,
): Promise<{ id: string; duplicate: boolean }> {
  const crypto = await import("crypto")
  const payload_hash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex")
  const { data, error } = await admin
    .from("bitbanker_webhook_inbox")
    .insert({ channel, payload_hash, payload })
    .select("id")
    .single()

  if (error) {
    if (String(error.code) === "23505") {
      return { id: "", duplicate: true }
    }
    throw error
  }
  return { id: data.id, duplicate: false }
}
