/**
 * Smoke: POST /api/v1/kyc-request on Bitbanker DEV (unsigned).
 *   cd api && npx tsx scripts/bitbanker-kyc-request-smoke.ts
 */
import dotenv from "dotenv"

dotenv.config({ path: ".env" })

async function main() {
  const { bitbankerApiBaseUrl, bitbankerEnvironment, isBitbankerConfigured } = await import(
    "../lib/bitbanker/config"
  )
  const { requestHostedKycSession } = await import("../lib/bitbanker/kyc-bridge")

  if (!isBitbankerConfigured()) {
    throw new Error("Missing BITBANKER_API_KEY / BITBANKER_API_SECRET")
  }

  console.log("Environment:", bitbankerEnvironment())
  console.log("API base:", bitbankerApiBaseUrl())

  const externalClientRef = `ciuna_kyc_smoke_${Date.now().toString(36)}`
  const email = process.env.BITBANKER_KYC_SMOKE_EMAIL?.trim() || "enyocreative+kyc-smoke@gmail.com"

  console.log("POST /api/v1/kyc-request", { external_client_ref: externalClientRef, email })

  const res = await requestHostedKycSession({ externalClientRef, email })
  const kycUrl = String(res.kyc_url ?? "").trim()
  const looksSumsub = /sumsub|sns-host|in\.sumsub/i.test(kycUrl)

  console.log(
    JSON.stringify(
      {
        provider: res.provider ?? null,
        hasKycUrl: Boolean(kycUrl),
        looksSumsub,
        hasPaymentUrl: Boolean(res.payment_url),
        kyc_url: kycUrl || null,
        payment_url: res.payment_url ?? null,
        rawKeys: Object.keys(res || {}),
      },
      null,
      2,
    ),
  )

  if (!kycUrl) {
    throw new Error("kyc-request succeeded but returned no kyc_url")
  }
  console.log("bitbanker-kyc-request-smoke: OK")
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e)
  if (e && typeof e === "object") {
    const err = e as { status?: number; body?: unknown }
    if (err.status != null) console.error("status:", err.status)
    if (err.body != null) console.error("body:", JSON.stringify(err.body, null, 2))
  }
  process.exit(1)
})
