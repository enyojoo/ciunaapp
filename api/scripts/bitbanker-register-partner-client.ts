/**
 * Register a Ciuna user with Bitbanker partner-clients (sandbox/dev).
 *
 *   cd api && npx tsx scripts/bitbanker-register-partner-client.ts enyocreative@gmail.com
 *
 * Uses sandbox-looking RU passport test data. IDX may still set is_verified_for_sbp async.
 */
import dotenv from "dotenv"
import { validateBitbankerVerificationInput } from "@ciuna/shared"

dotenv.config({ path: ".env" })

const DEFAULT_FORM = {
  phone: "+79991234567",
  passportCountry: "RU",
  firstName: "Иван",
  lastName: "Тестов",
  patronymic: "Иванович",
  birthDate: "1990-01-15",
  passportNumber: "4010123456",
  passportIssueDate: "2015-06-01",
  consent: true,
}

async function findUserIdByEmail(admin: import("@supabase/supabase-js").SupabaseClient, email: string) {
  const target = email.trim().toLowerCase()
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.trim().toLowerCase() === target)
    if (hit?.id) return hit
    if (data.users.length < 200) break
    page += 1
  }
  return null
}

async function main() {
  const emailArg = process.argv[2]?.trim()
  if (!emailArg) {
    console.error("Usage: npx tsx scripts/bitbanker-register-partner-client.ts <user-email>")
    process.exit(1)
  }

  const { isBitbankerConfigured } = await import("../lib/bitbanker/config")
  if (!isBitbankerConfigured()) {
    console.error("Bitbanker is not configured in api/.env")
    process.exit(1)
  }

  const { createServerClient } = await import("../lib/supabase")
  const admin = createServerClient()
  const user = await findUserIdByEmail(admin, emailArg)
  if (!user) {
    console.error("No auth user found for email:", emailArg)
    process.exit(1)
  }

  const { getOrCreateClientRef, applyPartnerClientSnapshot } = await import("../lib/bitbanker/db")
  const { registerPartnerClient, getPartnerClient, readVerifiedForSbp } = await import(
    "../lib/bitbanker/partner-clients"
  )
  const { formatBitbankerApiError } = await import("../lib/bitbanker/client")

  const ref = await getOrCreateClientRef(admin, user.id)
  console.log("User id:", user.id)
  console.log("partner_client_external_id (client_id):", ref.client_id)

  const form = { ...DEFAULT_FORM, email: user.email ?? emailArg }
  const validated = validateBitbankerVerificationInput(form)
  if (!validated.ok) {
    console.error("Validation failed:", validated.errors)
    process.exit(1)
  }

  const idempotencyKey = `dev-register-${user.id}-${Date.now()}`
  try {
    const response = await registerPartnerClient(
      { client_id: ref.client_id, ...validated.partner },
      idempotencyKey,
    )
    await applyPartnerClientSnapshot(admin, user.id, ref.client_id, response)
    console.log("POST partner-clients: OK")
    console.log("is_verified_for_sbp (register response):", readVerifiedForSbp(response))
  } catch (e) {
    console.error("POST partner-clients failed:", formatBitbankerApiError(e))
    process.exit(1)
  }

  try {
    const remote = await getPartnerClient(ref.client_id)
    await applyPartnerClientSnapshot(admin, user.id, ref.client_id, remote)
    console.log("GET partner-clients: OK")
    console.log("is_verified_for_sbp (remote):", readVerifiedForSbp(remote))
    console.log(JSON.stringify(remote, null, 2))
  } catch (e) {
    console.warn("GET partner-clients after register:", formatBitbankerApiError(e))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
