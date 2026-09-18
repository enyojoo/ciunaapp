import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { findReferrerRowBySlug } from "@/lib/referral-lookup"

type AuthWebhookUser = {
  id?: string
  email_confirmed_at?: string | null
  raw_user_meta_data?: {
    referral_slug?: string | null
    referralSlug?: string | null
  } | null
}

async function attributeReferralFromAuthRecord(
  serverClient: ReturnType<typeof createServerClient>,
  record: AuthWebhookUser | undefined
) {
  const userId = record?.id
  if (!userId) return

  const rawReferralSlug = record?.raw_user_meta_data?.referral_slug ?? record?.raw_user_meta_data?.referralSlug
  const slug = typeof rawReferralSlug === "string" ? rawReferralSlug.trim() : ""
  if (!slug) return

  const referrer = await findReferrerRowBySlug(serverClient, slug)

  if (!referrer?.id) {
    console.warn("Referral attribution skipped: unknown referrer slug", { userId, slug })
    return
  }

  if (referrer.id === userId) {
    console.warn("Referral attribution skipped: self-referral", { userId, slug })
    return
  }

  const { data: updated, error: updateErr } = await serverClient
    .from("users")
    .update({
      referred_by_user_id: referrer.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .is("referred_by_user_id", null)
    .select("id")
    .maybeSingle()

  if (updateErr) {
    throw updateErr
  }

  if (updated?.id) {
    console.log("Referral attributed successfully", { userId, referrerId: referrer.id, slug })
    return
  }

  const { data: existing } = await serverClient
    .from("users")
    .select("id, referred_by_user_id")
    .eq("id", userId)
    .maybeSingle()

  if (!existing) {
    console.log("Referral attribution deferred: users row not found yet", { userId, slug })
    return
  }

  if (existing.referred_by_user_id) {
    console.log("Referral already attributed", { userId, referrerId: existing.referred_by_user_id })
    return
  }

  console.warn("Referral attribution skipped: users row exists but update matched nothing", { userId, slug })
}

function isAuthorizedWebhook(request: NextRequest): boolean {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) return false
  const header =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("authorization")
  if (!header) return false
  if (header === secret) return true
  if (header === `Bearer ${secret}`) return true
  return false
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedWebhook(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    const { type, record } = payload as { type?: string; record?: AuthWebhookUser }

    console.log("Supabase Auth Webhook received:", { type, userId: record?.id })

    const serverClient = createServerClient()

    // Best-effort server-side referral attribution from auth metadata.
    // This avoids relying on browser storage/session timing and works on both user.created
    // and later email-confirmation updates.
    if (type === "user.created" || (type === "user.updated" && record?.email_confirmed_at)) {
      await attributeReferralFromAuthRecord(serverClient, record)
    }

    // Handle user email confirmation
    if (type === "user.updated" && record?.email_confirmed_at) {
      console.log("User email confirmed, updating verification status:", record.id)

      // Update verification status to 'verified' in users table
      const { error } = await serverClient
        .from("users")
        .update({
          // verification_status removed - email verification is handled by email_confirmed_at in auth.users
          updated_at: new Date().toISOString()
        })
        .eq("id", record.id)

      if (error) {
        console.error("Error updating verification status:", error)
        return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 })
      }

      console.log("Verification status updated successfully for user:", record.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
