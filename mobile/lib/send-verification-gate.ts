import Constants from "expo-constants"

const OFF = new Set(["0", "false", "off", "no"])

/** Mobile send flow: Bitbanker verification banner + continue block. */
export function isSendVerificationGateEnabled(): boolean {
  const extra = Constants.expoConfig?.extra as { sendVerificationGateOff?: boolean } | undefined
  if (extra?.sendVerificationGateOff === true) return false

  const fromEnv = process.env.EXPO_PUBLIC_CIUNA_SEND_VERIFICATION_GATE
  if (fromEnv != null && fromEnv !== "" && OFF.has(fromEnv.trim().toLowerCase())) {
    return false
  }
  return true
}
