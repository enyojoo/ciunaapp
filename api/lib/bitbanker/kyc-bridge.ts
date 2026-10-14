import { bitbankerRequest } from "./client"

export type KycRequestResponse = {
  kyc_url?: string
  payment_url?: string
  provider?: string
  partner_client_id?: number | string
  reason?: string | null
}

/**
 * Bitbanker DEV currently returns `kyc_url` on `ext-api.../latest/partner-kyc/{jwt}` which
 * responds 404 HTML "Not Found". The JWT payload includes `redirect_url` on
 * `ext-kyc.dev.bitbanker.ru` which serves the Sumsub widget (HTTP 200). Prefer that.
 */
export function resolveBitbankerKycOpenUrl(kycUrl: string): {
  openUrl: string
  provider: string | null
  usedRedirectFromToken: boolean
} {
  const trimmed = kycUrl.trim()
  let provider: string | null = null
  try {
    const path = new URL(trimmed).pathname
    const token = path.includes("/partner-kyc/")
      ? path.split("/partner-kyc/").pop() || ""
      : ""
    const payloadB64 = token.split(".")[1]
    if (payloadB64) {
      const json = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      )
      const payload = JSON.parse(json) as {
        redirect_url?: string
        mode?: string
      }
      if (payload.mode) provider = String(payload.mode)
      const redirect = String(payload.redirect_url || "").trim()
      if (redirect.startsWith("https://")) {
        return { openUrl: redirect, provider, usedRedirectFromToken: true }
      }
    }
  } catch {
    // fall through — use original URL
  }
  return { openUrl: trimmed, provider, usedRedirectFromToken: false }
}

/** POST /api/v1/kyc-request — unsigned request and response per Bitbanker contract. */
export async function requestHostedKycSession(input: {
  externalClientRef: string
  email: string
}): Promise<KycRequestResponse> {
  return bitbankerRequest<KycRequestResponse>({
    method: "POST",
    path: "/api/v1/kyc-request",
    body: {
      external_client_ref: input.externalClientRef,
      email: input.email.trim(),
    },
    signBody: false,
    verifyResponse: false,
  })
}
