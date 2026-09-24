const OFF = new Set(["0", "false", "off", "no"])

function readEnvOff(value: string | undefined): boolean {
  if (value == null || value === "") return false
  return OFF.has(value.trim().toLowerCase())
}

function firstGateEnv(): string | undefined {
  const v =
    process.env.CIUNA_SEND_VERIFICATION_GATE ??
    process.env.EXPO_PUBLIC_CIUNA_SEND_VERIFICATION_GATE ??
    process.env.NEXT_PUBLIC_CIUNA_SEND_VERIFICATION_GATE
  if (v == null || v === "") return undefined
  return v
}

/**
 * Bitbanker SBP identity gate on send (UI + API).
 * Explicit off: CIUNA_SEND_VERIFICATION_GATE / EXPO_PUBLIC_ / NEXT_PUBLIC_ = off|0|false|no
 * Explicit on: any other non-empty value (e.g. on, 1, true)
 * Unset: on in production, off in development (send flow shape / sandbox work)
 */
export function isBitbankerSendVerificationGateEnabled(): boolean {
  const raw = firstGateEnv()
  if (raw != null) {
    if (readEnvOff(raw)) return false
    return true
  }
  return process.env.NODE_ENV === "production"
}
