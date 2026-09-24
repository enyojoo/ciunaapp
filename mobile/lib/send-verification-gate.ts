import Constants from "expo-constants"
import { isBitbankerSendVerificationGateEnabled } from "@ciuna/shared"

/** Mobile send flow: Bitbanker verification banner + continue block. */
export function isSendVerificationGateEnabled(): boolean {
  const extra = Constants.expoConfig?.extra as { sendVerificationGateOff?: boolean } | undefined
  if (extra?.sendVerificationGateOff === true) return false
  return isBitbankerSendVerificationGateEnabled()
}
