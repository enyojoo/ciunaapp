const OFF = new Set(["0", "false", "off", "no"])

function readEnvOff(value: string | undefined): boolean {
  if (value == null || value === "") return false
  return OFF.has(value.trim().toLowerCase())
}

/**
 * Bitbanker SBP identity gate on send (UI + API).
 * Set CIUNA_SEND_VERIFICATION_GATE=off on API; EXPO_PUBLIC_/NEXT_PUBLIC_ on clients.
 * Re-enable by removing the var or setting to on/1/true.
 *
 * Use static process.env.* reads so Metro/Next can inline public vars.
 */
export function isBitbankerSendVerificationGateEnabled(): boolean {
  if (readEnvOff(process.env.CIUNA_SEND_VERIFICATION_GATE)) return false
  if (readEnvOff(process.env.EXPO_PUBLIC_CIUNA_SEND_VERIFICATION_GATE)) return false
  if (readEnvOff(process.env.NEXT_PUBLIC_CIUNA_SEND_VERIFICATION_GATE)) return false
  return true
}
