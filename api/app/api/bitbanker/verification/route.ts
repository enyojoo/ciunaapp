import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requireUser, withErrorHandling, createErrorResponse } from "@/lib/auth-utils"
import { isBitbankerConfigured } from "@/lib/bitbanker/config"
import { getOrCreateClientRef, applyPartnerClientSnapshot } from "@/lib/bitbanker/db"
import { registerPartnerClient, getPartnerClient } from "@/lib/bitbanker/partner-clients"
import { validateBitbankerVerificationInput, type BitbankerVerificationFormInput } from "@ciuna/shared"
import { buildBitbankerFormSnapshot } from "@/lib/bitbanker/form-snapshot"

type VerificationBody = BitbankerVerificationFormInput & {
  idempotencyKey?: string
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request)
  if (!isBitbankerConfigured()) {
    return createErrorResponse("Bitbanker integration is not configured", 503)
  }

  const body = (await request.json()) as VerificationBody
  const validated = validateBitbankerVerificationInput(body)
  if (!validated.ok) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors: validated.errors,
      },
      { status: 400 },
    )
  }

  const admin = createServerClient()
  const ref = await getOrCreateClientRef(admin, user.id)
  const idempotencyKey = body.idempotencyKey?.trim() || `verify-${user.id}-${ref.client_id}`

  const { data: existingAttempt } = await admin
    .from("bitbanker_verification_attempts")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle()

  if (existingAttempt?.status === "succeeded") {
    const remote = await getPartnerClient(ref.client_id).catch(() => null)
    if (remote) await applyPartnerClientSnapshot(admin, user.id, ref.client_id, remote)
    return NextResponse.json({ ok: true, clientId: ref.client_id, reused: true })
  }

  let attemptId = existingAttempt?.id
  if (!attemptId) {
    const { data: attempt, error } = await admin
      .from("bitbanker_verification_attempts")
      .insert({
        user_id: user.id,
        client_ref_id: ref.id,
        idempotency_key: idempotencyKey,
        status: "pending",
      })
      .select("id")
      .single()
    if (error) return createErrorResponse("Failed to start verification attempt", 500)
    attemptId = attempt.id
  }

  const formSnapshot = buildBitbankerFormSnapshot(body)
  const submittedAt = new Date().toISOString()

  const partnerBody = {
    client_id: ref.client_id,
    ...validated.partner,
  }

  await admin
    .from("bitbanker_verification_attempts")
    .update({
      status: "submitted",
      form_snapshot: formSnapshot,
      updated_at: submittedAt,
    })
    .eq("id", attemptId)

  try {
    const response = await registerPartnerClient(
      partnerBody as Parameters<typeof registerPartnerClient>[0],
      idempotencyKey,
    )
    await applyPartnerClientSnapshot(admin, user.id, ref.client_id, response)
    await admin
      .from("bitbanker_verification_attempts")
      .update({ status: "succeeded", updated_at: submittedAt })
      .eq("id", attemptId)
    await admin
      .from("bitbanker_client_refs")
      .update({
        last_form_snapshot: formSnapshot,
        last_form_submitted_at: submittedAt,
        updated_at: submittedAt,
      })
      .eq("id", ref.id)
    return NextResponse.json({ ok: true, clientId: ref.client_id })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Verification failed"
    await admin
      .from("bitbanker_verification_attempts")
      .update({
        status: "failed",
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
    return createErrorResponse(message, 502)
  }
})
