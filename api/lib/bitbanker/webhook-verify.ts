import { bitbankerCredentials } from "./config"
import { verifyFullSign } from "./signing"

export function verifyBitbankerWebhook(payload: Record<string, unknown>): boolean {
  if (!("full_sign" in payload) && !("sign" in payload)) {
    return false
  }
  try {
    const { apiSecret } = bitbankerCredentials()
    return verifyFullSign(payload, apiSecret)
  } catch {
    return false
  }
}
