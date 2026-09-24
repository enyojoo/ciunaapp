/**
 * Read-only Bitbanker connectivity check (no invoices, no verification).
 *
 *   cd api && npx tsx scripts/bitbanker-connectivity.ts
 *
 * Optional:
 *   BITBANKER_TEST_CLIENT_ID=<partner client id>  — signed GET partner-clients
 *   BITBANKER_SMOKE_SEND_INVOICE=1                — POST sandbox send invoice (B=1000, idempotent key)
 */
import dotenv from "dotenv"
import crypto from "node:crypto"

dotenv.config({ path: ".env" })

async function main() {
  const { bitbankerApiBaseUrl, bitbankerEnvironment, isBitbankerConfigured } = await import(
    "../lib/bitbanker/config"
  )
  if (!isBitbankerConfigured()) {
    console.error("Missing BITBANKER_API_KEY / BITBANKER_API_SECRET")
    process.exit(1)
  }

  console.log("Environment:", bitbankerEnvironment())
  console.log("API base:", bitbankerApiBaseUrl())

  const { getPredictionSbp, exchangePrediction } = await import("../lib/bitbanker/prediction")

  const limits = await getPredictionSbp()
  const feePct = limits.sbp_fee_pct
  const feeAbs = limits.sbp_fee_abs
  console.log("GET prediction-sbp: OK", { sbp_fee_pct: feePct, sbp_fee_abs: feeAbs })

  const b = 10_000
  const prediction = await exchangePrediction({ volume: b })
  const g = Number(prediction.volume_give_prediction)
  const u = Number(prediction.volume_take_final)
  const fee = g - b
  if (!Number.isFinite(g) || !Number.isFinite(u)) {
    throw new Error("exchange-prediction missing volume_give_prediction or volume_take_final")
  }
  if (fee < 210) {
    throw new Error(`Expected G−B ≥ 210 for B=${b}, got ${fee}`)
  }
  console.log("POST exchange-prediction: OK", {
    B: b,
    G: g,
    U: u,
    bitbanker_fee_rub: Math.round(fee * 100) / 100,
  })

  const testClientId = String(process.env.BITBANKER_TEST_CLIENT_ID || "").trim()
  if (testClientId) {
    const { getPartnerClient } = await import("../lib/bitbanker/partner-clients")
    const client = await getPartnerClient(testClientId)
    console.log("GET partner-clients (signed): OK", {
      client_id: client.client_id ?? testClientId,
      is_verified_for_sbp: (client as Record<string, unknown>).is_verified_for_sbp,
    })
  } else {
    console.log("Skip signed GET partner-clients (set BITBANKER_TEST_CLIENT_ID to enable)")
  }

  if (process.env.BITBANKER_SMOKE_SEND_INVOICE === "1") {
    if (!testClientId) {
      throw new Error("BITBANKER_SMOKE_SEND_INVOICE requires BITBANKER_TEST_CLIENT_ID")
    }
    const { createBitbankerSendInvoice, readSbpQrPayload } = await import("../lib/bitbanker/invoices")
    const idempotencyKey = `ciuna-smoke-${crypto.createHash("sha256").update(testClientId).digest("hex").slice(0, 16)}`
    const invoice = await createBitbankerSendInvoice(
      {
        partnerClientExternalId: testClientId,
        invoiceBaseB: 1000,
        description: "Ciuna connectivity smoke",
      },
      idempotencyKey,
    )
    const sbp = readSbpQrPayload(invoice)
    console.log("POST send invoice (SBP convert): OK", {
      invoice_id: invoice.id,
      sbp_amount: sbp.amount,
      has_link: Boolean(sbp.link),
    })
  } else {
    console.log("Skip send invoice smoke (set BITBANKER_SMOKE_SEND_INVOICE=1 to enable)")
  }
}

main().catch((e) => {
  console.error("Bitbanker connectivity failed:", e instanceof Error ? e.message : e)
  process.exit(1)
})
