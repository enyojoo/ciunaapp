/**
 * Sandbox smoke checks for Bitbanker adapter (run from api/ with env loaded).
 *
 *   cd api && npx tsx scripts/bitbanker-smoke.ts
 *
 * Requires BITBANKER_* vars in api/.env. Does not mutate Ciuna DB.
 */
import { isBitbankerConfigured, bitbankerApiBaseUrl, bitbankerEnvironment } from "../lib/bitbanker/config"
import { getPartnerClient } from "../lib/bitbanker/partner-clients"

async function main() {
  if (!isBitbankerConfigured()) {
    console.error("Bitbanker is not configured (missing BITBANKER_* env).")
    process.exit(1)
  }
  console.log("Environment:", bitbankerEnvironment())
  console.log("API base:", bitbankerApiBaseUrl())

  const testClientId = process.env.BITBANKER_SMOKE_CLIENT_ID?.trim()
  if (!testClientId) {
    console.log("Set BITBANKER_SMOKE_CLIENT_ID to run GET partner-client smoke.")
    console.log("Configured OK.")
    return
  }

  const client = await getPartnerClient(testClientId)
  console.log("Partner client snapshot:", JSON.stringify(client, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
