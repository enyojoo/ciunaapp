/** Bitbanker hosted KYC bridge (POST /api/v1/kyc-request). */

export type BitbankerKycBridgeErrorCode =
  | "kyc_bridge_disabled"
  | "access_locked_contact_manager"
  | "session_unavailable"
  | "unknown"

export type BitbankerKycSessionStatus = "none" | "active" | "expired" | "continue"

export function parseBitbankerKycBridgeError(body: unknown): {
  code: BitbankerKycBridgeErrorCode
  message: string
} {
  if (!body || typeof body !== "object") {
    return { code: "unknown", message: "Verification is temporarily unavailable." }
  }
  const rec = body as Record<string, unknown>
  const codeRaw = String(rec.code ?? rec.error ?? rec.error_code ?? "").trim()
  const lower = codeRaw.toLowerCase()
  if (lower.includes("kyc_bridge_disabled")) {
    return {
      code: "kyc_bridge_disabled",
      message: "Hosted verification is not enabled for this environment.",
    }
  }
  if (lower.includes("access_locked_contact_manager")) {
    return {
      code: "access_locked_contact_manager",
      message: "Account verification is locked. Contact support or your account manager.",
    }
  }
  const msg =
    (typeof rec.message === "string" && rec.message) ||
    (typeof rec.description === "string" && rec.description) ||
    codeRaw ||
    "Verification is temporarily unavailable."
  return { code: "unknown", message: msg }
}

/** Sumsub link reuse window documented as ~1 hour; do not extend on repeat requests. */
export const BITBANKER_KYC_LINK_TTL_MS = 60 * 60 * 1000
